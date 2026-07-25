import axios from 'axios';
import pg from 'pg';
import dotenv from 'dotenv';
import cron from 'node-cron';
import path from 'path';
import { fileURLToPath } from 'url';
import MetaAdsToken from '../models/ads/meta-token.js';
import databaseConnection from '../config/database-connection.js';
import { getMetaUrl } from '../config/meta.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const BATCH_SIZE = 10;
const BATCH_ENDPOINT = 'https://enterprise-lms-api.degreefyd.com/api/leads/batch';

const META_VERSION = 'v21.0';
const BASE_URL = `https://graph.facebook.com/${META_VERSION}`;

const ENTERPRISE_URL = process.env.ENTERPRISE_URL;

const ACCOUNTS = [
  { page_id: '500516373142238', sourceName: 'FaceBook' },
  { page_id: '718284908040065', sourceName: 'FaceBook_University_Admit' }
];

function normalisePhone(phone) {
  if (!phone) return null;
  let p = String(phone).replace(/\D/g, '');
  if (p.length > 10) p = p.slice(-10);
  return p || null;
}

function normaliseEmail(email) {
  if (!email) return null;
  return String(email).trim().toLowerCase();
}

function makePool(url) {
  return new pg.Pool({
    connectionString: url,
    ssl: false,
    max: 3,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 15000,
  });
}

// ─── 1. Fetch ALL recent leads from Graph API ───
async function fetchRecentMetaLeads(pageAccessToken, pageId) {
  const now = Math.floor(Date.now() / 1000);
  const since = now - 24 * 60 * 60; // last 1 day
  const leads = [];

  const formsRes = await axios.get(`${BASE_URL}/${pageId}/leadgen_forms`, {
    params: { access_token: pageAccessToken, fields: 'id,name', limit: 100 },
  });
  const forms = formsRes.data?.data || [];

  for (const form of forms) {
    let url = `${BASE_URL}/${form.id}/leads`;
    let params = {
      access_token: pageAccessToken,
      fields: 'id,created_time,field_data',
      since: since,
      until: now,
      limit: 100,
    };

    while (url) {
      const res = await axios.get(url, { params });
      const data = res.data?.data || [];

      for (const lead of data) {
        const createdTs = Math.floor(new Date(lead.created_time).getTime() / 1000);
        if (createdTs < since) continue;

        const parsed = { lead_id: lead.id, created_time: lead.created_time, email: null, phone: null };
        for (const f of lead.field_data || []) {
          const val = f.values?.[0] || null;
          if (f.name === 'email') parsed.email = val;
          if (['phone_number', 'phone', 'mobile'].includes(f.name)) parsed.phone = val;
        }
        parsed.email = normaliseEmail(parsed.email);
        parsed.phone = normalisePhone(parsed.phone);
        leads.push(parsed);
      }

      const next = res.data?.paging?.next;
      url = next || null;
      params = {};
    }
  }

  return leads;
}

// ─── 2. Check which leads exist in Enterprise DB (batch check) ───
async function filterExistingLeads(pool, leads, pageAccessToken, sourceName) {
  if (!leads || leads.length === 0) return [];

  const emails = [...new Set(leads.map(l => l.email).filter(Boolean))];
  const phones = [...new Set(leads.map(l => l.phone).filter(Boolean))];

  if (emails.length === 0 && phones.length === 0) {
    return leads;
  }

  const conditions = [];
  const values = [];

  if (emails.length > 0) {
    values.push(emails);
    conditions.push(`student_email = ANY($${values.length})`);
  }
  if (phones.length > 0) {
    values.push(phones);
    conditions.push(`RIGHT(REGEXP_REPLACE(student_phone, '\\D', '', 'g'), 10) = ANY($${values.length})`);
  }

  const sql = `
    SELECT primary_student_id, student_email, RIGHT(REGEXP_REPLACE(student_phone, '\\D', '', 'g'), 10) AS clean_phone
    FROM "leads"
    WHERE ${conditions.join(' OR ')}
  `;

  try {
    const result = await pool.query(sql, values);
    const existingRows = result.rows || [];

    const existingByEmail = new Map();
    const existingByPhone = new Map();
    existingRows.forEach(r => {
      if (r.student_email) existingByEmail.set(normaliseEmail(r.student_email), r.primary_student_id);
      if (r.clean_phone) existingByPhone.set(normalisePhone(r.clean_phone), r.primary_student_id);
    });

    const finalMissingLeads = [];

    for (const lead of leads) {
      let primary_student_id = null;
      if (lead.email && existingByEmail.has(lead.email)) {
        primary_student_id = existingByEmail.get(lead.email);
      } else if (lead.phone && existingByPhone.has(lead.phone)) {
        primary_student_id = existingByPhone.get(lead.phone);
      }

      if (!primary_student_id) {
        // Completely new lead
        finalMissingLeads.push(lead);
      } else {
        // Existing lead, check latest activity
        try {
          const metaDetails = await fetchLeadDataWithCampaign(lead.lead_id, pageAccessToken);
          if (!metaDetails) {
            continue;
          }

          const utm_campaign = metaDetails.lead?.ad_name || '';

          const activitySql = `
            SELECT source, utm_campaign
            FROM "lead_activities"
            WHERE lead_id = $1
            ORDER BY created_at DESC
            LIMIT 1
          `;
          const activityResult = await pool.query(activitySql, [primary_student_id]);
          const latestActivity = activityResult.rows?.[0];

          if (latestActivity) {
            const sourceMatches = latestActivity.source === sourceName;
            const campaignMatches = latestActivity.utm_campaign === utm_campaign;

            if (sourceMatches && campaignMatches) {
              continue;
            }
          }

          finalMissingLeads.push(lead);

        } catch (err) {
        }
      }
    }

    return finalMissingLeads;
  } catch (err) {
    return leads;
  }
}

