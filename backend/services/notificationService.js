const nodemailer = require("nodemailer");
const twilio = require("twilio");

// Twilio setup
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Nodemailer setup for Gmail
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SENDER_EMAIL,       // your Gmail address
    pass: process.env.GMAIL_APP_PASSWORD, // Gmail App Password
  },
});

// ✅ Send Refund Email
exports.sendRefundEmail = async (userEmail, bookingId, amount, type) => {
  try {
    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: userEmail,
      subject: `Your ${type} refund is processed`,
      html: `
        <p>Hi,</p>
        <p>Your ${type} refund for booking <strong>${bookingId}</strong> has been processed successfully.</p>
        <p>Refunded Amount: $${amount}</p>
        <p>Thank you for using our service!</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Refund email sent to ${userEmail}`);
  } catch (error) {
    console.error("❌ Error sending refund email:", error.message);
  }
};

// ✅ Send Refund SMS via Twilio
exports.sendRefundSMS = async (phoneNumber, bookingId, amount, type) => {
  try {
    await twilioClient.messages.create({
      body: `Your ${type} refund for booking ${bookingId} of $${amount} has been processed successfully.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    });
    console.log(`✅ Refund SMS sent to ${phoneNumber}`);
  } catch (error) {
    console.error("❌ Error sending refund SMS:", error.message);
  }
};
