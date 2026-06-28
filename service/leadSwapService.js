import sequelize from "../config/database-config.js";
import { QueryTypes } from "sequelize";
import LeadSwapLog from "../models/LeadSwapLog.js";

const fetchQualifyingLeads = async ({ leadType, status, ageHours, withinDays, skipActiveToday }) => {
  const isCSL = leadType === "csl";

  const skipActiveTodayClause = skipActiveToday
    ? `AND NOT EXISTS (
        SELECT 1
        FROM (
          SELECT created_at, callback_date
          FROM student_remarks
          WHERE student_id = s.student_id
            AND isdisabled = false
          ORDER BY created_at DESC
          LIMIT 1
        ) lr
        WHERE DATE(lr.created_at) = CURRENT_DATE
           OR DATE(lr.callback_date) = CURRENT_DATE
      )`
    : "";

  const rows = await sequelize.query(
    `
    WITH last_la AS (
      SELECT DISTINCT ON (student_id)
        student_id,
        lead_type
      FROM student_lead_activities
      ORDER BY student_id, created_at DESC, id DESC
    )
    SELECT
      s.student_id,
      s.assigned_counsellor_id
    FROM students s
    JOIN last_la la ON la.student_id = s.student_id
    WHERE s.current_student_status = :status
      AND s.assigned_counsellor_id IS NOT NULL
      AND s.assigned_counsellor_id != ''
      AND s.created_at <= NOW() - INTERVAL '${ageHours} hours'
      ${withinDays ? `AND s.created_at BETWEEN NOW() - INTERVAL '${withinDays} days' AND NOW()` : ""}
      ${skipActiveTodayClause}
      AND ${isCSL ? "LOWER(la.lead_type) = 'csl'" : "LOWER(COALESCE(la.lead_type,'')) != 'csl'"}
    `,
    {
      replacements: { status },
      type: QueryTypes.SELECT,
    }
  );

  return rows;
};

const groupByCounsellor = (leads) => {
  const groups = {};
  for (const lead of leads) {
    const cid = lead.assigned_counsellor_id;
    if (!groups[cid]) groups[cid] = [];
    groups[cid].push(lead.student_id);
  }
  return groups;
};

const fetchActiveCounsellors = async () => {
  const rows = await sequelize.query(
    `SELECT counsellor_id
     FROM counsellors
     WHERE role = 'l2'
       AND status = 'active'
       AND is_blocked = false
       AND LOWER(counsellor_name) NOT LIKE '%dummy%'`,
    { type: QueryTypes.SELECT }
  );
  return rows.map((r) => r.counsellor_id);
};

const buildSwapPlan = (grouped, activeCounsellors) => {
  const plan = [];

  const allLeads = [];
  for (const [ownerCid, studentIds] of Object.entries(grouped)) {
    for (const student_id of studentIds) {
      allLeads.push({ student_id, ownerCid });
    }
  }

  const total = allLeads.length;
  const n = activeCounsellors.length;

  if (n === 0) return plan;

  const base = Math.floor(total / n);
  const extra = total % n;
  const slotsLeft = {};
  activeCounsellors.forEach((cid, i) => {
    slotsLeft[cid] = i < extra ? base + 1 : base;
  });

  for (const { student_id, ownerCid } of allLeads) {
    const eligible = activeCounsellors.filter((cid) => cid !== ownerCid && slotsLeft[cid] > 0);

    if (eligible.length === 0) {
      const fallback = activeCounsellors.filter((cid) => cid !== ownerCid);
      if (fallback.length === 0) {
        console.warn(`[SWAP] No eligible receiver for ${student_id}, skipping.`);
        continue;
      }
      const toCid = fallback.reduce((max, cid) => slotsLeft[cid] > slotsLeft[max] ? cid : max);
      slotsLeft[toCid]--;
      plan.push({ student_id, old_counsellor_id: ownerCid, new_counsellor_id: toCid });
      continue;
    }

    const toCid = eligible.reduce((max, cid) => slotsLeft[cid] > slotsLeft[max] ? cid : max);
    slotsLeft[toCid]--;
    plan.push({ student_id, old_counsellor_id: ownerCid, new_counsellor_id: toCid });
  }

  return plan;
};

