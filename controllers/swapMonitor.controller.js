import sequelize from "../config/database-config.js";
import { QueryTypes } from "sequelize";
import LeadSwapLog from "../models/LeadSwapLog.js";
import { runSwap } from "../service/leadSwapService.js";

const SCHEDULES = {
  "CSL PreApp 1PM":     { leadType: "csl",     status: "Pre Application",              ageHours: 6,  hideRemarks: true,  fireHour: 13, fireMin: 0  },
  "CSL ICC 3PM":        { leadType: "csl",     status: "Initial Counselling Completed", ageHours: 16, hideRemarks: false, skipActiveToday: true, fireHour: 15, fireMin: 0  },
  "NonCSL PreApp 4PM":  { leadType: "non-csl", status: "Pre Application",              ageHours: 24, withinDays: 7, hideRemarks: false, fireHour: 16, fireMin: 0  },
  "CSL PreApp 5PM":     { leadType: "csl",     status: "Pre Application",              ageHours: 6,  hideRemarks: true,  fireHour: 17, fireMin: 0  },
  "NonCSL ICC 11:30AM": { leadType: "non-csl", status: "Initial Counselling Completed", ageHours: 36, hideRemarks: false, skipActiveToday: true, fireHour: 11, fireMin: 30 },
};

export const getSwapMonitorData = async (req, res) => {
  return res.status(200).json({ schedules: Object.keys(SCHEDULES) });
};

