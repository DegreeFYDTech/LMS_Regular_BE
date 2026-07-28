/**
 * Reusable consistency check: for every report that has a summary view +
 * a click-to-drilldown, verify the drilldown's total for a sampled group
 * matches the count shown in the summary for that same group — across
 * EVERY metric/bucket each report exposes, not just one representative one.
 *
 * Ported from the equivalent scripts in Lms_Be_onSql/scripts and
 * regular_amity_be/scripts, then expanded (per "can wr check all?") to match
 * Amity's full-bucket coverage: Lead Intelligence (all 5 types x all 16
 * buckets), Connected Calls, Lead Attempt (2 modes x 5 buckets), Unique
 * Tracker (2 modes x 4 buckets), F2A Report (5 types x 12 buckets).
 *
 * Architecture here: Lead Intelligence (single dispatcher fn keyed by
 * presence of bucket+drill_* params), Lead Attempt and Unique Tracker
 * (single dispatcher fn keyed by ?type=raw), F2A Report (single dispatcher
 * keyed by ?mode=raw), Connected Calls (separate summary/drilldown functions
 * + routes, like Lms_Be_onSql).
 *
 * NOT covered yet (out of scope for this pass): College Status Reports,
 * Track Report / getTrackReportDrillDown, TrackerReportAnalysis3, Analyser
 * role scoping, multi-filter combinations.
 *
 * Usage:  node scripts/verify-report-drilldowns.mjs
 * Exits 1 if any check fails, 0 if everything matches.
 */

import {
  getThreeRecordsOfFormFilled,
  getLeadAttemptTimeReport,
  getTrackerReport2,
} from '../controllers/studentcoursestatus.controller.js';
import { getConnectedCallsAnalysis, getConnectedCallsDrillDown } from '../controllers/remark.controller.js';
import { getF2AReport as getF2AReportLogs } from '../controllers/StudentCourseStatusLogs.controller.js';

const SUPERVISOR = { role: 'Supervisor', id: 'VERIFY-SCRIPT' };

const mockRes = () => {
  let captured = null;
  return {
    json: (d) => { captured = d; },
    status: () => ({ json: (d) => { captured = d; } }),
    get: () => captured,
  };
};

const call = async (fn, query, user = SUPERVISOR) => {
  const res = mockRes();
  await fn({ query, body: {}, user }, res);
  return res.get();
};

// This backend's drilldown responses don't always include a `total`/
// `totalRecords` field (some just return the full unpaginated `data` array
// with no count field at all) — fall back to counting rows directly.
const drillTotal = (response) =>
  response?.total ?? response?.totalRecords ?? response?.data?.length ?? response?.rows?.length;

const results = [];
const record = (suite, label, expected, actual) => {
  const pass = String(expected ?? 0) === String(actual ?? 0);
  results.push({ suite, label, expected, actual, pass });
  console.log(`  [${pass ? 'PASS' : 'FAIL'}] ${label}: summary=${expected}, drilldown=${actual}`);
  return pass;
};

const today = () => new Date().toISOString().slice(0, 10);

// ---------------------------------------------------------------------------
// Lead Intelligence: bucket key -> summary response field (they don't all
// match 1:1 by construction, but here they do line up 1:1 in this backend).
const LI_BUCKET_TO_FIELD = {
  lead_count: 'lead_count', attempted: 'attempted', connectedAnytime: 'connectedAnytime',
  icc: 'icc', formFilled: 'formFilled', need_active: 'need_active', admission: 'admission',
  enrolled: 'enrolled', ni: 'ni', preNI: 'preNI', freshCount: 'freshCount',
  active_cases: 'active_cases', under_3_remarks: 'under_3_remarks',
  remarks_4_7: 'remarks_4_7', remarks_8_10: 'remarks_8_10', remarks_gt_10: 'remarks_gt_10',
};

