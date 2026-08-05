import axios from 'axios';
import pg from 'pg';
import dotenv from 'dotenv';
import cron from 'node-cron';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
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
  let since = now - 24 * 60 * 60; // default to last 1 hour

  const stateFile = path.join(__dirname, `sync_state_${pageId}.json`);
  if (fs.existsSync(stateFile)) {
    try {
      const state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
      if (state.last_sync) since = state.last_sync;
      console.log(`[Phase 1] Found existing state file. Fetching leads created after Unix time: ${since}`);
    } catch (e) {
      console.error('[Phase 1] Error reading sync state:', e);
    }
  } else {
    console.log(`[Phase 1] No state file found. Fetching leads created after Unix time: ${since} (last 10 hours)`);
  }

  const leads = [];

  const formsRes = await axios.get(`${BASE_URL}/${pageId}/leadgen_forms`, {
    params: { access_token: pageAccessToken, fields: 'id,name', limit: 100 },
  });
  const forms = formsRes.data?.data || [];

  for (const form of forms) {
    const filteringParam = encodeURIComponent(JSON.stringify([{ field: 'time_created', operator: 'GREATER_THAN', value: since }]));
    let url = `${BASE_URL}/${form.id}/leads?access_token=${pageAccessToken}&fields=id,created_time,field_data&limit=100&filtering=${filteringParam}`;
    let params = {};

    console.log(`[Phase 1] Fetching leads for form: ${form.name} (${form.id})...`);
    while (url) {
      const res = await axios.get(url, { params });
      const data = res.data?.data || [];
      console.log(`[Phase 1] Fetched ${data.length} leads from this page for form: ${form.name}`);
      let stop = false;

      for (const lead of data) {
        // console.log(`Processing lead: ${lead.id} from form: ${form.id}`);
        const createdTs = Math.floor(new Date(lead.created_time).getTime() / 1000);
        if (createdTs < since) {
          stop = true;
          break;
        }

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

      if (stop) break;

      const next = res.data?.paging?.next;
      url = next || null;
      params = {};
    }
  }

  console.log(`[Phase 1] Completed Meta API fetch. Total recent leads found: ${leads.length}`);
  return leads;
}

// ─── 2. Check which leads exist in Enterprise DB (batch check) ───
async function filterExistingLeads(pool, leads, pageAccessToken, userAccessToken, sourceName) {
  if (!leads || leads.length === 0) return [];

  const emails = [...new Set(leads.map(l => l.email).filter(Boolean))];
  const phones = [...new Set(leads.map(l => l.phone).filter(Boolean))];

  if (emails.length === 0 && phones.length === 0) {
    console.log(`[Phase 2] No emails or phones to cross-check. All ${leads.length} leads are considered missing.`);
    return leads;
  }

  console.log(`[Phase 2] Cross-checking ${emails.length} unique emails and ${phones.length} unique phones against Enterprise DB...`);

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
          const metaDetails = await fetchLeadDataWithCampaign(lead.lead_id, pageAccessToken, userAccessToken);
          // console.log(`Fetched meta details for lead_id ${lead.lead_id}:`, metaDetails);
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
          console.log(`Error fetching lead data for lead_id ${lead.lead_id}:`, err);
        }
      }
    }

    console.log(`[Phase 2] Cross-check complete. Found ${finalMissingLeads.length} completely new or valid missing leads.`);
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
async function fetchLeadDataWithCampaign(id, pageAccessToken, userAccessToken) {
  try {
    const leadUrl = getMetaUrl(`${id}?fields=ad_id,ad_name,field_data,created_time&access_token=${pageAccessToken}`);
    const leadResponse = await axios.get(leadUrl);
    const leadData = leadResponse.data;
    const adId = leadData.ad_id;

    if (!adId) {
      return { lead: leadData, campaign: null };
    }

    let campaignId = null;
    try {
      const adUrl = getMetaUrl(`${adId}?fields=campaign_id&access_token=${pageAccessToken}`);
      const adResponse = await axios.get(adUrl);
      campaignId = adResponse.data.campaign_id;
    } catch (adErr) {
      console.warn(`[fetchLeadDataWithCampaign] Warning: Could not fetch ad details for ad ${adId}. Returning lead data only.`);
      return { lead: leadData, campaign: null };
    }

    if (!campaignId) {
      return { lead: leadData, campaign: null };
    }

    let campaignData = null;
    try {
      // Use userAccessToken for campaign fetch as Page tokens lack permissions for ad account level
      const tokenToUse = userAccessToken || pageAccessToken;
      const campaignUrl = getMetaUrl(`${campaignId}?fields=name,status,buying_type&access_token=${tokenToUse}`);
      const campaignResponse = await axios.get(campaignUrl);
      campaignData = campaignResponse.data;
    } catch (campaignErr) {
      console.warn(`[fetchLeadDataWithCampaign] Warning: Could not fetch campaign details for campaign ${campaignId}. Returning lead data only.`);
    }

    return { lead: leadData, campaign: campaignData };
  } catch (err) {
    console.error(`[fetchLeadDataWithCampaign] Error fetching lead ${id}:`, err.response?.data?.error?.message || err.message);
    
    // FALLBACK: If we don't have Ads permission at all, fetch the lead without ad_id/ad_name so we don't drop it!
    try {
      const fallbackUrl = getMetaUrl(`${id}?fields=field_data,created_time&access_token=${pageAccessToken}`);
      const fallbackResponse = await axios.get(fallbackUrl);
      return { lead: fallbackResponse.data, campaign: null };
    } catch (fallbackErr) {
      console.error(`[fetchLeadDataWithCampaign] Fallback also failed for lead ${id}:`, fallbackErr.response?.data?.error?.message || fallbackErr.message);
      return null;
    }
  }
}

