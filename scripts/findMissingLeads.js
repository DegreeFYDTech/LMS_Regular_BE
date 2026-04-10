/**
 * findMissingLeads.js
 *
 * Fetches all Meta leads from the last 30 days via the Graph API,
 * then checks all 3 PostgreSQL databases (Regular, Online, Enterprise LMS)
 * using email OR phone. Any lead not found in ANY system is reported.
 *
 * Run: node scripts/findMissingLeads.js
 */

import axios from 'axios';
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

// ─── Meta Config ────────────────────────────────────────────────────────────
const META_VERSION   = process.env.META_GRAPH_VERSION || 'v21.0';
const BASE_URL       = `https://graph.facebook.com/${META_VERSION}`;
const PAGE_ID        = '718284908040065'; // university admit page

// ─── DB Connection Strings ───────────────────────────────────────────────────
// Regular: read from .env (same URL the backend uses)
const REGULAR_URL    = process.env.SUPABASE_URL; // degreefyd_regular_lms
const ONLINE_URL     = 'postgresql://postgres:Degreefyd%409706@storage.bhugoal.cloud:54321/degreefyd_online_lms';
const ENTERPRISE_URL = 'postgresql://postgres:Degreefyd%409706@storage.bhugoal.cloud:54321/enterprise_lms';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Normalise a phone number to last 10 digits (strips country code) */
function normalisePhone(phone) {
  if (!phone) return null;
  let p = String(phone).replace(/\D/g, '');
  if (p.length > 10) p = p.slice(-10);
  return p || null;
}

/** Normalise email to lowercase trimmed */
function normaliseEmail(email) {
  if (!email) return null;
  return String(email).trim().toLowerCase();
}

/** Create a pg.Pool from a connection URL, with SSL disabled (self-hosted) */
function makePool(url) {
  return new pg.Pool({
    connectionString: url,
    ssl: false,
    max: 3,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 15000,
  });
}

// ─── Step 1: Fetch leads from Meta Graph API (last 30 days) ──────────────────

async function fetchMetaLeads(pageAccessToken) {
  const now   = Math.floor(Date.now() / 1000);
  const since = now - 3 * 24 * 60 * 60; // last 30 days in unix epoch
  const leads = [];

  // 1a. Get all lead forms for the page
  const formsRes = await axios.get(`${BASE_URL}/${PAGE_ID}/leadgen_forms`, {
    params: { access_token: pageAccessToken, fields: 'id,name', limit: 100 },
  });
  const forms = formsRes.data?.data || [];
  console.log(`📋 Found ${forms.length} lead form(s)`);
  console.log(`📅 Filtering leads from: ${new Date(since * 1000).toLocaleDateString('en-IN')} → today\n`);

  for (const form of forms) {
    console.log(`\n🔍 Fetching leads from form: ${form.name} (${form.id})`);
    let url = `${BASE_URL}/${form.id}/leads`;
    let params = {
      access_token: pageAccessToken,
      fields: 'id,created_time,field_data',
      // 'since' and 'until' are the correct date params for the leadgen API
      since: since,
      until: now,
      limit: 100,
    };

    while (url) {
      const res = await axios.get(url, { params });
      const data = res.data?.data || [];

      for (const lead of data) {
        // Double-check date on our side too (safety net)
        const createdTs = Math.floor(new Date(lead.created_time).getTime() / 1000);
        if (createdTs < since) continue;

        const parsed = { lead_id: lead.id, created_time: lead.created_time, email: null, phone: null };
        for (const f of lead.field_data || []) {
          const val = f.values?.[0] || null;
          if (f.name === 'email')                                        parsed.email = val;
          if (['phone_number', 'phone', 'mobile'].includes(f.name))     parsed.phone = val;
        }
        parsed.email = normaliseEmail(parsed.email);
        parsed.phone = normalisePhone(parsed.phone);
        leads.push(parsed);
      }

      console.log(`  ↳ Fetched ${data.length} leads (running total: ${leads.length})`);

      // Pagination — next URL already has all params baked in
      const next = res.data?.paging?.next;
      url    = next || null;
      params = {};
    }
  }

  return leads;
}

// ─── Step 2: Check existence in a DB by email OR phone ───────────────────────

async function existsInDB(pool, table, email, phone) {
  const conditions = [];
  const values     = [];

  if (email) {
    values.push(email);
    conditions.push(`student_email = $${values.length}`);
  }
  if (phone) {
    values.push(phone);
    // also try matching with leading country code stored in DB
    conditions.push(`RIGHT(REGEXP_REPLACE(student_phone, '\\D', '', 'g'), 10) = $${values.length}`);
  }

  if (conditions.length === 0) return false; // no data to check with

  const sql = `SELECT 1 FROM "${table}" WHERE ${conditions.join(' OR ')} LIMIT 1`;
  try {
    const result = await pool.query(sql, values);
    return result.rowCount > 0;
  } catch (err) {
    console.error(`  ⚠️  DB query error on ${table}:`, err.message);
    return false; // treat as not found on error, but log it
  }
}

// ─── Step 3: Main orchestrator ────────────────────────────────────────────────

