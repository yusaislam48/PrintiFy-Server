const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
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
    unique: true,
    match: [
      /^\d{7}$/,
      'Student ID must be 7 digits'
    ]
  },
  rfidCardNumber: {
    type: String,
    required: [true, 'Please provide your RFID Card Number'],
    trim: true,
    unique: true,
    match: [
      /^0\d{9}$/,
      'RFID Card Number must be a 10-digit number starting with 0'
    ]
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
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
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't include password in query results by default
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'master'],
    default: 'user'
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  points: {
    type: Number,
    default: 0
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationCode: {
    type: String
  },
  verificationCodeExpires: {
    type: Date
  },
  profilePicture: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Pre-save hook to hash password
userSchema.pre('save', async function(next) {
  // Skip hashing if explicitly requested (for transferring already hashed passwords)
  if (this.$skipPasswordHashing) {
    console.log('Skipping password hashing as requested');
    delete this.$skipPasswordHashing; // Clear the flag
    return next();
  }

  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    console.log('Hashing password for user:', this.email);
    // Generate salt
    const salt = await bcrypt.genSalt(10);
    // Hash password
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    console.error('Error hashing password:', error);
    next(error);
  }
});

// Method to compare password
userSchema.methods.matchPassword = async function(enteredPassword) {
  try {
    console.log('===== PASSWORD VERIFICATION DEBUG =====');
    console.log('User:', this.email);
    console.log('Stored password hash:', this.password);
    console.log('Entered password length:', enteredPassword?.length || 'undefined');
    
    if (!enteredPassword || !this.password) {
      console.log('Invalid password comparison - missing data');
      return false;
    }
    
    // Test comparison with direct string match (should always fail for proper bcrypt hashes)
    const directMatch = (enteredPassword === this.password);
    console.log('Direct string comparison (expected to fail):', directMatch);
    
    // Generate a test hash of the entered password to see what it would look like
    const salt = await bcrypt.genSalt(10);
    const testHash = await bcrypt.hash(enteredPassword, salt);
    console.log('Test hash of entered password:', testHash);
    console.log('Test hash length:', testHash.length);
    console.log('Stored hash length:', this.password.length);
    
    // Perform the actual bcrypt comparison
    const isMatch = await bcrypt.compare(enteredPassword, this.password);
    console.log('Bcrypt password comparison result:', isMatch);
    console.log('===== END PASSWORD DEBUG =====');
    
    return isMatch;
  } catch (error) {
    console.error('Error comparing passwords:', error);
    return false;
  }
};

const User = mongoose.model('User', userSchema);

module.exports = User; 