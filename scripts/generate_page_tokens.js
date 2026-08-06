import axios from 'axios';
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

// Paste your 1-hour Short-Lived User Token here (right after clicking "Generate" in Graph API Explorer)
const SHORT_LIVED_TOKEN = 'PASTE_YOUR_SHORT_TOKEN_HERE';

// Your Page IDs
const PAGES = ['500516373142238', '718284908040065'];

// Your Database URLs
const REGULAR_LMS_DB = 'postgresql://postgres:Degreefyd%409706@storage.bhugoal.cloud:54321/degreefyd_regular_lms';
const SECONDARY_LMS_DB = 'postgresql://postgres:LMs%40degreefyd@db.khxuayvqbafqjggoqgiv.supabase.co:5432/postgres';
const ENTERPRISE_LMS_DB = 'postgresql://postgres.eeokezmbqsmyuubyxpex:Degreefyd%409706@aws-1-ap-south-1.pooler.supabase.com:5432/postgres';

async function updateTokens() {
  if (SHORT_LIVED_TOKEN === 'PASTE_YOUR_SHORT_TOKEN_HERE') {
    console.error('❌ Please paste your SHORT_LIVED_TOKEN at the top of the file before running.');
    return;
  }

  const appId = process.env.APP_ID;
  const appSecret = process.env.APP_SECRET;
  if (!appId || !appSecret) {
    console.error('❌ APP_ID or APP_SECRET not found in .env file!');
    return;
  }

  console.log('🔄 Step 1: Converting Short-Lived Token into a 60-Day Long-Lived Token...');
  let longLivedToken = '';
  try {
    const exchangeUrl = `https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${SHORT_LIVED_TOKEN}`;
    const tokenRes = await axios.get(exchangeUrl);
    longLivedToken = tokenRes.data.access_token;
    console.log(`✅ Successfully generated Long-Lived User Token!`);
  } catch (err) {
    console.error(`❌ Failed to exchange token:`, err.response?.data?.error?.message || err.message);
    return;
  }

  console.log('\n🔄 Step 2: Generating Page Access Tokens from Long-Lived User Token...');
  const pageTokens = {};
  for (const pageId of PAGES) {
    try {
      const url = `https://graph.facebook.com/v21.0/${pageId}?fields=access_token&access_token=${longLivedToken}`;
      const res = await axios.get(url);
      pageTokens[pageId] = res.data.access_token;
      console.log(`✅ Successfully generated permanent Page Token for Page ID: ${pageId}`);
    } catch (err) {
      console.error(`❌ Failed to get Page Token for ${pageId}:`, err.response?.data?.error?.message || err.message);
      return;
    }
  }

  console.log('\n🔄 Step 3: Updating Regular & Secondary LMS Databases (meta_ads_tokens table)...');
  const dbsToUpdate = [REGULAR_LMS_DB, SECONDARY_LMS_DB];
  for (const dbUrl of dbsToUpdate) {
    const pool = new pg.Pool({ connectionString: dbUrl, ssl: false });
    for (const pageId of PAGES) {
      const query = `
        UPDATE meta_ads_tokens 
        SET page_access_token = $1, long_lived_user_token = $2 
        WHERE page_id = $3
      `;
      try {
        await pool.query(query, [pageTokens[pageId], longLivedToken, pageId]);
        console.log(`✅ Updated meta_ads_tokens for Page ${pageId} in database ${dbUrl.split('@')[1].split(':')[0]}`);
      } catch (err) {
        console.error(`❌ DB Update failed for ${pageId}:`, err.message);
      }
    }
    await pool.end();
  }

  console.log('\n🔄 Step 4: Updating Enterprise LMS Database (lead_integrations table)...');
  const enterprisePool = new pg.Pool({ connectionString: ENTERPRISE_LMS_DB, ssl: false });
  try {
    for (const pageId of PAGES) {
      const query = `
        UPDATE lead_integrations 
        SET config = jsonb_set(
                       jsonb_set(config, '{page_access_token}', $1::jsonb),
                       '{long_lived_user_token}', $2::jsonb
                     )
        WHERE config->>'page_id' = $3
      `;
      const ptJson = JSON.stringify(pageTokens[pageId]);
      const utJson = JSON.stringify(longLivedToken);
      await enterprisePool.query(query, [ptJson, utJson, pageId]);
      console.log(`✅ Updated lead_integrations for Page ${pageId} in Enterprise DB`);
    }
  } catch (err) {
    console.error(`❌ Enterprise DB Update failed:`, err.message);
  }
  await enterprisePool.end();

  console.log('\n🎉 All tokens have been successfully refreshed and updated in all 3 databases!');
}

updateTokens();