async function verifyLeadIntelligence() {
  console.log('\n=== Lead Intelligence (getThreeRecordsOfFormFilled) — all buckets ===');
  for (const type of ['agent', 'source', 'campaign', 'source_url', 'created_at']) {
    const summary = await call(getThreeRecordsOfFormFilled, { type });
    const row = (summary?.data || []).find(r => r.group_by && r.group_by !== 'Total' && r.lead_count > 0);
    if (!row) { console.log(`-- ${type}: no non-empty group found, skipping --`); continue; }
    console.log(`-- ${type} (sample group "${row.group_by}") --`);
    for (const [bucket, field] of Object.entries(LI_BUCKET_TO_FIELD)) {
      const drill = await call(getThreeRecordsOfFormFilled, { type, bucket, drill_group: row.group_by, limit: 1 });
      record(`Lead Intelligence/${type}`, `bucket=${bucket}`, row[field], drillTotal(drill));
    }
  }
}

// ---------------------------------------------------------------------------
async function verifyConnectedCalls() {
  console.log('\n=== Connected Calls ===');
  const dateRange = { from: today(), to: today() };
  const summary = await call(getConnectedCallsAnalysis, dateRange);
  const rows = (summary?.data || []).filter(r => r.counsellorName && r.totalRemarks > 0).slice(0, 3);
  if (!rows.length) console.log('  (no counsellors with remarks today — nothing to sample)');
  for (const row of rows) {
    const drill = await call(getConnectedCallsDrillDown, { ...dateRange, counsellor_id: row.counsellorId || row.counsellor_id, counsellor_name: row.counsellorName, bucket: 'totalRemarks', limit: 1 });
    record('Connected Calls', `counsellor="${row.counsellorName}"`, row.totalRemarks, drillTotal(drill));
  }
}

// ---------------------------------------------------------------------------
async function verifyLeadAttempt() {
  console.log('\n=== Lead Attempt — all buckets ===');
  const dateRange = { date_start: today(), date_end: today() };
  const buckets = ['leadsAssigned', 'attempted', 'within15', 'min1530', 'gt30'];

  console.log('-- counsellor mode --');
  const summary = await call(getLeadAttemptTimeReport, { ...dateRange, group_by: 'counsellor' });
  const row = (summary?.rows || []).find(r => r.counsellorName && r.leadsAssigned > 0);
  if (row) {
    console.log(`-- counsellor (sample "${row.counsellorName}") --`);
    for (const bucket of buckets) {
      const drill = await call(getLeadAttemptTimeReport, { ...dateRange, type: 'raw', group_by: 'counsellor', drill_group: row.counsellorName, drill_bucket: bucket, limit: 1 });
      record('Lead Attempt/counsellor', `bucket=${bucket}`, row[bucket], drillTotal(drill));
    }
  } else {
    console.log('-- counsellor: no non-empty group found, skipping --');
  }

  console.log('-- hour mode --');
  const summaryHour = await call(getLeadAttemptTimeReport, { ...dateRange, group_by: 'hour' });
  const hourRow = (summaryHour?.rows || []).find(r => r.leadsAssigned > 0);
  if (hourRow) {
    const groupLabel = hourRow.groupName || hourRow.groupKey || hourRow.group_by;
    console.log(`-- hour (sample "${groupLabel}") --`);
    for (const bucket of buckets) {
      const drill = await call(getLeadAttemptTimeReport, { ...dateRange, type: 'raw', group_by: 'hour', drill_group: groupLabel, drill_bucket: bucket, limit: 1 });
      record('Lead Attempt/hour', `bucket=${bucket}`, hourRow[bucket], drillTotal(drill));
    }
  } else {
    console.log('-- hour: no non-empty group found, skipping --');
  }
}

