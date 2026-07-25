import EmailFunction from './Email.js';
import Handlebars from 'handlebars';

async function GenerateEmailFunction(data, to) {
  try {
    const templateSource = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>New Form Filled Case</title>
  <style>
    body {
      font-family: 'Segoe UI', sans-serif;
      background-color: #f4f8fb;
      margin: 0;
      padding: 20px;
    }

    .container {
      background-color: #ffffff;
      border-radius: 10px;
      padding: 30px;
      max-width: 700px;
      margin: auto;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }

    h2 {
      color: #2d6cdf;
      margin-bottom: 10px;
    }

    p {
      font-size: 15px;
      color: #333;
      line-height: 1.6;
    }

    .info-block {
      background-color: #f0f4ff;
      border-left: 4px solid #2d6cdf;
      padding: 15px 20px;
      margin: 20px 0;
      border-radius: 6px;
    }

    .info-block p {
      margin: 8px 0;
    }

    .footer {
      margin-top: 30px;
      font-size: 12px;
      color: #888;
      text-align: center;
    }

    strong {
      color: #000;
    }

    .emoji {
      font-size: 18px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h2>🚨 New Form Filled Case Just Landed!</h2>

    <p>Hi <strong>{{agent_name}}</strong>,</p>

    <p>You've just been assigned a new <strong>Form Filled Case</strong>. Here are the details you need to get started:</p>

    <div class="info-block">
      <p><span class="emoji">🎓</span> <strong>Student ID:</strong> {{id}}</p>
      <p><span class="emoji">🧑‍🎓</span> <strong>Student Name:</strong> {{name}}</p>
      <p><span class="emoji">📩</span> <strong>Student Email:</strong> {{email}}</p>
      <p><span class="emoji">📞</span> <strong>Student Mobile Number:</strong> {{phone}}</p>
      <p><span class="emoji">🏛</span> <strong>Shortlisted College:</strong> {{asigned_college}}</p>
      <p><span class="emoji">📘</span> <strong>Shortlisted Course:</strong> {{asigned_course}}</p>
    </div>

    <p>This could be the next successful enrollment story — and <strong>you’re the star of the show!</strong></p>

    <p>All the best — go get that conversion! 🌟</p>

    <p class="footer">Cheers,<br><strong>Tech Team – DegreeFyd</strong></p>
  </div>
</body>
</html>`;

    const template = Handlebars.compile(templateSource);
    const renderedHtml = template(data);

    const emailFunction = await EmailFunction(
      renderedHtml,
      `New Form Filled Case, ${data.name} Just Landed – Time to Shine, ${data.agent_name}!`,
      to,
      process.env.l3_email,
      process.env.l3_passkey
    );

    return emailFunction;

  } catch (error) {
  }
}

export default GenerateEmailFunction;