const esc = (val) => String(val).replace(/'/g, "''");

const executeSwap = async (plan, hideRemarks, config) => {
  if (plan.length === 0) {
    console.log("[SWAP] No leads to swap.");
    return;
  }

  const swapTime = new Date();
  const studentIds = plan.map((p) => p.student_id);

  const caseWhen = plan
    .map((p) => `WHEN '${esc(p.student_id)}' THEN '${esc(p.new_counsellor_id)}'`)
    .join("\n");

  const escapedIds = studentIds.map((id) => `'${esc(id)}'`).join(",");

  const t = await sequelize.transaction();

  try {
    if (hideRemarks) {
      await sequelize.query(
        `
        UPDATE student_remarks
        SET isdisabled = true
        WHERE student_id IN (${escapedIds})
          AND created_at < :swapTime
          AND isdisabled = false
        `,
        { replacements: { swapTime }, transaction: t }
      );
      console.log(`[SWAP] Hid previous remarks for ${studentIds.length} leads.`);

      await sequelize.query(
        `
        UPDATE students
        SET
          assigned_counsellor_id        = CASE student_id ${caseWhen} END,
          remarks_count                  = 0,
          current_student_status         = 'Fresh',
          current_student_ni_sub_status  = NULL,
          first_icc_date                 = NULL,
          reassigneddate                 = :swapTime,
          created_at                     = :swapTime,
          updated_at                     = :swapTime
        WHERE student_id IN (${escapedIds})
        `,
        { replacements: { swapTime }, transaction: t }
      );
    } else {
      await sequelize.query(
        `
        UPDATE students
        SET
          assigned_counsellor_id = CASE student_id ${caseWhen} END,
          reassigneddate         = NOW(),
          updated_at             = NOW()
        WHERE student_id IN (${escapedIds})
        `,
        { transaction: t }
      );
    }

    console.log(`[SWAP] Reassigned ${plan.length} leads.`);

    const logRows = plan.map((p) => ({
      student_id:          p.student_id,
      from_counsellor_id:  p.old_counsellor_id,
      to_counsellor_id:    p.new_counsellor_id,
      trigger_label:       config.label,
      lead_type:           config.leadType,
      status_at_swap:      config.status,
      age_hours_condition: config.ageHours,
      remarks_hidden:      hideRemarks,
      swapped_at:          swapTime,
    }));

    const CHUNK = 500;
    for (let i = 0; i < logRows.length; i += CHUNK) {
      await LeadSwapLog.bulkCreate(logRows.slice(i, i + CHUNK), { validate: false, transaction: t });
    }

    await t.commit();
    console.log(`[SWAP] Logged ${logRows.length} swap entries. Transaction committed.`);
  } catch (err) {
    await t.rollback();
    console.error(`[SWAP] Transaction rolled back:`, err.message);
    throw err;
  }
};

export const runSwap = async (config) => {
  const { label = "Swap" } = config;
  console.log(`[SWAP][${label}] Starting...`);

  try {
    // Double-fire guard: abort if this label already ran in the last 30 minutes
    const recentRun = await LeadSwapLog.findOne({
      where: { trigger_label: label },
      order: [["swapped_at", "DESC"]],
      attributes: ["swapped_at"],
    });

    if (recentRun) {
      const msSince = Date.now() - new Date(recentRun.swapped_at).getTime();
      if (msSince < 30 * 60 * 1000) {
        console.warn(`[SWAP][${label}] Already ran ${Math.round(msSince / 60000)}m ago — skipping to prevent double-fire.`);
        return;
      }
    }

    const leads = await fetchQualifyingLeads(config);
    console.log(`[SWAP][${label}] ${leads.length} qualifying leads found.`);

    if (leads.length === 0) return;

    const grouped = groupByCounsellor(leads);
    console.log(`[SWAP][${label}] Spread across ${Object.keys(grouped).length} counsellors.`);

    const activeCounsellors = await fetchActiveCounsellors();
    console.log(`[SWAP][${label}] ${activeCounsellors.length} active L2 counsellors available.`);

    if (activeCounsellors.length < 2) {
      console.warn(`[SWAP][${label}] Not enough active counsellors to swap. Aborting.`);
      return;
    }

    const plan = buildSwapPlan(grouped, activeCounsellors);
    console.log(`[SWAP][${label}] Swap plan built: ${plan.length} assignments.`);

    await executeSwap(plan, config.hideRemarks, config);
    console.log(`[SWAP][${label}] Done.`);
  } catch (err) {
    console.error(`[SWAP][${label}] Error:`, err.message);
  }
};
