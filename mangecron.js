// import sequelize from './config/database-config.js';

// async function syncStatuses() {
//   try {
//     await sequelize.authenticate();
    
//     // First, reset all students to 'Fresh' and clear NI sub status
//     const resetQuery = `
//       UPDATE students
//       SET 
//         current_student_status = 'Fresh',
//         current_student_ni_sub_status = NULL;
//     `;
    
//     const [resetResults, resetMetadata] = await sequelize.query(resetQuery);
    
//     // Then update based on latest remarks
//     const updateQuery = `
//       WITH LatestRemarks AS (
//         SELECT DISTINCT ON (student_id)
//           student_id,
//           lead_status,
//           lead_sub_status,
//           created_at
//         FROM student_remarks
//         ORDER BY student_id, created_at DESC
//       )
//       UPDATE students s
//       SET 
//         current_student_status = 
//           CASE 
//             WHEN lr.lead_status = 'Pre Application' 
//              AND lr.lead_sub_status = 'Initial Counseling Completed' 
//             THEN 'Initial Counselling Completed'
//             ELSE lr.lead_status
//           END,
//         current_student_ni_sub_status = 
//           CASE 
//             WHEN lr.lead_status = 'NotInterested' 
//             THEN lr.lead_sub_status
//             ELSE NULL
//           END
//       FROM LatestRemarks lr
//       WHERE s.student_id = lr.student_id;
//     `;

//     const [results, metadata] = await sequelize.query(updateQuery);
    
//     // Optional: Show count of students with special case
//     const specialCaseQuery = `
//       SELECT 
//         COUNT(*) as total_students,
//         COUNT(CASE WHEN current_student_status = 'Initial Counselling Completed' THEN 1 END) as icc_count,
//         COUNT(CASE WHEN current_student_ni_sub_status IS NOT NULL THEN 1 END) as ni_count
//       FROM students s;
//     `;
    
//     const [specialCaseResults] = await sequelize.query(specialCaseQuery);
    
//     // Optional: Show sample of Not Interested students
//     const niSampleQuery = `
//       SELECT 
//         student_id,
//         current_student_status,
//         current_student_ni_sub_status
//       FROM students
//       WHERE current_student_ni_sub_status IS NOT NULL
//       LIMIT 5;
//     `;
    
//     const [niSampleResults] = await sequelize.query(niSampleQuery);
//     if (niSampleResults.length > 0) {
//       niSampleResults.forEach(student => {
//       });
//     }
    
//     process.exit(0);
//   } catch (error) {
//     process.exit(1);
//   }
// }

// syncStatuses();






import sequelize from './config/database-config.js';

async function updateFirstICCDate() {
  try {
    await sequelize.authenticate();
    
    // First, reset all students' first_icc_date to NULL
    const resetQuery = `
      UPDATE students
      SET first_icc_date = NULL;
    `;
    
    const [resetResults, resetMetadata] = await sequelize.query(resetQuery);
    
    // Then find the first ICC remark for each student and update
    const updateQuery = `
      WITH FirstICCRemarks AS (
        SELECT DISTINCT ON (student_id)
          student_id,
          created_at
        FROM student_remarks
        WHERE lead_sub_status = 'Initial Counseling Completed'
        ORDER BY student_id, created_at ASC
      )
      UPDATE students s
      SET 
        first_icc_date = fic.created_at
      FROM FirstICCRemarks fic
      WHERE s.student_id = fic.student_id;
    `;

    const [results, metadata] = await sequelize.query(updateQuery);
    
    // Optional: Show summary of updates
    const summaryQuery = `
      SELECT 
        COUNT(*) as total_students,
        COUNT(first_icc_date) as students_with_icc_date,
        COUNT(CASE WHEN first_icc_date IS NULL THEN 1 END) as students_without_icc_date
      FROM students;
    `;
    
    const [summaryResults] = await sequelize.query(summaryQuery);
    
    // Optional: Show sample of students with their first ICC dates
    const sampleQuery = `
      SELECT 
        student_id,
        first_icc_date
      FROM students
      WHERE first_icc_date IS NOT NULL
      ORDER BY first_icc_date DESC
      LIMIT 5;
    `;
    
    const [sampleResults] = await sequelize.query(sampleQuery);
    if (sampleResults.length > 0) {
      sampleResults.forEach(student => {
      });
    }
    
    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
}

updateFirstICCDate();