async function findMissingLeads() {
  // ── Create DB pools ──
  const regularPool    = makePool(REGULAR_URL);
  const onlinePool     = makePool(ONLINE_URL);
  const enterprisePool = makePool(ENTERPRISE_URL);

  let pageAccessToken;
  {
    console.log(`🔌 Connecting to Online LMS DB to fetch token...`);
    // Token is stored in the Online LMS DB (meta_ads_tokens)
    const tokenRes = await onlinePool.query(
      `SELECT page_access_token FROM meta_ads_tokens WHERE page_id = $1 LIMIT 1`,
      [PAGE_ID]
    );
    if (!tokenRes.rowCount) {
      // Fallback: grab whichever token was updated most recently
      const altRes = await onlinePool.query(
        `SELECT page_id, page_access_token FROM meta_ads_tokens ORDER BY updated_at DESC LIMIT 1`
      );
      if (!altRes.rowCount) {
        console.error('❌ No token rows found in Online LMS meta_ads_tokens. Please ensure a token has been saved.');
        process.exit(1);
      }
      console.warn(`⚠️  Token for page ${PAGE_ID} not found; using token for page ${altRes.rows[0].page_id} instead.`);
      pageAccessToken = altRes.rows[0].page_access_token;
    } else {
      pageAccessToken = tokenRes.rows[0].page_access_token;
    }
    console.log('🔑 Page access token loaded from Online LMS DB\n');
  }

  // ── Fetch last-30-days leads from Meta ──
  console.log('📡 Fetching Meta leads from last 30 days...\n');
  let metaLeads;
  try {
    metaLeads = await fetchMetaLeads(pageAccessToken);
  } catch (err) {
    console.error('❌ Error fetching Meta leads:', err.response?.data || err.message);
    process.exit(1);
  }
  console.log(`\n✅ Total Meta leads fetched: ${metaLeads.length}\n`);

  if (metaLeads.length === 0) {
    console.log('No leads to check. Exiting.');
    process.exit(0);
  }

  // ── Check each lead across all 3 systems ──
  console.log('🔎 Checking each lead across Regular, Online & Enterprise LMS...\n');

  const missingLeads   = [];
  const summary        = { total: metaLeads.length, foundRegular: 0, foundOnline: 0, foundEnterprise: 0, missingAll: 0 };

  for (let i = 0; i < metaLeads.length; i++) {
    const lead    = metaLeads[i];
    const { lead_id, email, phone, created_time } = lead;

    const inRegular    = await existsInDB(regularPool,    'students', email, phone);
    const inOnline     = await existsInDB(onlinePool,     'students', email, phone);
    const inEnterprise = await existsInDB(enterprisePool, 'leads',    email, phone);

    if (inRegular)    summary.foundRegular++;
    if (inOnline)     summary.foundOnline++;
    if (inEnterprise) summary.foundEnterprise++;

    const foundAnywhere = inRegular || inOnline || inEnterprise;
    const tag = [
      inRegular    ? '✓Regular'    : null,
      inOnline     ? '✓Online'     : null,
      inEnterprise ? '✓Enterprise' : null,
    ].filter(Boolean).join(', ') || '✗ NONE';

    console.log(
      `[${i + 1}/${metaLeads.length}] ${lead_id} | email: ${email || '-'} | phone: ${phone || '-'} ` +
      `| created: ${new Date(created_time).toLocaleDateString('en-IN')} | found: ${tag}`
    );

    if (!foundAnywhere) {
      missingLeads.push({
        lead_id,
        created_time,
        email: email || null,
        phone: phone || null,
      });
      summary.missingAll++;
    }
  }

  // ── Final Report ──
  console.log('\n' + '═'.repeat(70));
  console.log('📊 SUMMARY');
  console.log('═'.repeat(70));
  console.log(`  Total Meta leads (last 30 days) : ${summary.total}`);
  console.log(`  Found in Regular LMS            : ${summary.foundRegular}`);
  console.log(`  Found in Online LMS             : ${summary.foundOnline}`);
  console.log(`  Found in Enterprise LMS         : ${summary.foundEnterprise}`);
  console.log(`  ❗ NOT FOUND in ANY system       : ${summary.missingAll}`);
  console.log('═'.repeat(70));

  if (missingLeads.length > 0) {
    console.log('\n🚨 MISSING LEAD IDs (not in any LMS):');
    console.log('─'.repeat(70));
    missingLeads.forEach((l, idx) => {
      console.log(
        `  ${idx + 1}. lead_id=${l.lead_id} | email=${l.email || '-'} | phone=${l.phone || '-'} | created=${new Date(l.created_time).toLocaleDateString('en-IN')}`
      );
    });
    console.log('\n📋 Raw lead_id list (copy-paste ready):');
    console.log(missingLeads.map(l => l.lead_id).join('\n'));
  } else {
    console.log('\n✅ All Meta leads are present in at least one LMS system!');
  }

  // ── Cleanup ──
  await regularPool.end();
  await onlinePool.end();
  await enterprisePool.end();
  process.exit(0);
}

// findMissingLeads().catch(err => {
//   console.error('💥 Unexpected error:', err);
//   process.exit(1);
// });