// ---------------------------------------------------------------------------
async function verifyUniqueTracker() {
  console.log('\n=== Unique Tracker — all buckets ===');
  const dateRange = { date_start: today(), date_end: today() };
  const buckets = ['totalUniqueRemarks', 'firstTimeConnected', 'firstTimeICC', 'firstTimeNI'];

  console.log('-- counsellor mode --');
  const summary = await call(getTrackerReport2, { ...dateRange, groupBy: 'counsellor' });
  const row = (summary?.rows || []).find(r => r.counsellorName && r.totalUniqueRemarks > 0);
  if (row) {
    console.log(`-- counsellor (sample "${row.counsellorName}") --`);
    for (const bucket of buckets) {
      const drill = await call(getTrackerReport2, { ...dateRange, type: 'raw', groupBy: 'counsellor', drill_group: row.counsellorName, drill_bucket: bucket, limit: 1 });
      record('Unique Tracker/counsellor', `bucket=${bucket}`, row[bucket], drillTotal(drill));
    }
  } else {
    console.log('-- counsellor: no non-empty group found, skipping --');
  }

  console.log('-- slot mode --');
  const summarySlot = await call(getTrackerReport2, { ...dateRange, groupBy: 'slot' });
  const slotRow = (summarySlot?.rows || []).find(r => r.totalUniqueRemarks > 0);
  if (slotRow) {
    const groupLabel = slotRow.groupKey || slotRow.groupName || slotRow.counsellorName;
    console.log(`-- slot (sample "${groupLabel}") --`);
    for (const bucket of buckets) {
      const drill = await call(getTrackerReport2, { ...dateRange, type: 'raw', groupBy: 'slot', drill_group: groupLabel, drill_bucket: bucket, limit: 1 });
      record('Unique Tracker/slot', `bucket=${bucket}`, slotRow[bucket], drillTotal(drill));
    }
  } else {
    console.log('-- slot: no non-empty group found, skipping --');
  }
}

// ---------------------------------------------------------------------------
async function verifyF2A() {
  console.log('\n=== F2A Report — all types x all buckets ===');
  const buckets = ['leads', 'attempted', 'form_submitted_pp', 'form_submitted_completed',
    'walkin_completed', 'exam_pending', 'exam_scheduled', 'offer_pending', 'offer_released',
    'ready_for_admission', 'admission', 'ni_count'];

  for (const type of ['agent', 'source', 'source_url', 'campaign', 'created_at']) {
    const summary = await call(getF2AReportLogs, { type });
    const row = (summary?.data || []).find(r => r.group_label && r.group_label !== 'Total' && r.leads > 0);
    if (!row) { console.log(`-- ${type}: no non-empty group found, skipping --`); continue; }
    console.log(`-- ${type} (sample group "${row.group_label}") --`);
    for (const bucket of buckets) {
      const drill = await call(getF2AReportLogs, { type, group_label: row.group_label, bucket, mode: 'raw', limit: 1 });
      record(`F2A/${type}`, `bucket=${bucket}`, row[bucket], drillTotal(drill));
    }
  }
}

// ---------------------------------------------------------------------------
async function main() {
  const suites = [verifyLeadIntelligence, verifyConnectedCalls, verifyLeadAttempt, verifyUniqueTracker, verifyF2A];
  for (const suite of suites) {
    try {
      await suite();
    } catch (err) {
      console.error(`\n[ERROR] ${suite.name} threw:`, err.message);
      results.push({ suite: suite.name, label: 'suite threw', pass: false });
    }
  }

  const total = results.length;
  const passed = results.filter(r => r.pass).length;
  const failed = results.filter(r => !r.pass);

  console.log(`\n${'='.repeat(60)}`);
  console.log(`${passed}/${total} checks passed`);
  if (failed.length) {
    console.log('\nFAILED:');
    failed.forEach(f => console.log(`  - [${f.suite}] ${f.label}: summary=${f.expected}, drilldown=${f.actual}`));
  }
  console.log('='.repeat(60));

  process.exit(failed.length ? 1 : 0);
}

main();