export const executeSwapNow = async (req, res) => {
  try {
    const { label } = req.body;
    if (!label || !SCHEDULES[label]) {
      return res.status(400).json({ success: false, message: "Invalid label. Valid options: " + Object.keys(SCHEDULES).join(", ") });
    }
    await runSwap({ ...SCHEDULES[label], label });
    return res.status(200).json({ success: true, message: `Swap executed successfully for "${label}"` });
  } catch (err) {
    console.error("[SwapExecute] Error:", err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const executeSwapSingle = async (req, res) => {
  try {
    const { studentId, fromCounsellorId, toCounsellorId, label } = req.body;
    if (!studentId || !fromCounsellorId || !toCounsellorId || !label) {
      return res.status(400).json({ success: false, message: "studentId, fromCounsellorId, toCounsellorId and label are required" });
    }
    const config = SCHEDULES[label];
    if (!config) {
      return res.status(400).json({ success: false, message: "Invalid label" });
    }

    const swapTime = new Date();
    const t = await sequelize.transaction();
    try {
      if (config.hideRemarks) {
        await sequelize.query(
          `UPDATE student_remarks SET isdisabled = true WHERE student_id = :sid AND isdisabled = false`,
          { replacements: { sid: studentId }, transaction: t }
        );
        await sequelize.query(
          `UPDATE students SET assigned_counsellor_id = :cid, remarks_count = 0, current_student_status = 'Fresh', current_student_ni_sub_status = NULL, first_icc_date = NULL, reassigneddate = :swapTime, created_at = :swapTime, updated_at = :swapTime WHERE student_id = :sid`,
          { replacements: { cid: toCounsellorId, sid: studentId, swapTime }, transaction: t }
        );
      } else {
        await sequelize.query(
          `UPDATE students SET assigned_counsellor_id = :cid, reassigneddate = :swapTime, updated_at = :swapTime WHERE student_id = :sid`,
          { replacements: { cid: toCounsellorId, sid: studentId, swapTime }, transaction: t }
        );
      }

      await LeadSwapLog.create({
        student_id:          studentId,
        from_counsellor_id:  fromCounsellorId,
        to_counsellor_id:    toCounsellorId,
        trigger_label:       `${label} (manual single)`,
        lead_type:           config.leadType,
        status_at_swap:      config.status,
        age_hours_condition: config.ageHours,
        remarks_hidden:      config.hideRemarks || false,
        swapped_at:          swapTime,
      }, { transaction: t });

      await t.commit();
      return res.status(200).json({ success: true, message: `Student ${studentId} swapped successfully` });
    } catch (err) {
      await t.rollback();
      throw err;
    }
  } catch (err) {
    console.error("[SwapSingle] Error:", err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getSwapPreview = async (req, res) => {
  try {
    const { label } = req.query;
    if (!label || !SCHEDULES[label]) {
      return res.status(400).json({
        message: "Invalid label. Valid options: " + Object.keys(SCHEDULES).join(", "),
      });
    }
    const config = SCHEDULES[label];
    const result = await runDryRun(label, config);
    return res.status(200).json(result);
  } catch (err) {
    console.error("[SwapPreview] Error:", err.message);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const getSwapMonitorDashboard = async (req, res) => {
  try {
    const { label } = req.query;
    if (!label || !SCHEDULES[label]) {
      return res.setHeader("Content-Type", "text/html; charset=utf-8").status(200).send(buildPickerHTML());
    }
    const config = SCHEDULES[label];
    const result = await runDryRun(label, config);
    const html = buildResultHTML(label, config, result);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(200).send(html);
  } catch (err) {
    console.error("[SwapMonitor] Error:", err.message);
    return res.status(500).send(`<pre style="color:red">Error: ${err.message}</pre>`);
  }
};

async function runDryRun(label, config) {
  const { leadType, status, ageHours, withinDays, skipActiveToday, hideRemarks } = config;
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

  const [leads, activeCounsellors] = await Promise.all([
    sequelize.query(
      `WITH last_la AS (
         SELECT DISTINCT ON (student_id) student_id, lead_type
         FROM student_lead_activities
         ORDER BY student_id, created_at DESC, id DESC
       )
       SELECT
         s.student_id,
         s.student_name,
         s.assigned_counsellor_id,
         c.counsellor_name,
         s.current_student_status,
         s.created_at,
         EXTRACT(EPOCH FROM (NOW() - s.created_at))/3600 AS age_hours
       FROM students s
       JOIN last_la la ON la.student_id = s.student_id
       LEFT JOIN counsellors c ON c.counsellor_id = s.assigned_counsellor_id
       WHERE s.current_student_status = :status
         AND s.assigned_counsellor_id IS NOT NULL
         AND s.assigned_counsellor_id != ''
         AND s.created_at <= NOW() - INTERVAL '${ageHours} hours'
         ${withinDays ? `AND s.created_at BETWEEN NOW() - INTERVAL '${withinDays} days' AND NOW()` : ""}
         ${skipActiveTodayClause}
         AND ${isCSL ? "LOWER(la.lead_type) = 'csl'" : "LOWER(COALESCE(la.lead_type,'')) != 'csl'"}`,
      { replacements: { status }, type: QueryTypes.SELECT }
    ),
    sequelize.query(
      `SELECT counsellor_id, counsellor_name FROM counsellors
       WHERE role = 'l2'
         AND status = 'active'
         AND is_blocked = false
         AND LOWER(counsellor_name) NOT LIKE '%dummy%'`,
      { type: QueryTypes.SELECT }
    ),
  ]);

  if (leads.length === 0) {
    return {
      total_eligible: 0,
      active_counsellors: activeCounsellors.length,
      leads_per_counsellor: "0",
      swap_plan: [],
      per_counsellor: [],
      gain_view: [],
      warning: null,
    };
  }

  if (activeCounsellors.length < 2) {
    return {
      total_eligible: leads.length,
      active_counsellors: activeCounsellors.length,
      leads_per_counsellor: "0",
      swap_plan: [],
      per_counsellor: [],
      gain_view: [],
      warning: "Not enough active counsellors to swap (need at least 2).",
    };
  }

  const activeCounsellorIds = activeCounsellors.map((c) => c.counsellor_id);
  const counsellorNameMap = Object.fromEntries(activeCounsellors.map((c) => [c.counsellor_id, c.counsellor_name]));

  const grouped = {};
  for (const lead of leads) {
    const cid = lead.assigned_counsellor_id;
    if (!grouped[cid]) grouped[cid] = [];
    grouped[cid].push(lead);
  }

  const swapPlan = [];
  const allLeads = [];
  for (const [ownerCid, ownerLeadsList] of Object.entries(grouped)) {
    for (const lead of ownerLeadsList) {
      allLeads.push({ ...lead, ownerCid, ownerName: ownerLeadsList[0].counsellor_name || ownerCid });
    }
  }

  const total = allLeads.length;
  const n = activeCounsellorIds.length;
  const base = Math.floor(total / n);
  const extra = total % n;

  const slotsLeft = {};
  activeCounsellorIds.forEach((cid, i) => {
    slotsLeft[cid] = i < extra ? base + 1 : base;
  });

  for (const lead of allLeads) {
    const eligible = activeCounsellorIds.filter((cid) => cid !== lead.ownerCid && slotsLeft[cid] > 0);
    const pool = eligible.length > 0 ? eligible : activeCounsellorIds.filter((cid) => cid !== lead.ownerCid);
    if (pool.length === 0) continue;

    const toCid = pool.reduce((max, cid) => slotsLeft[cid] > slotsLeft[max] ? cid : max);
    slotsLeft[toCid]--;

    swapPlan.push({
      student_id: lead.student_id,
      student_name: lead.student_name,
      age_hours: Math.round(lead.age_hours),
      from_id: lead.ownerCid,
      from_name: lead.ownerName,
      to_id: toCid,
      to_name: counsellorNameMap[toCid] || toCid,
    });
  }

  const gainMap = {};
  const lossMap = {};
  for (const row of swapPlan) {
    if (!gainMap[row.to_id]) gainMap[row.to_id] = { name: row.to_name, total_gain: 0, from_breakdown: {} };
    gainMap[row.to_id].total_gain++;
    gainMap[row.to_id].from_breakdown[row.from_id] = (gainMap[row.to_id].from_breakdown[row.from_id] || 0) + 1;
    if (!lossMap[row.from_id]) lossMap[row.from_id] = { name: row.from_name, total_loss: 0 };
    lossMap[row.from_id].total_loss++;
  }

  const perCounsellor = Object.entries(grouped).map(([ownerCid, ownerLeadsList]) => {
    const ownerName = ownerLeadsList[0].counsellor_name || ownerCid;
    const assignments = {};
    for (const row of swapPlan) {
      if (row.from_id === ownerCid) {
        assignments[row.to_id] = (assignments[row.to_id] || 0) + 1;
      }
    }
    return {
      from_id: ownerCid,
      from_name: ownerName,
      total_leads_owned: ownerLeadsList.length,
      distributed_to: Object.entries(assignments).map(([cid, count]) => ({
        to_id: cid,
        to_name: counsellorNameMap[cid] || cid,
        count,
      })),
    };
  });

  const gainView = Object.entries(gainMap).map(([cid, g]) => ({
    counsellor_id: cid,
    counsellor_name: g.name,
    total_gain: g.total_gain,
    from_owners: Object.entries(g.from_breakdown).map(([fid, cnt]) => ({
      from_id: fid,
      from_name: counsellorNameMap[fid] || fid,
      count: cnt,
    })).sort((a, b) => b.count - a.count),
  })).sort((a, b) => b.total_gain - a.total_gain);

  return {
    total_eligible: leads.length,
    active_counsellors: activeCounsellors.length,
    leads_per_counsellor: `${base}-${base + 1}`,
    swap_plan: swapPlan,
    per_counsellor: perCounsellor,
    gain_view: gainView,
    warning: null,
  };
}

function buildPickerHTML() {
  const cards = Object.entries(SCHEDULES).map(([label, cfg]) => {
    const color = cfg.leadType === "csl" ? "#f97316" : "#8b5cf6";
    const fireTime = `${String(cfg.fireHour).padStart(2,"0")}:${String(cfg.fireMin).padStart(2,"0")} IST`;
    const action = cfg.hideRemarks
      ? `<span style="color:#ef4444;font-weight:600;">🔒 Hide remarks + reset</span>`
      : `<span style="color:#2563eb;font-weight:600;">📋 Counsellor change only</span>`;
    return `
      <a href="?label=${encodeURIComponent(label)}" style="text-decoration:none;">
        <div style="border:2px solid ${color}33;border-radius:12px;padding:20px;background:${color}08;cursor:pointer;transition:box-shadow 0.2s;"
             onmouseover="this.style.boxShadow='0 4px 20px ${color}44'" onmouseout="this.style.boxShadow='none'">
          <span style="background:${color};color:#fff;font-size:11px;font-weight:700;padding:3px 10px;border-radius:99px;">${cfg.leadType.toUpperCase()}</span>
          <div style="font-size:28px;font-weight:800;color:#0f172a;margin:10px 0 4px;">${fireTime}</div>
          <div style="font-size:13px;color:#334155;font-weight:600;">${label}</div>
          <div style="font-size:12px;color:#64748b;margin-top:6px;line-height:1.7;">
            Status: ${cfg.status}<br/>
            Age filter: &gt;${cfg.ageHours}h${cfg.withinDays ? ` · within ${cfg.withinDays}d` : ""}${cfg.skipActiveToday ? " · skip active today" : ""}<br/>
            ${action}
          </div>
        </div>
      </a>`;
  }).join("");

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/>
<title>Swap Preview — Pick Schedule</title>
<style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f1f5f9;padding:40px 20px;}</style>
</head><body>
<div style="max-width:900px;margin:0 auto;">
  <h1 style="font-size:22px;font-weight:800;color:#0f172a;margin-bottom:6px;">Lead Swap Dry-Run Preview</h1>
  <p style="color:#64748b;font-size:13px;margin-bottom:28px;">Pick a cron schedule to see how many leads are eligible <b>right now</b> and how they would be distributed — no actual swap happens.</p>
  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:16px;">
    ${cards}
  </div>
</div>
</body></html>`;
}

function buildResultHTML(label, config, result) {
  const color = config.leadType === "csl" ? "#f97316" : "#8b5cf6";
  const fireTime = `${String(config.fireHour).padStart(2,"0")}:${String(config.fireMin).padStart(2,"0")} IST`;

  const warningBlock = result.warning
    ? `<div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:10px;padding:14px 18px;color:#991b1b;font-size:13px;margin-bottom:24px;">⚠️ ${result.warning}</div>`
    : "";

  const statsHTML = `
    <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:28px;">
      <div style="background:#fff;border-radius:12px;padding:20px 28px;border:1px solid #e2e8f0;text-align:center;">
        <div style="font-size:36px;font-weight:800;color:#2563eb;">${result.total_eligible}</div>
        <div style="font-size:12px;color:#64748b;font-weight:600;margin-top:4px;">ELIGIBLE LEADS</div>
      </div>
      <div style="background:#fff;border-radius:12px;padding:20px 28px;border:1px solid #e2e8f0;text-align:center;">
        <div style="font-size:36px;font-weight:800;color:#16a34a;">${result.active_counsellors}</div>
        <div style="font-size:12px;color:#64748b;font-weight:600;margin-top:4px;">ACTIVE COUNSELLORS</div>
      </div>
      <div style="background:#fff;border-radius:12px;padding:20px 28px;border:1px solid #e2e8f0;text-align:center;">
        <div style="font-size:36px;font-weight:800;color:#7c3aed;">${result.leads_per_counsellor}</div>
        <div style="font-size:12px;color:#64748b;font-weight:600;margin-top:4px;">LEADS PER COUNSELLOR</div>
      </div>
      <div style="background:#fff;border-radius:12px;padding:20px 28px;border:1px solid #e2e8f0;text-align:center;">
        <div style="font-size:36px;font-weight:800;color:#7c3aed;">${result.per_counsellor.length}</div>
        <div style="font-size:12px;color:#64748b;font-weight:600;margin-top:4px;">COUNSELLORS LOSING LEADS</div>
      </div>
      <div style="background:${config.hideRemarks ? "#fef2f2" : "#f0fdf4"};border-radius:12px;padding:20px 28px;border:1px solid ${config.hideRemarks ? "#fca5a5" : "#86efac"};text-align:center;">
        <div style="font-size:24px;font-weight:800;color:${config.hideRemarks ? "#dc2626" : "#16a34a"};">${config.hideRemarks ? "🔒" : "📋"}</div>
        <div style="font-size:12px;color:#64748b;font-weight:600;margin-top:4px;">${config.hideRemarks ? "REMARKS HIDDEN + RESET" : "COUNSELLOR CHANGE ONLY"}</div>
      </div>
    </div>`;

  const gainHTML = (result.gain_view || []).map((row) => {
    const fromRows = row.from_owners.map((f) =>
      `<div style="display:flex;align-items:center;gap:8px;padding:4px 0;border-bottom:1px solid #f1f5f9;">
         <span style="color:#64748b;font-size:11px;width:18px;text-align:right;">${f.count}×</span>
         <span style="font-size:11px;color:#374151;">← ${f.from_name}</span>
       </div>`
    ).join("");
    return `
      <div style="background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:14px;margin-bottom:10px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
          <span style="font-size:13px;font-weight:700;color:#0f172a;">${row.counsellor_name}</span>
          <span style="background:#dcfce7;color:#166534;font-size:12px;font-weight:700;padding:2px 10px;border-radius:99px;">+${row.total_gain} leads</span>
        </div>
        <div style="padding-left:4px;">${fromRows}</div>
      </div>`;
  }).join("");

  const perCounsellorHTML = result.per_counsellor.length === 0
    ? `<p style="color:#94a3b8;font-size:13px;padding:20px 0;">No leads to distribute.</p>`
    : result.per_counsellor.map((row) => {
        const distRows = row.distributed_to.map((d) =>
          `<div style="display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid #f1f5f9;">
             <span style="color:#64748b;font-size:12px;width:20px;text-align:right;">${d.count}×</span>
             <span style="font-size:12px;color:#374151;">→ ${d.to_name}</span>
           </div>`
        ).join("");
        return `
          <div style="background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:16px;margin-bottom:12px;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
              <div>
                <span style="font-size:14px;font-weight:700;color:#0f172a;">${row.from_name}</span>
                <span style="font-size:11px;color:#94a3b8;margin-left:8px;">loses ${row.total_leads_owned} lead${row.total_leads_owned !== 1 ? "s" : ""}</span>
              </div>
              <span style="background:#e0e7ff;color:#3730a3;font-size:12px;font-weight:700;padding:2px 10px;border-radius:99px;">${row.total_leads_owned} leads</span>
            </div>
            <div style="padding-left:8px;">${distRows}</div>
          </div>`;
      }).join("");

  const planRows = result.swap_plan.length === 0
    ? `<tr><td colspan="6" style="text-align:center;padding:30px;color:#94a3b8;">No swaps in this run</td></tr>`
    : result.swap_plan.map((row, i) =>
        `<tr id="row-${row.student_id}" style="background:${i % 2 === 0 ? "#fff" : "#f8fafc"};">
           <td style="padding:8px 14px;font-size:12px;color:#374151;">${row.student_id}</td>
           <td style="padding:8px 14px;font-size:12px;color:#374151;">${row.student_name || "—"}</td>
           <td style="padding:8px 14px;font-size:12px;color:#374151;">${row.from_name}</td>
           <td style="padding:8px 14px;font-size:12px;color:#374151;">${row.to_name}</td>
           <td style="padding:8px 14px;font-size:12px;text-align:center;">
             <span style="background:#fef9c3;color:#854d0e;font-size:11px;font-weight:600;padding:1px 8px;border-radius:99px;">${row.age_hours}h old</span>
           </td>
           <td style="padding:8px 14px;text-align:center;">
             <button class="swap-btn" data-sid="${row.student_id}" data-fid="${row.from_id}" data-tid="${row.to_id}"
               style="background:#2563eb;color:#fff;border:none;border-radius:6px;padding:4px 12px;font-size:11px;font-weight:600;cursor:pointer;">
               Swap
             </button>
           </td>
         </tr>`
      ).join("");

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/>
<title>Swap Preview — ${label}</title>
<style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f1f5f9;padding:32px 20px;}</style>
</head><body>
<span id="swap-label-data" style="display:none;">${label}</span>
<div style="max-width:1100px;margin:0 auto;">

  <div style="margin-bottom:24px;">
    <a href="?" style="font-size:13px;color:#2563eb;text-decoration:none;">← Back to schedule picker</a>
    <div style="display:flex;align-items:center;gap:12px;margin-top:12px;">
      <span style="background:${color};color:#fff;font-size:12px;font-weight:700;padding:3px 12px;border-radius:99px;">${config.leadType.toUpperCase()}</span>
      <h1 style="font-size:22px;font-weight:800;color:#0f172a;">${label}</h1>
      <span style="font-size:14px;color:#64748b;">fires at ${fireTime} · &gt;${config.ageHours}h age${config.withinDays ? ` · within ${config.withinDays}d` : ""}${config.skipActiveToday ? " · skip remarked/callback today" : ""} · ${config.status}</span>
    </div>
    <p style="font-size:13px;color:#94a3b8;margin-top:6px;">This is a <b>dry-run simulation</b> — shows what would happen if this cron ran right now. Use the buttons below to execute.</p>
  </div>

  ${warningBlock}
  ${statsHTML}

  <!-- Execute All button -->
  ${result.swap_plan.length > 0 ? `
  <div style="margin-bottom:24px;">
    <div id="resultBanner" style="display:none;margin-bottom:12px;"></div>
    <button id="execBtn" onclick="showConfirm()"
      style="background:#dc2626;color:#fff;border:none;border-radius:8px;padding:12px 28px;font-size:14px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:8px;">
      ⚡ Execute All ${result.swap_plan.length} Swaps Now
    </button>
  </div>

  <!-- Confirm modal -->
  <div id="confirmModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:1000;align-items:center;justify-content:center;">
    <div style="background:#fff;border-radius:16px;padding:32px;max-width:420px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,0.3);">
      <h2 style="font-size:18px;font-weight:800;color:#0f172a;margin-bottom:8px;">Confirm Swap</h2>
      <p style="font-size:14px;color:#64748b;margin-bottom:24px;">This will actually swap <b>${result.swap_plan.length} leads</b> for <b>${label}</b>. This cannot be undone.</p>
      <div style="display:flex;gap:12px;justify-content:flex-end;">
        <button onclick="hideConfirm()" style="background:#f1f5f9;border:none;border-radius:8px;padding:10px 20px;font-size:13px;font-weight:600;cursor:pointer;">Cancel</button>
        <button onclick="doSwap()" style="background:#dc2626;color:#fff;border:none;border-radius:8px;padding:10px 20px;font-size:13px;font-weight:700;cursor:pointer;">Yes, Execute Now</button>
      </div>
    </div>
  </div>` : ""}

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:28px;">
    <div>
      <h2 style="font-size:15px;font-weight:700;color:#dc2626;margin-bottom:14px;">📤 Who LOSES leads</h2>
      ${perCounsellorHTML}
    </div>
    <div>
      <h2 style="font-size:15px;font-weight:700;color:#16a34a;margin-bottom:14px;">📥 Who GAINS leads (~${result.leads_per_counsellor} each)</h2>
      ${gainHTML || '<p style="color:#94a3b8;font-size:13px;">No gains calculated.</p>'}
    </div>
  </div>

  <div>
    <h2 style="font-size:15px;font-weight:700;color:#334155;margin-bottom:14px;">Full Swap Plan (${result.swap_plan.length} leads)</h2>
    <div style="background:#fff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;max-height:500px;overflow-y:auto;">
      <table style="width:100%;border-collapse:collapse;">
        <thead style="position:sticky;top:0;">
          <tr style="background:#f8fafc;border-bottom:2px solid #e2e8f0;">
            <th style="padding:10px 14px;font-size:11px;text-align:left;color:#64748b;">STUDENT ID</th>
            <th style="padding:10px 14px;font-size:11px;text-align:left;color:#64748b;">NAME</th>
            <th style="padding:10px 14px;font-size:11px;text-align:left;color:#64748b;">FROM</th>
            <th style="padding:10px 14px;font-size:11px;text-align:left;color:#64748b;">TO</th>
            <th style="padding:10px 14px;font-size:11px;text-align:center;color:#64748b;">AGE</th>
            <th style="padding:10px 14px;font-size:11px;text-align:center;color:#64748b;">ACTION</th>
          </tr>
        </thead>
        <tbody>${planRows}</tbody>
      </table>
    </div>
  </div>
</div>

<script>
  var SWAP_LABEL = document.getElementById('swap-label-data').textContent;

  function showConfirm() { var m = document.getElementById('confirmModal'); if (m) m.style.display = 'flex'; }
  function hideConfirm() { var m = document.getElementById('confirmModal'); if (m) m.style.display = 'none'; }

  function doSwap() {
    hideConfirm();
    var btn = document.getElementById('execBtn');
    var banner = document.getElementById('resultBanner');
    btn.disabled = true; btn.style.background = '#6b7280'; btn.textContent = 'Executing...';
    fetch('/v1/swap-monitor/execute', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ label: SWAP_LABEL }) })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data.success) {
          banner.innerHTML = '<div style="padding:14px 18px;background:#f0fdf4;border:1px solid #86efac;border-radius:10px;color:#166534;font-weight:600;">✅ ' + data.message + '</div>';
          btn.style.background = '#16a34a'; btn.textContent = '✅ Swap Executed';
        } else {
          banner.innerHTML = '<div style="padding:14px 18px;background:#fef2f2;border:1px solid #fca5a5;border-radius:10px;color:#991b1b;font-weight:600;">❌ Error: ' + (data.message || 'failed') + '</div>';
          btn.disabled = false; btn.style.background = '#dc2626'; btn.textContent = '⚡ Execute All Swaps Now';
        }
        banner.style.display = 'block';
      })
      .catch(function(err) {
        banner.innerHTML = '<div style="padding:14px 18px;background:#fef2f2;border:1px solid #fca5a5;border-radius:10px;color:#991b1b;font-weight:600;">Network error: ' + err.message + '</div>';
        btn.disabled = false; btn.style.background = '#dc2626'; btn.textContent = '⚡ Execute All Swaps Now';
        banner.style.display = 'block';
      });
  }

  document.addEventListener('click', function(e) {
    var btn = e.target.closest('.swap-btn');
    if (!btn || btn.disabled) return;
    var sid = btn.getAttribute('data-sid');
    var fid = btn.getAttribute('data-fid');
    var tid = btn.getAttribute('data-tid');
    if (!confirm('Swap student ' + sid + '?')) return;
    btn.disabled = true; btn.textContent = '...'; btn.style.background = '#6b7280';
    fetch('/v1/swap-monitor/execute-single', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ studentId: sid, fromCounsellorId: fid, toCounsellorId: tid, label: SWAP_LABEL }) })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data.success) {
          btn.textContent = '✅ Done'; btn.style.background = '#16a34a';
          var row = document.getElementById('row-' + sid);
          if (row) row.style.opacity = '0.4';
        } else {
          alert('Error: ' + (data.message || 'Swap failed'));
          btn.textContent = 'Swap'; btn.style.background = '#2563eb'; btn.disabled = false;
        }
      })
      .catch(function(err) {
        alert('Network error: ' + err.message);
        btn.textContent = 'Swap'; btn.style.background = '#2563eb'; btn.disabled = false;
      });
  });
