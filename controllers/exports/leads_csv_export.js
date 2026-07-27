import { mapFiltersForGetStudentsHelper } from '../students.table.js';
import { getStudentsRawSQL } from '../rawQuery.test.js';
import { format } from 'date-fns';
import Analyser from '../../models/Analyser.js';
import sequelize from '../../config/database-config.js';
import { QueryTypes } from 'sequelize';

// Canonical export column set/order — the single source of truth for the leads export.
const VALID_FIELDS = [
  'student_id', 'student_name', 'counsellor_name_l2',
  'lead_status', 'lead_sub_status', 'calling_status',
  'source', 'source_url', 'utm_campaign',
  'total_remarks', 'l3_remark_count',
  'l2_next_callback', 'l2_last_callback', 'l3_next_callback', 'l3_last_callback',
  'created_at', 'first_form_filled_date',
  'l3_course_status', 'university_name', 'l3_counsellor_name',
];

// Fields resolved per (student_id, course_id) rather than per student — selecting
// any of these fans a student with multiple courses out into one CSV row per course.
const PER_COURSE_FIELDS = ['l3_course_status', 'university_name', 'l3_counsellor_name'];

const FIELD_LABELS = {
  student_id: 'Student ID', student_name: 'Student Name',
  counsellor_name_l2: 'Counsellor Name',
  lead_status: 'Current Student Status', lead_sub_status: 'Current Lead NI Sub Status',
  calling_status: 'Calling Status', source: 'Source', source_url: 'Source URL',
  utm_campaign: 'Campaign Name',
  total_remarks: 'L2 Total Remarks', l3_remark_count: 'L3 Total Remarks',
  l2_next_callback: 'L2 Next Callback', l2_last_callback: 'L2 Last Callback',
  l3_next_callback: 'L3 Next Callback', l3_last_callback: 'L3 Last Callback',
  created_at: 'Lead Created At', first_form_filled_date: 'Form Filled Date',
  l3_course_status: 'Course Status', university_name: 'University Name',
  l3_counsellor_name: 'L3 Counsellor Name',
};

const fmtDate    = (d) => { try { return d ? format(new Date(d), 'dd-MMM-yyyy HH:mm:ss') : ''; } catch { return d?.toString() ?? ''; } };
const fmtDateRaw = (d) => { try { return d ? format(new Date(d), 'dd-MMM-yyyy')           : ''; } catch { return d?.toString() ?? ''; } };
const maskName   = (n) => { if (!n || typeof n !== 'string') return '***'; const t = n.trim(); return t.length <= 2 ? '***' : t[0] + '***'; };

const csvCell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
const csvRow  = (fields, obj) => fields.map(f => csvCell(obj[f])).join(',') + '\r\n';

function mapStudent(s, isAnalyser) {
  const counsellorNameL2 = s?.assignedCounsellor?.counsellor_name || '';
  const latestRemark     = s?.student_remarks?.[0] || {};
  const leadActivities   = s?.lead_activities?.[0]  || {};

  // For L3 view, prefer Application-stage fields stored on the student record
  const isL3View = !!(s?.next_call_date_l3 || s?.last_call_date_l3 || s?.total_remarks_l3);
  const callingStatus = (isL3View ? s?.calling_status_l3 : null) || latestRemark?.calling_status || '';

  return {
    student_id:             s?.student_id || '',
    student_name:           isAnalyser ? maskName(s?.student_name) : (s?.student_name || ''),
    counsellor_name_l2:     counsellorNameL2,
    lead_status:            s?.current_student_status || s?.lead_status || '',
    lead_sub_status:        s?.current_student_ni_sub_status || '',
    calling_status:         callingStatus,
    source:                 s?.source || leadActivities?.source || '',
    source_url:             leadActivities?.source_url || '',
    utm_campaign:           leadActivities?.utm_campaign || '',
    total_remarks:          s?.remark_count ?? '',
    l3_remark_count:        s?.total_remarks_l3 ?? '',
    // L2 and L3 callbacks are always sourced from their own dedicated stage —
    // never mixed, unlike the combined next_call_date/last_call_date used elsewhere.
    l2_next_callback:       fmtDateRaw(latestRemark?.callback_date),
    l2_last_callback:       fmtDate(latestRemark?.created_at),
    l3_next_callback:       fmtDateRaw(s?.next_call_date_l3),
    l3_last_callback:       fmtDate(s?.last_call_date_l3),
    created_at:             fmtDate(s?.created_at),
    // rawQuery.test.js renames this to first_form_filled_date on the way out
    // (item.calculated_form_filled_date || item.first_form_filled_date) — the
    // row here never has a calculated_form_filled_date key, only the renamed one.
    first_form_filled_date: fmtDate(s?.first_form_filled_date),
  };
}

