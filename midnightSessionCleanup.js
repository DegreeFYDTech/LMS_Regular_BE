import cron from 'node-cron';
import databaseConnection from './config/database-connection.js';
import { Counsellor } from './models/index.js';

databaseConnection();

cron.schedule('0 0 * * *', async () => {
    try {
        console.log('[CRON Worker] Starting daily midnight session cleanup...');
        const [updatedCount] = await Counsellor.update({
            is_logout: true,
            active_session_tokens: []
        }, {
            where: {}
        });
        console.log(`[CRON Worker] Successfully logged out ${updatedCount} counsellors at midnight.`);
    } catch (err) {
        console.error('[CRON Worker] Error running midnight session cleanup:', err);
    }
}, {
    scheduled: true,
    timezone: "Asia/Kolkata"
});

console.log('Midnight Auto-Logout CRON Worker initialized and running. Waiting for 12:00 AM IST scheduled sweep...');