</script>
</body></html>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// SWAP ANALYSIS — JSON endpoints for React frontend
// ─────────────────────────────────────────────────────────────────────────────

const APP_STATUSES_SQL = [
  "Exam Interview Pending", "Ready For Admission", "Offer Letter/Results Pending",
  "Form Filled_Partner website", "Form Submitted – Portal Pending",
  "Offer Letter/Results Released", "Application Fee Paid", "Walkin Completed",
  "Form Submitted – Offline", "Form Filled_Degreefyd", "Exam/Interview Scheduled",
  "Exam/Interview Pending", "Form Submitted – Completed",
  "Admission", "Enrolled",
].map((s) => `'${s.replace(/'/g, "''")}'`).join(",");

function buildAnalysisFilters(filters = {}) {
  const { studentFrom, studentTo, swapFrom, swapTo, sources = [], sourceUrls = [], campaigns = [], rulesets = [] } = filters;
  const rep = {};
  const lslConds = [];
  const rmkConds = [];
  const swapCteConds = [];

  if (swapFrom)    { lslConds.push("lsl.swapped_at >= :swapFrom"); swapCteConds.push("swapped_at >= :swapFrom"); rep.swapFrom = swapFrom; }
  if (swapTo)      { lslConds.push("lsl.swapped_at <= :swapTo");   swapCteConds.push("swapped_at <= :swapTo");   rep.swapTo   = swapTo; }
  if (studentFrom) { lslConds.push("s.created_at >= :studentFrom"); rmkConds.push("s.created_at >= :studentFrom"); rep.studentFrom = studentFrom; }
  if (studentTo)   { lslConds.push("s.created_at <= :studentTo");   rmkConds.push("s.created_at <= :studentTo");   rep.studentTo   = studentTo; }

  if (rulesets.length > 0) {
    const keys = rulesets.map((_, i) => `:rs_${i}`).join(",");
    lslConds.push(`REGEXP_REPLACE(lsl.trigger_label, ' \\(manual single\\)$', '') IN (${keys})`);
    swapCteConds.push(`REGEXP_REPLACE(trigger_label, ' \\(manual single\\)$', '') IN (${keys})`);
    rulesets.forEach((v, i) => { rep[`rs_${i}`] = v; });
  }

  const hasAct = sources.length > 0 || sourceUrls.length > 0 || campaigns.length > 0;
  if (sources.length > 0) {
    const keys = sources.map((_, i) => `:src_${i}`).join(",");
    lslConds.push(`fa.source IN (${keys})`); rmkConds.push(`fa.source IN (${keys})`);
    sources.forEach((v, i) => { rep[`src_${i}`] = v; });
  }
  if (sourceUrls.length > 0) {
    const keys = sourceUrls.map((_, i) => `:surl_${i}`).join(",");
    lslConds.push(`fa.source_url IN (${keys})`); rmkConds.push(`fa.source_url IN (${keys})`);
    sourceUrls.forEach((v, i) => { rep[`surl_${i}`] = v; });
  }
  if (campaigns.length > 0) {
    const keys = campaigns.map((_, i) => `:camp_${i}`).join(",");
    lslConds.push(`fa.utm_campaign IN (${keys})`); rmkConds.push(`fa.utm_campaign IN (${keys})`);
    campaigns.forEach((v, i) => { rep[`camp_${i}`] = v; });
  }

  return {
    rep,
    swapCteWhere: swapCteConds.length ? `WHERE ${swapCteConds.join(" AND ")}` : "",
    lslWhere:     lslConds.length     ? `AND ${lslConds.join(" AND ")}`       : "",
    rmkWhere:     rmkConds.length     ? `AND ${rmkConds.join(" AND ")}`       : "",
    actCTE: hasAct ? `,
  first_activity AS (
    SELECT DISTINCT ON (student_id) student_id, source, source_url, utm_campaign
    FROM student_lead_activities ORDER BY student_id, created_at ASC, id ASC
  )` : "",
    actJoinLSL: hasAct ? "JOIN first_activity fa ON fa.student_id = lsl.student_id" : "",
    actJoinSR:  hasAct ? "JOIN first_activity fa ON fa.student_id = sr.student_id"  : "",
  };
}

