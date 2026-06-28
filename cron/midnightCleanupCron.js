import cron from "node-cron";
import { runMidnightCleanup } from "../midnightSessionCleanup.js";

const startMidnightCleanupCron = () => {
  cron.schedule("0 0 * * *", async () => {
    try {
      console.log(`[Scheduler] [${new Date().toISOString()}] Starting daily midnight session cleanup...`);
      await runMidnightCleanup();
    } catch (error) {
      console.error(`[Scheduler] Error during daily midnight cleanup:`, error);
    }
  }, { scheduled: true, timezone: "Asia/Kolkata" });

  console.log("  -> Scheduled: runMidnightCleanup (Daily, at 12:00 AM IST)");
};

export default startMidnightCleanupCron;
