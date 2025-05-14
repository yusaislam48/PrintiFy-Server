const nodemailer = require('nodemailer');
require('dotenv').config();

// Create a transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Generate a random verification code
const generateVerificationCode = () => {
  // Generate a 6-digit code and ensure it's a string
  const num = Math.floor(100000 + Math.random() * 900000);
  const code = num.toString();
  console.log('Generated verification code:', code, 'type:', typeof code);
  return code;
};

// Send verification email
const sendVerificationEmail = async (email, code) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'PrintiFy - Verify Your Email',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #4a6ee0;">Welcome to PrintiFy!</h2>
        <p>Thank you for registering. Please verify your email address to complete the registration process.</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center;">
          <h3>Your verification code is:</h3>
          <h1 style="color: #4a6ee0; letter-spacing: 5px;">${code}</h1>
        </div>
        <p>This code will expire in 30 minutes.</p>
        <p>If you did not create an account with PrintiFy, please ignore this email.</p>
        <p>Thank you,<br>The PrintiFy Team</p>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Verification email sent: ', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending verification email: ', error);
    return false;
  }
};

// Send password reset email
const sendPasswordResetEmail = async (email, tempPassword) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'PrintiFy - Password Reset',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #4a6ee0;">PrintiFy Password Reset</h2>
        <p>You have requested to reset your password.</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center;">
          <h3>Your temporary password is:</h3>
          <h1 style="color: #4a6ee0; font-family: monospace; letter-spacing: 2px;">${tempPassword}</h1>
        </div>
        <p>Please use this temporary password to log in, and then change your password from your account settings.</p>
        <p>If you did not request a password reset, please contact support immediately.</p>
        <p>Thank you,<br>The PrintiFy Team</p>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent: ', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending password reset email: ', error);
    return false;
  }
};

module.exports = {
  generateVerificationCode,
  sendVerificationEmail,
  sendPasswordResetEmail
}; 