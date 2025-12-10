// // backend/utils/otp-sender.js
// const nodemailer = require('nodemailer');

// async function createTransporter() {
//   // If you want a quick dev-only test, create Ethereal account:
//   if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
//     // create test account
//     const testAccount = await nodemailer.createTestAccount();
//     return nodemailer.createTransport({
//       host: testAccount.smtp.host,
//       port: testAccount.smtp.port,
//       secure: testAccount.smtp.secure,
//       auth: {
//         user: testAccount.user,
//         pass: testAccount.pass,
//       },
//     });
//   }

//   // production / configurable SMTP
//   return nodemailer.createTransport({
//     host: process.env.EMAIL_SMTP_HOST,
//     port: parseInt(process.env.EMAIL_SMTP_PORT || '587', 10),
//     secure: false,
//     auth: {
//       user: process.env.EMAIL_USER,
//       pass: process.env.EMAIL_PASS,
//     },
//   });
// }

// async function sendOtpEmail(targetEmail, otpCode, purpose = 'registration') {
//   const transporter = await createTransporter();
//   const subject = purpose === 'reset' ? 'Your password reset OTP' : 'Your registration OTP';
//   const html = `
//     <p>Your OTP code is: <strong>${otpCode}</strong></p>
//     <p>It will expire in ${process.env.OTP_EXPIRY_MINUTES || 5} minutes.</p>
//   `;

//   const info = await transporter.sendMail({
//     from: process.env.EMAIL_USER || '"Dev Test" <no-reply@example.com>',
//     to: targetEmail,
//     subject,
//     html,
//   });

//   // If using Ethereal, output preview URL in logs
//   if (nodemailer.getTestMessageUrl(info)) {
//     console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
//   }
//   return info;
// }

// // Example SMS sender (Twilio) — needs config:
// async function sendSmsOtp(mobile, otpCode) {
//   if (!process.env.TWILIO_ACCOUNT_SID) {
//     console.log('sendSmsOtp: TWILIO not configured; OTP was', otpCode, 'for', mobile);
//     return;
//   }
//   const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
//   return twilio.messages.create({
//     body: `Your OTP code is ${otpCode}. Expires in ${process.env.OTP_EXPIRY_MINUTES || 5} minutes.`,
//     from: process.env.TWILIO_FROM,
//     to: mobile,
//   });
// }

// module.exports = { sendOtpEmail, sendSmsOtp };


// backend/utils/otp-sender.js
const nodemailer = require('nodemailer');

async function createTransporter() {
  try {
    // If you want a quick dev-only test, create Ethereal account:
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('[MAIL] No EMAIL_USER / EMAIL_PASS set – using Ethereal test account');

      const testAccount = await nodemailer.createTestAccount();
      console.log('[MAIL] Ethereal account created:', {
        user: testAccount.user,
        pass: '***hidden***',
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
      });

      const transporter = nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });

      // optional verify
      try {
        await transporter.verify();
        console.log('[MAIL] Ethereal transporter verified successfully');
      } catch (e) {
        console.error('[MAIL] Ethereal transporter verify FAILED:', e);
      }

      return transporter;
    }

    // production / configurable SMTP
    console.log('[MAIL] Using real SMTP config:', {
      host: process.env.EMAIL_SMTP_HOST,
      port: process.env.EMAIL_SMTP_PORT || '587',
      secure: false,
      user: mask(process.env.EMAIL_USER),
    });

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SMTP_HOST,
      port: parseInt(process.env.EMAIL_SMTP_PORT || '587', 10),
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      // Optional shorter timeouts so you see failures quicker in logs
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000,
    });

    try {
      console.log('[MAIL] Verifying SMTP connection...');
      await transporter.verify();
      console.log('[MAIL] SMTP transporter verified successfully');
    } catch (e) {
      console.error('[MAIL] SMTP transporter verify FAILED:', e);
    }

    return transporter;
  } catch (err) {
    console.error('[MAIL] createTransporter ERROR:', err);
    throw err;
  }
}

function mask(str) {
  if (!str) return null;
  if (str.length <= 3) return '***';
  return str.slice(0, 3) + '***';
}

async function sendOtpEmail(targetEmail, otpCode, purpose = 'registration') {
  console.log('[MAIL] sendOtpEmail called:', {
    targetEmail,
    purpose,
    otpCode,
    OTP_EXPIRY_MINUTES: process.env.OTP_EXPIRY_MINUTES || 5,
  });

  try {
    const transporter = await createTransporter();
    const subject =
      purpose === 'reset' ? 'Your password reset OTP' : 'Your registration OTP';
    const html = `
      <p>Your OTP code is: <strong>${otpCode}</strong></p>
      <p>It will expire in ${process.env.OTP_EXPIRY_MINUTES || 5} minutes.</p>
    `;

    console.log('[MAIL] Sending email via nodemailer.sendMail...');
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER || '"Dev Test" <no-reply@example.com>',
      to: targetEmail,
      subject,
      html,
    });

    console.log('[MAIL] Email sent successfully:', {
      messageId: info.messageId,
      response: info.response,
      accepted: info.accepted,
      rejected: info.rejected,
    });

    // If using Ethereal, output preview URL in logs
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log('[MAIL] Ethereal preview URL:', previewUrl);
    }

    return info;
  } catch (err) {
    console.error('[MAIL] ERROR while sending OTP email:', err);
    // rethrow so your /register route logs "REGISTER ERR" and returns 500
    throw err;
  }
}

// Example SMS sender (Twilio) — needs config:
async function sendSmsOtp(mobile, otpCode) {
  if (!process.env.TWILIO_ACCOUNT_SID) {
    console.log('sendSmsOtp: TWILIO not configured; OTP was', otpCode, 'for', mobile);
    return;
  }
  const twilio = require('twilio')(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );
  return twilio.messages.create({
    body: `Your OTP code is ${otpCode}. Expires in ${
      process.env.OTP_EXPIRY_MINUTES || 5
    } minutes.`,
    from: process.env.TWILIO_FROM,
    to: mobile,
  });
}

module.exports = { sendOtpEmail, sendSmsOtp };