// ─── 4. Batch Processing ───
async function processLeadChunk(chunk, pageAccessToken, userAccessToken, sourceName) {
  const final_data = [];

  for (const lead_id of chunk) {
    try {
      const data = await fetchLeadDataWithCampaign(lead_id, pageAccessToken, userAccessToken);
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
        sourceUrl: campaignDetails?.name || leadDetails?.ad_name || '',
        utm_campaign: leadDetails?.ad_name || '',
        utm_campaign_id: leadDetails?.ad_id || '',
        student_comment: formatToQuestionAnswerArray(additional_fields),
      });

    } catch (err) {
      console.error(`[Phase 3] Error mapping lead ${lead_id}:`, err.message);
    }
  }

  if (final_data.length > 0) {
    try {
      console.log(`[Phase 3] Pushing a batch of ${final_data.length} mapped leads to Enterprise API (${BATCH_ENDPOINT})...`);
      const response = await axios.post(BATCH_ENDPOINT, { data: final_data });
      console.log(`[Phase 3] Batch push successful.`);
    } catch (err) {
      console.error(`[Phase 3] Error pushing batch:`, err.response ? err.response.data : err.message);
    }
  }
}

// ─── Main Orchestrator ───
export async function syncMissingLeads() {
  await databaseConnection();
  
  const enterprisePool = makePool(ENTERPRISE_URL);
 console.log('Starting syncMissingLeads process...',enterprisePool);
  for (const account of ACCOUNTS) {
    console.log(`Processing account: ${account.page_id} (${account.sourceName})`);
    // 1. Get Token from DB
    const tokenData = await MetaAdsToken.findOne({ where: { page_id: account.page_id } });
    console.log(`Fetched token data for page_id ${account.page_id}:`, tokenData);
    if (!tokenData || !tokenData.page_access_token) {
      continue;
    }
    const pageAccessToken = tokenData.page_access_token;
    const userAccessToken = tokenData.long_lived_user_token;

    // 2. Fetch all leads in last 30 days
    const allLeads = await fetchRecentMetaLeads(pageAccessToken, account.page_id);

    if (allLeads.length === 0) continue;

    // 3. Cross-check Enterprise DB
    const missingLeads = await filterExistingLeads(enterprisePool, allLeads, pageAccessToken, userAccessToken, account.sourceName);
    const missingLeadIds = missingLeads.map(l => l.lead_id);
    

    // 4. Process and Batch Push missing leads
    if (missingLeadIds.length > 0) {
      for (let i = 0; i < missingLeadIds.length; i += BATCH_SIZE) {
        const chunk = missingLeadIds.slice(i, i + BATCH_SIZE);
        await processLeadChunk(chunk, pageAccessToken, userAccessToken, account.sourceName);
      }
    }

    // 5. Update sync state after successful processing
    const stateFile = path.join(__dirname, `sync_state_${account.page_id}.json`);
    const currentSyncTime = Math.floor(Date.now() / 1000);
    fs.writeFileSync(stateFile, JSON.stringify({ last_sync: currentSyncTime }));
    console.log(`[Phase 4] Finished processing account ${account.sourceName}. Sync state updated to ${currentSyncTime}.`);
  }

  console.log('All accounts processed successfully. Closing DB connection.');
  await enterprisePool.end();
}



syncMissingLeads();