async function fetchSwapAnalysisData(filters = {}) {
  const f = buildAnalysisFilters(filters);

  const [summaryRows, counsellorRows] = await Promise.all([
    sequelize.query(
      `WITH first_swap AS (
         SELECT student_id, MIN(swapped_at) AS first_swapped_at
         FROM lead_swap_logs ${f.swapCteWhere} GROUP BY student_id
       )${f.actCTE},
       filtered AS (
         SELECT lsl.student_id, lsl.status_at_swap, s.current_student_status
         FROM lead_swap_logs lsl
         JOIN students s ON s.student_id = lsl.student_id
         ${f.actJoinLSL}
         WHERE 1=1 ${f.lslWhere}
       )
       SELECT
         COUNT(*)::int AS total_swaps,
         COUNT(DISTINCT student_id)::int AS unique_students,
         COUNT(*) FILTER (WHERE status_at_swap = 'Pre Application')::int AS pre_app_swaps,
         COUNT(*) FILTER (WHERE status_at_swap = 'Initial Counselling Completed')::int AS icc_swaps,
         COUNT(DISTINCT CASE WHEN status_at_swap = 'Pre Application'
           AND current_student_status = 'Initial Counselling Completed' THEN student_id END)::int AS pre_to_icc,
         COUNT(DISTINCT CASE WHEN status_at_swap = 'Initial Counselling Completed'
           AND current_student_status IN (${APP_STATUSES_SQL}) THEN student_id END)::int AS icc_to_app,
         COUNT(DISTINCT CASE WHEN current_student_status = 'Not Interested' THEN student_id END)::int AS not_interested_count,
         (SELECT COUNT(*)::int FROM student_remarks sr
          JOIN first_swap fs ON fs.student_id = sr.student_id
          JOIN students s    ON s.student_id  = sr.student_id
          ${f.actJoinSR}
          WHERE sr.created_at > fs.first_swapped_at AND sr.isdisabled = false ${f.rmkWhere}) AS total_remarks_after_swap
       FROM filtered`,
      { replacements: f.rep, type: QueryTypes.SELECT }
    ),
    sequelize.query(
      `WITH first_swap AS (
         SELECT student_id, MIN(swapped_at) AS first_swapped_at
         FROM lead_swap_logs ${f.swapCteWhere} GROUP BY student_id
       )${f.actCTE},
       counsellor_stats AS (
         SELECT
           lsl.to_counsellor_id,
           c.counsellor_name,
           COALESCE(c.assigned_to::text, '')  AS supervisor_id,
           COALESCE(sup.counsellor_name, '—') AS supervisor_name,
           COUNT(DISTINCT lsl.student_id)::int AS total_swaps,
           COUNT(DISTINCT CASE WHEN lsl.status_at_swap = 'Pre Application' THEN lsl.student_id END)::int AS pre_app_swaps,
           COUNT(DISTINCT CASE WHEN lsl.status_at_swap = 'Initial Counselling Completed' THEN lsl.student_id END)::int AS icc_swaps,
           COUNT(DISTINCT CASE WHEN lsl.status_at_swap = 'Pre Application'
             AND s.current_student_status = 'Initial Counselling Completed' THEN lsl.student_id END)::int AS pre_to_icc,
           COUNT(DISTINCT CASE WHEN lsl.status_at_swap = 'Initial Counselling Completed'
             AND s.current_student_status IN (${APP_STATUSES_SQL}) THEN lsl.student_id END)::int AS icc_to_app,
           COUNT(DISTINCT CASE WHEN s.current_student_status = 'Not Interested' THEN lsl.student_id END)::int AS not_interested_count
         FROM lead_swap_logs lsl
         JOIN counsellors c        ON c.counsellor_id   = lsl.to_counsellor_id
         LEFT JOIN counsellors sup ON sup.counsellor_id = c.assigned_to
         JOIN students s           ON s.student_id      = lsl.student_id
         ${f.actJoinLSL}
         WHERE 1=1 ${f.lslWhere}
         GROUP BY lsl.to_counsellor_id, c.counsellor_name, c.assigned_to, sup.counsellor_name
       ),
       remarks_per_counsellor AS (
         SELECT lsl.to_counsellor_id, COUNT(DISTINCT lsl.student_id)::int AS remarks_after_swap
         FROM lead_swap_logs lsl
         JOIN first_swap fs ON fs.student_id = lsl.student_id
         JOIN students s    ON s.student_id  = lsl.student_id
         JOIN student_remarks sr ON sr.student_id = lsl.student_id
           AND sr.created_at > fs.first_swapped_at AND sr.isdisabled = false
         ${f.actJoinLSL}
         WHERE 1=1 ${f.lslWhere}
         GROUP BY lsl.to_counsellor_id
       )
       SELECT cs.*, COALESCE(rpc.remarks_after_swap, 0) AS remarks_after_swap
       FROM counsellor_stats cs
       LEFT JOIN remarks_per_counsellor rpc ON rpc.to_counsellor_id = cs.to_counsellor_id
       ORDER BY cs.total_swaps DESC`,
      { replacements: f.rep, type: QueryTypes.SELECT }
    ),
  ]);

  return { summary: summaryRows[0] || {}, counsellorRows };
}