export const exportStudentsCSV = async (req, res) => {
  const userRole   = req.user?.role;
  const userId     = req.user?.id;
  const isAnalyser = userRole === 'Analyser';

  // ── Resolve export fields synchronously — no DB needed ──
  const requested    = req.query.selectedFields
    ? req.query.selectedFields.split(',').map(f => f.trim()).filter(Boolean)
    : null;
  let exportFields = requested?.length ? VALID_FIELDS.filter(f => requested.includes(f)) : VALID_FIELDS;

  // Requesting L3 Course Status always brings University Name along with it.
  if (exportFields.includes('l3_course_status') && !exportFields.includes('university_name')) {
    exportFields = [...exportFields, 'university_name'];
  }
  const needsCourseBreakdown = exportFields.some(f => PER_COURSE_FIELDS.includes(f));

  const labels = { ...FIELD_LABELS };
  if (isAnalyser) labels.student_name = 'Student Name (Masked)';

  const currentDate = format(new Date(), 'yyyy-MM-dd');
  const filename    = isAnalyser
    ? `students_export_analyser_${currentDate}.csv`
    : `students_export_${currentDate}.csv`;

  // ── Start streaming IMMEDIATELY — first bytes prevent gateway timeout ──
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
  res.setHeader('Transfer-Encoding', 'chunked');

  // Header row written before any DB call — gateway sees response started
  res.write(exportFields.map(f => csvCell(labels[f] || f)).join(',') + '\r\n');

  try {
    // ── Fetch analyser restrictions (fast, single row) ──
    let analyserData = {};
    if (isAnalyser && userId) {
      try {
        const analyser = await Analyser.findByPk(userId, {
          attributes: ['sources', 'campaigns', 'student_creation_date', 'source_urls'],
        });
        if (analyser) {
          analyserData = {
            analyserSources:    analyser.sources || [],
            analyserCampaigns:  analyser.campaigns || [],
            analyserDateFilter: analyser.student_creation_date || '',
            analyserSourceUrls: analyser.source_urls || [],
          };
        }
      } catch (err) {
        console.error('Error fetching analyser data:', err);
      }
    }

    // ── Run the slow query ──
    const filters = mapFiltersForGetStudentsHelper(req.query, userRole, analyserData);
    const result  = await getStudentsRawSQL(filters, req, true);

    // ── L3 Course Status / University Name live per (student_id, course_id) ──
    // fetch the latest journey entry for every course a student has, so a student
    // with multiple courses gets one CSV row per course instead of one overall row.
    let courseRowsByStudent = new Map();
    if (needsCourseBreakdown) {
      const studentIds = result.data.map(s => s?.student_id).filter(Boolean);
      if (studentIds.length) {
        const courseRows = await sequelize.query(`
          SELECT DISTINCT ON (csj.student_id, csj.course_id)
            csj.student_id, csj.course_id, csj.course_status, uc.university_name,
            c.counsellor_name AS l3_counsellor_name
          FROM course_status_journeys csj
          LEFT JOIN university_courses uc ON uc.course_id = csj.course_id
          LEFT JOIN counsellors c ON c.counsellor_id = csj.assigned_l3_counsellor_id
          WHERE csj.student_id IN (:studentIds)
          ORDER BY csj.student_id, csj.course_id, csj.created_at DESC
        `, { replacements: { studentIds }, type: QueryTypes.SELECT });

        for (const row of courseRows) {
          if (!courseRowsByStudent.has(row.student_id)) courseRowsByStudent.set(row.student_id, []);
          courseRowsByStudent.get(row.student_id).push(row);
        }
      }
    }

    // ── Stream rows — one per student, or one per (student, course) when course fields are selected ──
    for (const s of result.data) {
      const base = mapStudent(s, isAnalyser);

      if (!needsCourseBreakdown) {
        res.write(csvRow(exportFields, base));
        continue;
      }

      const courses = courseRowsByStudent.get(s?.student_id) || [];
      if (courses.length === 0) {
        res.write(csvRow(exportFields, { ...base, l3_course_status: '', university_name: '', l3_counsellor_name: '' }));
      } else {
        for (const c of courses) {
          res.write(csvRow(exportFields, {
            ...base,
            l3_course_status:   c.course_status || '',
            university_name:    c.university_name || '',
            l3_counsellor_name: c.l3_counsellor_name || '',
          }));
        }
      }
    }

    res.end();
  } catch (error) {
    console.error('Error in exportStudentsCSV:', error);
    // Headers already sent — can't change status code, just end cleanly
    res.end();
  }
};
