import cron from "node-cron";
import { runMidnightCleanup } from "../midnightSessionCleanup.js";

const startMidnightCleanupCron = () => {
  cron.schedule("0 0 * * *", async () => {
    try {
      await runMidnightCleanup();
    } catch (error) {
    }
  }, { scheduled: true, timezone: "Asia/Kolkata" });

};

export default startMidnightCleanupCron;
