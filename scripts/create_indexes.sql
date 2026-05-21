-- ============================================================
-- LMS Performance Indexes (Updated for Regular Backend)
-- Run this ONCE on your PostgreSQL database (safe on live DB)
-- CONCURRENTLY = no table lock, runs in background
-- IF NOT EXISTS = will skip indexes you already created
-- ============================================================

-- 1. student_remarks
-- Used by: latest_remark CTE
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_remarks_student_created_desc
  ON student_remarks (student_id, created_at DESC);

-- Used heavily by L3 filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_remarks_counsellor_id
  ON student_remarks (counsellor_id) WHERE counsellor_id IS NOT NULL;

-- 2. student_lead_activities
-- Used by: first_lead_activity CTE
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_activities_student_created_asc
  ON student_lead_activities (student_id, created_at ASC);

-- 3. course_status_journeys
-- Used by: latest_journey_entries CTE
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_course_status_student_created_desc
  ON course_status_journeys (student_id, created_at DESC);

-- Used by: first_journey_entries CTE
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_course_status_student_created_asc
  ON course_status_journeys (student_id, created_at ASC);

-- Used by: L3 Journey filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_course_status_assigned_l3
  ON course_status_journeys (assigned_l3_counsellor_id) WHERE assigned_l3_counsellor_id IS NOT NULL;

-- 4. students: counsellor assignment filters (partial indexes — very fast)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_students_counsellor_l2
  ON students (assigned_counsellor_id) WHERE assigned_counsellor_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_students_counsellor_l3
  ON students (assigned_counsellor_l3_id) WHERE assigned_counsellor_l3_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_students_enrollment_counsellor
  ON students (enrollment_counsellor_id) WHERE enrollment_counsellor_id IS NOT NULL;

-- 5. student_question_responses: for advancedFilters EXISTS subqueries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sqr_student_question
  ON student_question_responses (student_id, question);

-- 6. student_remarks: for lead_status / calling_status filters in download CTEs
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_remarks_lead_status
  ON student_remarks (lead_status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_remarks_calling_status
  ON student_remarks (calling_status);

-- 7. counsellors: for role-based team lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_counsellors_assigned_to
  ON counsellors (assigned_to) WHERE assigned_to IS NOT NULL;
