import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

import databaseConnection from './config/database-connection.js';
import startSyncMissingLeadsCron from './cron/syncMissingLeadsCron.js';
import startMidnightCleanupCron from './cron/midnightCleanupCron.js';
// import startLeadSwapCron from './cron/leadSwapCron.js';
import startLpuPhagwaraRegularCron from './cron/lpuPhagwaraRegularCron.js';

async function startScheduler() {

  await databaseConnection();

  startSyncMissingLeadsCron();
  startMidnightCleanupCron();
  // startLeadSwapCron();
  startLpuPhagwaraRegularCron();

}

startScheduler().catch(err => {
  process.exit(1);
});