// ─── Formatting helpers for final payload ───
function extractFieldValue(fieldDataArray, possibleNames) {
  const lowerCaseNames = possibleNames.map(name => name.toLowerCase());
  const field = fieldDataArray?.find(f => lowerCaseNames.includes(f.name.trim().toLowerCase()));
  return field ? field.values[0] : null;
}

function extractAdditionalFields(fieldDataArray) {
  const standardFields = ['full_name', 'email', 'phone_number', 'city'];
  const additional = {};
  for (const field of fieldDataArray) {
    const key = field.name.trim().toLowerCase().replace(/\s+/g, '_');
    if (!standardFields.includes(key) && Array.isArray(field.values) && field.values.length > 0) {
      additional[field.name] = field.values[0];
    }
  }
  return additional;
}

function formatToQuestionAnswerArray(obj) {
  if (!obj) return [];
  return Object.entries(obj).map(([question, answer]) => ({
    question,
    answer
  }));
}

// ─── 3. Detailed Data Fetch ───
async function fetchLeadDataWithCampaign(id, accessToken) {
  try {
    const leadUrl = getMetaUrl(`${id}?fields=ad_id,ad_name,field_data,created_time&access_token=${accessToken}`);
    const leadResponse = await axios.get(leadUrl);
    const leadData = leadResponse.data;
    const adId = leadData.ad_id;

    if (!adId) {
      return { lead: leadData, campaign: null };
    }

    const adUrl = getMetaUrl(`${adId}?fields=campaign_id&access_token=${accessToken}`);
    const adResponse = await axios.get(adUrl);
    const campaignId = adResponse.data.campaign_id;

    if (!campaignId) {
      return { lead: leadData, campaign: null };
    }

    const campaignUrl = getMetaUrl(`${campaignId}?fields=name,status,buying_type&access_token=${accessToken}`);
    const campaignResponse = await axios.get(campaignUrl);
    const campaignData = campaignResponse.data;

    return { lead: leadData, campaign: campaignData };
  } catch (err) {
    return null;
  }
}

// ─── 4. Batch Processing ───
async function processLeadChunk(chunk, accessToken, sourceName) {
  const final_data = [];

  for (const lead_id of chunk) {
    try {
      const data = await fetchLeadDataWithCampaign(lead_id, accessToken);
      if (!data) continue;

      const leadDetails = data.lead;
      const campaignDetails = data.campaign;

      const full_name = extractFieldValue(leadDetails.field_data, ['Full name', 'full_name', 'name']);
      let phone_number = extractFieldValue(leadDetails.field_data, ['phone_number', 'Phone number', 'Phone', 'Mobile number']);
      const email = extractFieldValue(leadDetails.field_data, ['Email']);
      const city = extractFieldValue(leadDetails.field_data, ['City']);
      const additional_fields = extractAdditionalFields(leadDetails.field_data);

      if (phone_number && phone_number.length >= 13 && phone_number.startsWith('+91')) {
        phone_number = phone_number.slice(3);
      } else if (phone_number && phone_number.length === 12 && phone_number.startsWith('91')) {
        phone_number = phone_number.slice(2);
      }

      final_data.push({
        name: full_name || '',
        phone_number: phone_number || '',
        email: email || '',
        preferred_city: city || '',
        source: sourceName,
        form_name: leadDetails.id,
        mode: 'Online',
        sourceUrl: campaignDetails?.name || '',
        utm_campaign: leadDetails?.ad_name || '',
        utm_campaign_id: leadDetails?.ad_id || '',
        student_comment: formatToQuestionAnswerArray(additional_fields),
      });

    } catch (err) {
    }
  }

  if (final_data.length > 0) {
    try {
      const response = await axios.post(BATCH_ENDPOINT, { data: final_data });
    } catch (err) {
    }
  }
}

// ─── Main Orchestrator ───
export async function syncMissingLeads() {
  await databaseConnection();
  
  const enterprisePool = makePool(ENTERPRISE_URL);

  for (const account of ACCOUNTS) {
    
    // 1. Get Token from DB
    const tokenData = await MetaAdsToken.findOne({ where: { page_id: account.page_id } });
    if (!tokenData || !tokenData.page_access_token) {
      continue;
    }
    const pageAccessToken = tokenData.page_access_token;

    // 2. Fetch all leads in last 30 days
    const allLeads = await fetchRecentMetaLeads(pageAccessToken, account.page_id);

    if (allLeads.length === 0) continue;

    // 3. Cross-check Enterprise DB
    const missingLeads = await filterExistingLeads(enterprisePool, allLeads, pageAccessToken, account.sourceName);
    const missingLeadIds = missingLeads.map(l => l.lead_id);
    

    // 4. Process and Batch Push missing leads
    if (missingLeadIds.length > 0) {
      for (let i = 0; i < missingLeadIds.length; i += BATCH_SIZE) {
        const chunk = missingLeadIds.slice(i, i + BATCH_SIZE);
        await processLeadChunk(chunk, pageAccessToken, account.sourceName);
      }
    }
  }

  await enterprisePool.end();
}



