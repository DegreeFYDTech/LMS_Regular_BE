import sequelize from "../config/database-config.js";

const escape = (val) =>
  typeof val === "string"
    ? "'" + val.replace(/'/g, "''") + "'"
    : val === null || val === undefined
      ? "NULL"
      : val;

export const getOptimizedOverallStatsFromHelper = async ({
  studentWhere = "1=1",
  utmWhere = "1=1",
  selectedagent,
  callback,
  role = "l2",
  is_CSL,
}) => {
  try {
    const wishlistAgentFilter = selectedagent
      ? `AND sw.counsellor_id = ${escape(selectedagent)}`
      : "";

    const todaycallbacks = selectedagent
      ? `AND lr.counsellor_id = ${escape(selectedagent)}`
      : "";

    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const todayStartStr = todayStr + " 00:00:00";
    const todayEndStr = todayStr + " 23:59:59";

    let callbackJoin = "";
    if (callback) {
      let callbackDateCond = "";
      switch (callback.toLowerCase()) {
        case "today":
          callbackDateCond = `lr_cb.callback_date >= '${todayStartStr}'::timestamp AND lr_cb.callback_date <= '${todayEndStr}'::timestamp`;
          break;
        case "overdue":
          callbackDateCond = `lr_cb.callback_date < '${todayStartStr}'::timestamp AND lr_cb.callback_date IS NOT NULL`;
          break;
        case "all":
          callbackDateCond = `lr_cb.callback_date IS NOT NULL`;
          break;
        case "combined":
          callbackDateCond = `lr_cb.callback_date <= '${todayEndStr}'::timestamp AND lr_cb.callback_date IS NOT NULL`;
          break;
      }
      if (callbackDateCond) {
        callbackJoin = `
        INNER JOIN (
          SELECT DISTINCT ON (sr.student_id) sr.student_id, sr.callback_date
          FROM student_remarks sr
          ORDER BY sr.student_id, sr.created_at DESC
        ) lr_cb ON lr_cb.student_id = s.student_id AND ${callbackDateCond}`;
      }
    }

    const query = `
      WITH base_students AS (
        SELECT DISTINCT s.student_id,
               s.number_of_unread_messages,
               s.created_at as student_created_at,
               s.is_connected_yet,
               s.is_connected_yet_l3,
               s.total_remarks_l3,
               s.source,
               s.is_reactivity,
               s.current_student_status,
                              s.is_reassigned_yet

        FROM students s
        ${callbackJoin}
        ${
          utmWhere !== "1=1"
            ? `
          INNER JOIN student_lead_activities la ON s.student_id = la.student_id
          AND (${utmWhere})
        `
            : ""
        }
        WHERE (${studentWhere})
        ${
          is_CSL === "yes"
            ? `AND EXISTS (
              SELECT 1 FROM (
                SELECT DISTINCT ON (la2.student_id) la2.student_id, la2.lead_type
                FROM student_lead_activities la2
                WHERE la2.student_id = s.student_id
                ORDER BY la2.student_id, la2.created_at DESC
              ) latest_la WHERE latest_la.lead_type ILIKE 'CSL'
            )`
            : is_CSL === "no"
              ? `AND NOT EXISTS (
              SELECT 1 FROM (
                SELECT DISTINCT ON (la2.student_id) la2.student_id, la2.lead_type
                FROM student_lead_activities la2
                WHERE la2.student_id = s.student_id
                ORDER BY la2.student_id, la2.created_at DESC
              ) latest_la WHERE latest_la.lead_type ILIKE 'CSL'
            )`
              : ""
        }
      ),
     fresh_leads AS (
        ${
          role === "l3"
            ? `
          SELECT bs.student_id
          FROM base_students bs
          WHERE NOT EXISTS (
            SELECT 1 FROM student_remarks sr
            WHERE sr.student_id = bs.student_id
            ${selectedagent ? `AND sr.counsellor_id = ${escape(selectedagent)}` : ""}
          )
          ${!selectedagent ? "OR bs.total_remarks_l3 = 0" : ""}
          `
            : `
          SELECT bs.student_id
          FROM base_students bs
          WHERE bs.current_student_status = 'Fresh'
          `
        }
      ),
              
      latest_remarks AS (
        SELECT DISTINCT ON (sr.student_id)
          sr.student_id,
          sr.calling_status,
          sr.sub_calling_status,
          sr.created_at,
          sr.callback_date,
          sr.counsellor_id
        FROM student_remarks sr
        INNER JOIN base_students bs ON sr.student_id = bs.student_id
        ORDER BY sr.student_id, sr.created_at DESC
      ),
        
      today_callbacks AS (
        SELECT lr.student_id
        FROM latest_remarks lr
        INNER JOIN base_students bs ON lr.student_id = bs.student_id
        WHERE lr.student_id IS NOT NULL
          AND lr.callback_date >=current_date 
          AND lr.callback_date < current_date+1
          AND bs.current_student_status in (${role === "l2" ? `'Pre Application','Initial Counselling Completed'` : `'Admission','Application','Pre Application','Initial Counselling Completed','Enrolled'`})
        ${todaycallbacks}
      ),
      
      wishlist_students AS (
        SELECT DISTINCT bs.student_id
        FROM base_students bs
        INNER JOIN student_whishlist sw ON bs.student_id = sw.student_id
        WHERE 1=1 ${wishlistAgentFilter}
      ),
      intent_stats AS (
        SELECT 
          COUNT(CASE 
            WHEN :role = 'l2' AND bs.is_connected_yet = false THEN 1
            WHEN :role = 'l3' AND bs.is_connected_yet_l3 = false THEN 1
            ELSE NULL
          END) as not_connected,
          COUNT(CASE WHEN bs.is_reassigned_yet = true THEN 1 END) as reassigned_yet
        FROM base_students bs
      ),
      unread_messages AS (
        SELECT 
          COUNT(CASE WHEN bs.number_of_unread_messages > 0 THEN 1 END) as students_with_unread_messages,
          COALESCE(SUM(COALESCE(bs.number_of_unread_messages, 0)), 0) as total_unread_messages_sum
        FROM base_students bs
      ),
      reactivity_stats AS (
        SELECT COUNT(DISTINCT bs.student_id) as reactivity_count
        FROM base_students bs
        WHERE bs.is_reactivity = true
      )
      SELECT 
        (SELECT COUNT(*) FROM fresh_leads) as fresh_leads,
        (SELECT COUNT(*) FROM today_callbacks) as today_callbacks,
        (SELECT COUNT(*) FROM wishlist_students) as wishlist_count,
        COALESCE(ints.not_connected, 0) as not_connected_yet,
        COALESCE(um.students_with_unread_messages, 0) as all_unread_messages_count,
        COALESCE(rs.reactivity_count, 0) as reactivity_count
      FROM intent_stats ints
      CROSS JOIN unread_messages um
      CROSS JOIN reactivity_stats rs;
    `;

    const replacements = {
      role,
    };

    const results = await sequelize.query(query, {
      replacements,
      type: sequelize.QueryTypes.SELECT,
    });

    const result = results[0] || {};

    return {
      total: 0,
      freshLeads: callback ? 0 : parseInt(result.fresh_leads) || 0,
      todayCallbacks: parseInt(result.today_callbacks) || 0,
      wishlistCount: parseInt(result.wishlist_count) || 0,
      intentHot: parseInt(result.intent_hot) || 0,
      intentWarm: parseInt(result.intent_warm) || 0,
      intentCold: parseInt(result.intent_cold) || 0,
      notConnectedYet: parseInt(result.not_connected_yet) || 0,
      allUnreadMessagesCount: parseInt(result.all_unread_messages_count) || 0,
      reactivityCount: parseInt(result.reactivity_count) || 0,
    };
  } catch (error) {
    console.error("Failed to fetch optimized overall stats:", error);
    throw new Error(
      `Failed to fetch optimized overall stats: ${error.message}`,
    );
  }
};
