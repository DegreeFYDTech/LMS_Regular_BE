
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_remarks_student_created_desc
  ON student_remarks (student_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_remarks_counsellor_id
  ON student_remarks (counsellor_id) WHERE counsellor_id IS NOT NULL;


CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_activities_student_created_asc
  ON student_lead_activities (student_id, created_at ASC);


CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_course_status_student_created_desc
  ON course_status_journeys (student_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_course_status_student_created_asc
  ON course_status_journeys (student_id, created_at ASC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_course_status_assigned_l3
  ON course_status_journeys (assigned_l3_counsellor_id) WHERE assigned_l3_counsellor_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_students_counsellor_l2
  ON students (assigned_counsellor_id) WHERE assigned_counsellor_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_students_counsellor_l3
  ON students (assigned_counsellor_l3_id) WHERE assigned_counsellor_l3_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_students_enrollment_counsellor
  ON students (enrollment_counsellor_id) WHERE enrollment_counsellor_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sqr_student_question
  ON student_question_responses (student_id, question);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_remarks_lead_status
  ON student_remarks (lead_status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_remarks_calling_status
  ON student_remarks (calling_status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_counsellors_assigned_to
  ON counsellors (assigned_to) WHERE assigned_to IS NOT NULL;
