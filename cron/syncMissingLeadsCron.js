import cron from "node-cron";
import { syncMissingLeads } from "../scripts/sync_missing_leads.js";

const startSyncMissingLeadsCron = () => {
  cron.schedule("0 * * * *", async () => {
    try {
      console.log(`[Scheduler] [${new Date().toISOString()}] Starting hourly lead sync...`);
      await syncMissingLeads();
    } catch (error) {
      console.error(`[Scheduler] Error during hourly lead sync:`, error);
    }
  }, { scheduled: true, timezone: "Asia/Kolkata" });

  console.log("  -> Scheduled: syncMissingLeads (Hourly, at minute 0)");
};

export default startSyncMissingLeadsCron;
