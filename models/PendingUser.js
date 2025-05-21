const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const pendingUserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  studentId: {
    type: String,
    required: [true, 'Please provide a student ID'],
    trim: true,
    match: [
      /^\d{7}$/,
      'Student ID must be 7 digits'
    ]
  },
  rfidCardNumber: {
    type: String,
    required: [true, 'Please provide your RFID Card Number'],
    trim: true,
    match: [
      /^0\d{9}$/,
      'RFID Card Number must be a 10-digit number starting with 0'
    ]
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    trim: true,
    lowercase: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  phone: {
    type: String,
    required: [true, 'Please provide a phone number'],
    trim: true,
    match: [
      /^\d{11}$/,
      'Phone number must be 11 digits'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  points: {
    type: Number,
    default: 10
  },
  verificationCode: {
    type: String,
    required: true,
    set: value => value.toString().trim()
  },
  verificationCodeExpires: {
    type: Date,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400 // Auto-delete after 24 hours if not verified
  }
}, { timestamps: true });

// Pre-save hook to hash password
pendingUserSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    // Generate salt
    const salt = await bcrypt.genSalt(10);
    // Hash password
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save hook to ensure verification code is a string
pendingUserSchema.pre('save', function(next) {
  if (this.isModified('verificationCode')) {
    // Ensure verification code is stored as a string
    this.verificationCode = this.verificationCode.toString().trim();
    console.log('Verification code saved as:', this.verificationCode, 'type:', typeof this.verificationCode);
  }
  next();
});

const PendingUser = mongoose.model('PendingUser', pendingUserSchema);

module.exports = PendingUser; 