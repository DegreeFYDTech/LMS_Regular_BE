import { Queue } from 'bullmq';
import bullConnection from './redisConnection.js';

export const cuBotQueue = new Queue('cu-bot', {
  connection: bullConnection,
  prefix: 'regular_lms_cu_bot',
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 5000
    },
    removeOnComplete: true,
    removeOnFail: false
  }
});

// ─── Night-time staggered delay logic ────────────────────────────────────────
// IST = UTC + 5:30
// Night window: 8:00 PM IST (14:30 UTC) → 8:00 AM IST (02:30 UTC next day)
// Leads queued during night get staggered 10-min intervals starting at 8:00 AM IST

const STAGGER_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes between each lead

/**
 * Returns the current hour and minute in IST (Indian Standard Time).
 */
function getISTTime() {
  const now = new Date();
  // IST offset: UTC + 5 hours 30 minutes
  const istOffsetMs = (5 * 60 + 30) * 60 * 1000;
  const istNow = new Date(now.getTime() + istOffsetMs);
  return {
    hour: istNow.getUTCHours(),
    minute: istNow.getUTCMinutes(),
    istNow,
  };
}

/**
 * Returns true if current IST time is in the night window (8 PM → 8 AM).
 */
function isNightWindow() {
  const { hour } = getISTTime();
  // Night = 20:00 (8 PM) up to 08:00 (8 AM)
  return hour >= 20 || hour < 8;
}

/**
 * Computes milliseconds from now until the next 8:00 AM IST.
 * 8:00 AM IST = 02:30 UTC — no IST math needed, just pure UTC.
 */
function msUntil8AM() {
  // Set target to 02:30 UTC today (= 08:00 AM IST)
  const next8AM = new Date();
  next8AM.setUTCHours(2, 30, 0, 0);

  // If 02:30 UTC has already passed today, aim for tomorrow
  if (next8AM.getTime() <= Date.now()) {
    next8AM.setUTCDate(next8AM.getUTCDate() + 1);
  }

  return next8AM.getTime() - Date.now();
}

/**
 * Returns the IST date string for today's night queue key.
 * Uses the "morning date" so that leads from e.g. 11 PM on May 20
 * and 2 AM on May 21 both share the key for May 21 (next morning).
 */
function getNightQueueDateKey() {
  const { hour, istNow } = getISTTime();
  // If after 8 PM, the leads will flush on the NEXT calendar day
  const flushDate = new Date(istNow);
  if (hour >= 20) {
    flushDate.setUTCDate(flushDate.getUTCDate() + 1);
  }
  const yyyy = flushDate.getUTCFullYear();
  const mm = String(flushDate.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(flushDate.getUTCDate()).padStart(2, '0');
  return `cu_bot:night_queue_counter:${yyyy}-${mm}-${dd}`;
}

// ─────────────────────────────────────────────────────────────────────────────

export const addCuBotJob = async (leadData) => {
  console.log(`📡 [Queue] Enqueuing CUCET job for lead: ${leadData.studentId}`);

  if (isNightWindow()) {
    // ── Night-time: compute staggered delay ──────────────────────────────────
    const counterKey = getNightQueueDateKey();

    // Atomically increment counter; set it to expire 36 hours after creation
    // so Redis auto-cleans old keys
    const position = await bullConnection.incr(counterKey);
    if (position === 1) {
      // First lead for this night — set TTL of 36 hours
      await bullConnection.expire(counterKey, 36 * 60 * 60);
    }

    const baseDelayMs = msUntil8AM();
    const staggerOffsetMs = (position - 1) * STAGGER_INTERVAL_MS;
    const totalDelayMs = baseDelayMs + staggerOffsetMs;

    const fireAtIST = new Date(Date.now() + totalDelayMs);
    const fireAtISTStr = new Date(fireAtIST.getTime() + (5 * 60 + 30) * 60 * 1000)
      .toISOString()
      .replace('T', ' ')
      .substring(0, 16) + ' IST';

    console.log(
      `🌙 [Queue] Night-time lead detected. Position #${position} in queue.\n` +
      `   Base delay until 8 AM : ${Math.round(baseDelayMs / 60000)} min\n` +
      `   Stagger offset         : ${Math.round(staggerOffsetMs / 60000)} min\n` +
      `   ⏰ Will fire at        : ${fireAtISTStr}`
    );

    return await cuBotQueue.add(
      `lead-submit-${leadData.studentId}`,
      { ...leadData, _nightQueue: true, _queuePosition: position },
      { delay: totalDelayMs }
    );
  }

  // ── Day-time: send immediately (existing behaviour) ──────────────────────
  console.log(`☀️  [Queue] Day-time lead — queuing immediately.`);
  return await cuBotQueue.add(`lead-submit-${leadData.studentId}`, leadData);
};

