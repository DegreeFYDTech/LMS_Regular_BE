import cron from "node-cron";
import { syncMissingLeads } from "../scripts/sync_missing_leads.js";

const startSyncMissingLeadsCron = () => {
  cron.schedule("1 0 * * *", async () => {
    try {
      await syncMissingLeads();
    } catch (error) {
    }
  }, { scheduled: true, timezone: "Asia/Kolkata" });

};

export default startSyncMissingLeadsCron;
