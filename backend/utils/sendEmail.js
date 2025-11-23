const nodemailer = require("nodemailer");

const sendEmail = async ({ to, subject, text, html }) => {
  try {
    console.log("Attempting to send email to:", to);
    console.log("Using email host:", process.env.EMAIL_HOST);
    
    // 1. Create transporter with better configuration for Gmail
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_PORT || 587,
      secure: process.env.EMAIL_SECURE === "true",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // This should be your App Password
      },
      // Additional settings for better reliability
      tls: {
        rejectUnauthorized: false
      }
    });

    // Verify transporter configuration
    await transporter.verify();
    console.log("Email transporter verified successfully");

    // 2. Send mail
    const mailOptions = {
      from: `"Hotel Booking" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully to ${to}`);
    console.log(`Message ID: ${result.messageId}`);
    
    return result;
  } catch (err) {
    console.error("❌ Email sending failed:", err.message);
    console.error("Full error:", err);
    throw new Error(`Email could not be sent: ${err.message}`);
  }
};

module.exports = sendEmail;