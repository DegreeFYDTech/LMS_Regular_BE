import EmailFunction from '../utils/email/Email.js';

const sendMail = async (data, to) => {
  try {
    const emailContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>College API Response Notification</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
    body {
      font-family: 'Poppins', Arial, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
    }
    .email-container {
      max-width: 600px;
      margin: 20px auto;
      background: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 30px;
      text-align: center;
      color: white;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .header p {
      margin: 10px 0 0;
      font-size: 16px;
      opacity: 0.9;
    }
    .content {
      padding: 30px;
    }
    .info-section {
      background-color: #f9f9f9;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
    }
    .info-row {
      display: flex;
      margin-bottom: 15px;
      border-bottom: 1px solid #eeeeee;
      padding-bottom: 15px;
    }
    .info-row:last-child {
      margin-bottom: 0;
      border-bottom: none;
      padding-bottom: 0;
    }
    .info-label {
      width: 40%;
      font-weight: 600;
      color: #555555;
      font-size: 14px;
    }
    .info-value {
      width: 60%;
      color: #333333;
      font-size: 14px;
      word-break: break-word;
    }
    .response-section {
      background-color: #f0f4f8;
      border-radius: 8px;
      padding: 20px;
      margin-top: 20px;
    }
    .section-title {
      font-size: 16px;
      font-weight: 600;
      color: #667eea;
      margin-top: 0;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 2px solid rgba(102, 126, 234, 0.2);
    }
    .response-data {
      background-color: #ffffff;
      border-radius: 6px;
      padding: 15px;
      font-family: 'Courier New', monospace;
      font-size: 13px;
      color: #333333;
      max-height: 300px;
      overflow-y: auto;
      white-space: pre-wrap;
      word-wrap: break-word;
      border: 1px solid #e0e0e0;
    }
    .footer {
      background-color: #f5f5f5;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #777777;
      border-top: 1px solid #e0e0e0;
    }
    .footer p {
      margin: 5px 0;
    }
    .badge {
      display: inline-block;
      background-color: #ff6b6b;
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
      margin-left: 10px;
    }
    @media only screen and (max-width: 600px) {
      .email-container {
        margin: 0;
        border-radius: 0;
      }
      .header {
        padding: 20px;
      }
      .content {
        padding: 20px;
      }
      .info-row {
        flex-direction: column;
      }
      .info-label,
      .info-value {
        width: 100%;
      }
      .info-value {
        margin-top: 5px;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>College API Response</h1>
      <p>API Response Data Notification</p>
    </div>

    <div class="content">
      <div class="info-section">
        <h3 class="section-title">Student Information</h3>
        
        <div class="info-row">
          <div class="info-label">Timestamp</div>
          <div class="info-value">${data?.timestamp || 'N/A'}</div>
        </div>
        
        <div class="info-row">
          <div class="info-label">Student ID</div>
          <div class="info-value">${data?.name?.replace('Student ID: ', '') || 'N/A'}</div>
        </div>
        
        <div class="info-row">
          <div class="info-label">Phone Number</div>
          <div class="info-value">${data?.phone || 'N/A'}</div>
        </div>
        
        <div class="info-row">
          <div class="info-label">College/Stream</div>
          <div class="info-value">${data?.stream || 'N/A'}</div>
        </div>
      </div>

      <div class="response-section">
        <h3 class="section-title">API Response Data</h3>
        <div class="response-data">
          ${data?.responseData ? JSON.stringify(JSON.parse(data.responseData), null, 2) : 'No response data available'}
        </div>
      </div>

      <div style="text-align: center; margin-top: 20px; padding: 15px; background-color: #fff3cd; border-radius: 6px; border-left: 4px solid #ffc107;">
        <p style="margin: 0; color: #856404; font-size: 14px;">
          <strong>⚠️ Action Required:</strong> Please review the API response data above.
        </p>
      </div>
    </div>

    <div class="footer">
      <p>This is an automated notification from the College API System</p>
      <p>© ${new Date().getFullYear()} Degreefyd. All rights reserved.</p>
      <p style="font-size: 11px; color: #999999;">For any queries, please contact the technical team</p>
    </div>
  </div>
</body>
</html>`;

    const emailFunction = await EmailFunction(
      emailContent,
      'College API Response Notification'
    );
    return emailFunction;
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Error generating email');
  }
};

export default sendMail;