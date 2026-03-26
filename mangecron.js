import sequelize from './config/database-config.js';

async function syncStatuses() {
  try {
    console.log("Connecting to database to sync student statuses...");
    await sequelize.authenticate();
    
    // First, reset all students to 'Fresh' and clear NI sub status
    console.log("Resetting all students to 'Fresh' status and clearing NI sub status...");
    const resetQuery = `
      UPDATE students
      SET 
        current_student_status = 'Fresh',
        current_student_ni_sub_status = NULL;
    `;
    
    const [resetResults, resetMetadata] = await sequelize.query(resetQuery);
    console.log(`Reset ${resetMetadata.rowCount} students to 'Fresh' status and cleared NI sub status`);
    
    // Then update based on latest remarks
    console.log("Updating students based on latest remarks...");
    const updateQuery = `
      WITH LatestRemarks AS (
        SELECT DISTINCT ON (student_id)
          student_id,
          lead_status,
          lead_sub_status,
          created_at
        FROM student_remarks
        ORDER BY student_id, created_at DESC
      )
      UPDATE students s
      SET 
        current_student_status = 
          CASE 
            WHEN lr.lead_status = 'Pre Application' 
             AND lr.lead_sub_status = 'Initial Counseling Completed' 
            THEN 'Initial Counselling Completed'
            ELSE lr.lead_status
          END,
        current_student_ni_sub_status = 
          CASE 
            WHEN lr.lead_status = 'NotInterested' 
            THEN lr.lead_sub_status
            ELSE NULL
          END
      FROM LatestRemarks lr
      WHERE s.student_id = lr.student_id;
    `;

    console.log("Executing status update query...");
    const [results, metadata] = await sequelize.query(updateQuery);
    console.log("Successfully updated students with their latest remark status!");
    console.log("Rows affected:", metadata.rowCount);
    
    // Optional: Show count of students with special case
    const specialCaseQuery = `
      SELECT 
        COUNT(*) as total_students,
        COUNT(CASE WHEN current_student_status = 'Initial Counselling Completed' THEN 1 END) as icc_count,
        COUNT(CASE WHEN current_student_ni_sub_status IS NOT NULL THEN 1 END) as ni_count
      FROM students s;
    `;
    
    const [specialCaseResults] = await sequelize.query(specialCaseQuery);
    console.log(`\n--- Summary ---`);
    console.log(`Total students updated: ${specialCaseResults[0].total_students}`);
    console.log(`Students with 'Initial Counselling Completed' status: ${specialCaseResults[0].icc_count}`);
    console.log(`Students with 'Not Interested' sub status: ${specialCaseResults[0].ni_count}`);
    
    // Optional: Show sample of Not Interested students
    const niSampleQuery = `
      SELECT 
        student_id,
        current_student_status,
        current_student_ni_sub_status
      FROM students
      WHERE current_student_ni_sub_status IS NOT NULL
      LIMIT 5;
    `;
    
    const [niSampleResults] = await sequelize.query(niSampleQuery);
    if (niSampleResults.length > 0) {
      console.log(`\n--- Sample of 'Not Interested' students ---`);
      niSampleResults.forEach(student => {
        console.log(`Student ID: ${student.student_id}, Status: ${student.current_student_status}, NI Sub Status: ${student.current_student_ni_sub_status}`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error("Error syncing statuses:", error);
    process.exit(1);
  }
}

syncStatuses();






// import sequelize from './config/database-config.js';

// async function updateFirstICCDate() {
//   try {
//     console.log("Connecting to database to update first ICC dates...");
//     await sequelize.authenticate();
    
//     // First, reset all students' first_icc_date to NULL
//     console.log("Resetting all students' first_icc_date to NULL...");
//     const resetQuery = `
//       UPDATE students
//       SET first_icc_date = NULL;
//     `;
    
//     const [resetResults, resetMetadata] = await sequelize.query(resetQuery);
//     console.log(`Reset ${resetMetadata.rowCount} students' first_icc_date to NULL`);
    
//     // Then find the first ICC remark for each student and update
//     console.log("Finding first 'Initial Counseling Completed' remarks for each student...");
//     const updateQuery = `
//       WITH FirstICCRemarks AS (
//         SELECT DISTINCT ON (student_id)
//           student_id,
//           created_at
//         FROM student_remarks
//         WHERE lead_sub_status = 'Initial Counseling Completed'
//         ORDER BY student_id, created_at ASC
//       )
//       UPDATE students s
//       SET 
//         first_icc_date = fic.created_at
//       FROM FirstICCRemarks fic
//       WHERE s.student_id = fic.student_id;
//     `;

//     console.log("Executing first ICC date update query...");
//     const [results, metadata] = await sequelize.query(updateQuery);
//     console.log("Successfully updated students with their first ICC date!");
//     console.log("Rows updated:", metadata.rowCount);
    
//     // Optional: Show summary of updates
//     const summaryQuery = `
//       SELECT 
//         COUNT(*) as total_students,
//         COUNT(first_icc_date) as students_with_icc_date,
//         COUNT(CASE WHEN first_icc_date IS NULL THEN 1 END) as students_without_icc_date
//       FROM students;
//     `;
    
//     const [summaryResults] = await sequelize.query(summaryQuery);
//     console.log("\n--- Summary ---");
//     console.log(`Total students: ${summaryResults[0].total_students}`);
//     console.log(`Students with first ICC date: ${summaryResults[0].students_with_icc_date}`);
//     console.log(`Students without ICC date: ${summaryResults[0].students_without_icc_date}`);
    
//     // Optional: Show sample of students with their first ICC dates
//     const sampleQuery = `
//       SELECT 
//         student_id,
//         first_icc_date
//       FROM students
//       WHERE first_icc_date IS NOT NULL
//       ORDER BY first_icc_date DESC
//       LIMIT 5;
//     `;
    
//     const [sampleResults] = await sequelize.query(sampleQuery);
//     if (sampleResults.length > 0) {
//       console.log("\n--- Sample of recently updated students ---");
//       sampleResults.forEach(student => {
//         console.log(`Student ID: ${student.student_id}, First ICC Date: ${student.first_icc_date}`);
//       });
//     }
    
//     process.exit(0);
//   } catch (error) {
//     console.error("Error updating first ICC dates:", error);
//     process.exit(1);
//   }
// }

// updateFirstICCDate();