export const getSwapAnalysisFilters = async (req, res) => {
  try {
    const rows = await sequelize.query(
      `SELECT DISTINCT fa.source, fa.source_url, fa.utm_campaign
       FROM (
         SELECT DISTINCT ON (la.student_id) la.student_id, la.source, la.source_url, la.utm_campaign
         FROM student_lead_activities la
         WHERE la.student_id IN (SELECT DISTINCT student_id FROM lead_swap_logs)
         ORDER BY la.student_id, la.created_at ASC, la.id ASC
       ) fa
       WHERE fa.source IS NOT NULL OR fa.source_url IS NOT NULL OR fa.utm_campaign IS NOT NULL`,
      { type: QueryTypes.SELECT }
    );
    const sources    = [...new Set(rows.map((r) => r.source).filter(Boolean))].sort();
    const sourceUrls = [...new Set(rows.map((r) => r.source_url).filter(Boolean))].sort();
    const campaigns  = [...new Set(rows.map((r) => r.utm_campaign).filter(Boolean))].sort();
    return res.status(200).json({ success: true, sources, sourceUrls, campaigns, rulesets: Object.keys(SCHEDULES) });
  } catch (err) {
    console.error("[SwapAnalysisFilters] Error:", err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getSwapAnalysisData = async (req, res) => {
  try {
    const { studentFrom, studentTo, swapFrom, swapTo } = req.query;
    const sources    = req.query.sources    ? req.query.sources.split(",").filter(Boolean)    : [];
    const sourceUrls = req.query.sourceUrls ? req.query.sourceUrls.split(",").filter(Boolean) : [];
    const campaigns  = req.query.campaigns  ? req.query.campaigns.split(",").filter(Boolean)  : [];
    const rulesets   = req.query.rulesets   ? req.query.rulesets.split(",").filter(Boolean)   : [];
    const filters    = { studentFrom, studentTo, swapFrom, swapTo, sources, sourceUrls, campaigns, rulesets };
    const { summary, counsellorRows } = await fetchSwapAnalysisData(filters);
    return res.status(200).json({ success: true, summary, counsellorRows });
  } catch (err) {
    console.error("[SwapAnalysisData] Error:", err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getSwapDrilldown = async (req, res) => {
  try {
    const { type, id, metric } = req.query;
    if (!type || !id || !metric) {
      return res.status(400).json({ success: false, message: "type, id and metric are required" });
    }

    const counsellorFilter = type === "supervisor"
      ? `lsl.to_counsellor_id IN (SELECT counsellor_id FROM counsellors WHERE assigned_to::text = :id)`
      : `lsl.to_counsellor_id = :id`;

    let rows;

    if (metric === "remarks_after_swap") {
      rows = await sequelize.query(
        `WITH global_first AS (
           SELECT student_id, MIN(swapped_at) AS first_swapped_at
           FROM lead_swap_logs GROUP BY student_id
         ),
         target AS (
           SELECT DISTINCT ON (lsl.student_id) lsl.student_id, lsl.to_counsellor_id
           FROM lead_swap_logs lsl
           WHERE ${counsellorFilter}
           ORDER BY lsl.student_id, lsl.swapped_at DESC
         )
         SELECT
           t.student_id,
           s.student_name,
           s.current_student_status,
           gf.first_swapped_at AS swapped_at,
           COUNT(sr.id)::int   AS remark_count,
           c.counsellor_name   AS to_counsellor
         FROM target t
         JOIN global_first gf ON gf.student_id   = t.student_id
         JOIN students s      ON s.student_id    = t.student_id
         JOIN counsellors c   ON c.counsellor_id = t.to_counsellor_id
         JOIN student_remarks sr ON sr.student_id = t.student_id
           AND sr.created_at > gf.first_swapped_at AND sr.isdisabled = false
         GROUP BY t.student_id, t.to_counsellor_id, s.student_name, s.current_student_status, gf.first_swapped_at, c.counsellor_name
         HAVING COUNT(sr.id) > 0
         ORDER BY COUNT(sr.id) DESC, s.student_name`,
        { replacements: { id }, type: QueryTypes.SELECT }
      );
    } else {
      const metricFilter = {
        total_swaps:          "",
        pre_app_swaps:        `AND lsl.status_at_swap = 'Pre Application'`,
        icc_swaps:            `AND lsl.status_at_swap = 'Initial Counselling Completed'`,
        pre_to_icc:           `AND lsl.status_at_swap = 'Pre Application' AND s.current_student_status = 'Initial Counselling Completed'`,
        icc_to_app:           `AND lsl.status_at_swap = 'Initial Counselling Completed' AND s.current_student_status IN (${APP_STATUSES_SQL})`,
        not_interested_count: `AND s.current_student_status = 'Not Interested'`,
      }[metric] ?? "";

      rows = await sequelize.query(
        `SELECT DISTINCT ON (lsl.student_id)
           lsl.student_id, s.student_name, s.current_student_status,
           lsl.status_at_swap, lsl.swapped_at,
           from_c.counsellor_name AS from_counsellor,
           to_c.counsellor_name   AS to_counsellor
         FROM lead_swap_logs lsl
         JOIN students s         ON s.student_id         = lsl.student_id
         JOIN counsellors from_c ON from_c.counsellor_id = lsl.from_counsellor_id
         JOIN counsellors to_c   ON to_c.counsellor_id   = lsl.to_counsellor_id
         WHERE ${counsellorFilter} ${metricFilter}
         ORDER BY lsl.student_id, lsl.swapped_at DESC`,
        { replacements: { id }, type: QueryTypes.SELECT }
      );
    }

    return res.status(200).json({ success: true, rows, metric });
  } catch (err) {
    console.error("[SwapDrilldown] Error:", err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};
