import nodemailer from "nodemailer";

export default async function sendMail(htmlContent, subject, to) {
  try {
    let transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.email,
        pass: process.env.passkey,
      },
    });

    let mailOptions = {
      from: process.env.email,
      to: to,
      subject: subject,
      html: htmlContent,
    };

    await transporter.sendMail(mailOptions);
    console.log("email is sent success ");
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
}
