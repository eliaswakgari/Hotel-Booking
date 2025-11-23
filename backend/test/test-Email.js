// test-email.js
require('dotenv').config();
const sendEmail = require('./utils/sendEmail');

const testEmail = async () => {
  try {
    console.log('Testing email configuration...');
    await sendEmail({
      to: 'wakgarielias4@gmail.com',
      subject: 'Test Email from Hotel Booking',
      text: 'This is a test email to verify your configuration.',
      html: '<h1>Test Email</h1><p>This is a test email to verify your configuration.</p>'
    });
    console.log('✅ Test email sent successfully!');
  } catch (error) {
    console.error('❌ Test email failed:', error.message);
  }
};

testEmail();