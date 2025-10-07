// backend/utils/otp-sender.js
const nodemailer = require('nodemailer');

async function createTransporter() {
  // If you want a quick dev-only test, create Ethereal account:
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    // create test account
    const testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }

  // production / configurable SMTP
  return nodemailer.createTransport({
    host: process.env.EMAIL_SMTP_HOST,
    port: parseInt(process.env.EMAIL_SMTP_PORT || '587', 10),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

async function sendOtpEmail(targetEmail, otpCode, purpose = 'registration') {
  const transporter = await createTransporter();
  const subject = purpose === 'reset' ? 'Your password reset OTP' : 'Your registration OTP';
  const html = `
    <p>Your OTP code is: <strong>${otpCode}</strong></p>
    <p>It will expire in ${process.env.OTP_EXPIRY_MINUTES || 5} minutes.</p>
  `;

  const info = await transporter.sendMail({
    from: process.env.EMAIL_USER || '"Dev Test" <no-reply@example.com>',
    to: targetEmail,
    subject,
    html,
  });

  // If using Ethereal, output preview URL in logs
  if (nodemailer.getTestMessageUrl(info)) {
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  }
  return info;
}

// Example SMS sender (Twilio) — needs config:
async function sendSmsOtp(mobile, otpCode) {
  if (!process.env.TWILIO_ACCOUNT_SID) {
    console.log('sendSmsOtp: TWILIO not configured; OTP was', otpCode, 'for', mobile);
    return;
  }
  const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  return twilio.messages.create({
    body: `Your OTP code is ${otpCode}. Expires in ${process.env.OTP_EXPIRY_MINUTES || 5} minutes.`,
    from: process.env.TWILIO_FROM,
    to: mobile,
  });
}

module.exports = { sendOtpEmail, sendSmsOtp };



