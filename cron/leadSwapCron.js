import cron from "node-cron";
import { runSwap } from "../service/leadSwapService.js";

const startLeadSwapCron = () => {

  // CSL · Pre Application · 1:00 PM · age > 6 hrs · hide remarks
  cron.schedule("0 13 * * *", () => {
    runSwap({
      label:       "CSL PreApp 1PM",
      leadType:    "csl",
      status:      "Pre Application",
      ageHours:    6,
      hideRemarks: true,
    });
  }, { timezone: "Asia/Kolkata" });

  // CSL · Pre Application · 5:00 PM · age > 6 hrs · hide remarks
  cron.schedule("0 17 * * *", () => {
    runSwap({
      label:       "CSL PreApp 5PM",
      leadType:    "csl",
      status:      "Pre Application",
      ageHours:    6,
      hideRemarks: true,
    });
  }, { timezone: "Asia/Kolkata" });

  // CSL · ICC · 3:00 PM · age > 16 hrs · skip if remarked/callback today · keep remarks
  cron.schedule("0 15 * * *", () => {
    runSwap({
      label:           "CSL ICC 3PM",
      leadType:        "csl",
      status:          "Initial Counselling Completed",
      ageHours:        16,
      hideRemarks:     false,
      skipActiveToday: true,
    });
  }, { timezone: "Asia/Kolkata" });

  // Non-CSL · Pre Application · 4:00 PM · age > 24 hrs · created within 7 days · counsellor change only
  cron.schedule("0 16 * * *", () => {
    runSwap({
      label:       "NonCSL PreApp 4PM",
      leadType:    "non-csl",
      status:      "Pre Application",
      ageHours:    24,
      withinDays:  7,
      hideRemarks: false,
    });
  }, { timezone: "Asia/Kolkata" });

  // Non-CSL · ICC · 11:30 AM · age > 36 hrs · skip if remarked/callback today · keep remarks
  cron.schedule("30 11 * * *", () => {
    runSwap({
      label:           "NonCSL ICC 11:30AM",
      leadType:        "non-csl",
      status:          "Initial Counselling Completed",
      ageHours:        36,
      hideRemarks:     false,
      skipActiveToday: true,
    });
  }, { timezone: "Asia/Kolkata" });

  console.log("[CRON] Lead Swap cron registered (5 schedules).");
};

export default startLeadSwapCron;
