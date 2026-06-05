import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import cron from 'node-cron';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

import databaseConnection from './config/database-connection.js';
import { runMidnightCleanup } from './midnightSessionCleanup.js';
import { syncMissingLeads } from './scripts/sync_missing_leads.js';

async function startScheduler() {
    console.log('⏰ Central Cron Scheduler is initializing...');
    
    // Connect to the database
    await databaseConnection();

    // 1. Schedule syncMissingLeads to run hourly (at minute 0)
    cron.schedule('0 * * * *', async () => {
        try {
            console.log(`[Scheduler] [${new Date().toISOString()}] Starting hourly lead sync...`);
            await syncMissingLeads();
        } catch (error) {
            console.error(`[Scheduler] Error during hourly lead sync:`, error);
        }
    }, {
        scheduled: true,
        timezone: "Asia/Kolkata"
    });
    console.log('  -> Scheduled: syncMissingLeads (Hourly, at minute 0)');

    // 2. Schedule runMidnightCleanup to run daily at midnight (00:00)
    cron.schedule('0 0 * * *', async () => {
        try {
            console.log(`[Scheduler] [${new Date().toISOString()}] Starting daily midnight session cleanup...`);
            await runMidnightCleanup();
        } catch (error) {
            console.error(`[Scheduler] Error during daily midnight cleanup:`, error);
        }
    }, {
        scheduled: true,
        timezone: "Asia/Kolkata"
    });
    console.log('  -> Scheduled: runMidnightCleanup (Daily, at 12:00 AM IST)');

    console.log('✅ Central Cron Scheduler initialized and running. Waiting for events...');
}

startScheduler().catch(err => {
    console.error('❌ Failed to start Central Cron Scheduler:', err);
    process.exit(1);
});
