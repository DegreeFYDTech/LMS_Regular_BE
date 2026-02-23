import EmailFunction from './Email.js'

export default async function GenerateEmailFunction(data, subject, reason) {
    try {
        const emailContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; color: #333;">
  <div style="max-width: 600px; margin: 20px auto; background: #fff; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.08); overflow: hidden;">
    <div style="background: linear-gradient(135deg, #4b0082, #9370db); padding: 25px 0; text-align: center;">
      <img style="width: 120px; height: auto;" src="https://res.cloudinary.com/dkdkkikss/image/upload/v1741255793/logo_nx7e0u.png" alt="LPU Logo">
    </div>
    <div style="padding: 30px; text-align: center;">
      <h1 style="color: #4b0082; font-size: 24px; font-weight: 600;">${subject}!</h1>
      <div style="background-color: #f9f9f9; border-radius: 10px; padding: 20px; margin: 20px 0; box-shadow: 0 4px 10px rgba(0,0,0,0.05); text-align: left;">
        <!-- Using tables for better email compatibility -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="left" style="color: #777; font-size: 14px; font-weight: 500;">Application Id</td>
                  <td align="right" style="color: #333; font-size: 14px; font-weight: 600;">${data.student_id || data.id}</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="left" style="color: #777; font-size: 14px; font-weight: 500;">Name</td>
                  <td align="right" style="color: #333; font-size: 14px; font-weight: 600;">${data.student_name || data.name}</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="left" style="color: #777; font-size: 14px; font-weight: 500;">Email</td>
                  <td align="right" style="color: #333; font-size: 14px; font-weight: 600;">${data.student_email || data.email}</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="left" style="color: #777; font-size: 14px; font-weight: 500;">Mobile</td>
                  <td align="right" style="color: #333; font-size: 14px; font-weight: 600;">${data.student_phone || data.mobile}</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="left" style="color: #777; font-size: 14px; font-weight: 500;">Location</td>
                  <td align="right" style="color: #333; font-size: 14px; font-weight: 600;">${data?.student_current_state || data?.state || "NA"}</td>
                </tr>
              </table>
            </td>
          </tr>
            <tr>
             <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0;">
               <table width="100%" cellpadding="0" cellspacing="0" border="0">
                 <tr>
                   <td align="left" style="color: #777; font-size: 14px; font-weight: 500;">Applied For</td>
                   <td align="right" style="color: #333; font-size: 14px; font-weight: 600;">${data?.college_For_Applied || data?.collegeForApplied || (data?.preferred_university ? data.preferred_university[0] : "NA")}</td>
                 </tr>
               </table>
             </td>
           </tr>
           ${reason ? `
           <tr>
             <td style="padding: 8px 0;">
               <table width="100%" cellpadding="0" cellspacing="0" border="0">
                 <tr>
                   <td align="left" style="color: #d9534f; font-size: 14px; font-weight: 500;">Failure Reason</td>
                   <td align="right" style="color: #d9534f; font-size: 14px; font-weight: 600;">${reason}</td>
                 </tr>
               </table>
             </td>
           </tr>` : ''}
         </table>
      </div>
     
    </div>
  </div>
</body>
</html>
`
        const emailFunction = await EmailFunction(emailContent, subject)
        return emailFunction
    }
    catch (error) {
        console.error(error)
        throw new Error('Error generating email')
    }
}
