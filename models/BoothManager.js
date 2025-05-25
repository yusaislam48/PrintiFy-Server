const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const boothManagerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
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
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't include password in query results by default
  },
  boothName: {
    type: String,
    required: [true, 'Please provide a booth name'],
    trim: true
  },
  boothLocation: {
    type: String,
    required: [true, 'Please provide a booth location'],
    trim: true
  },
  boothNumber: {
    type: String,
    required: [true, 'Please provide a booth number'],
    trim: true,
    unique: true
  },
  paperCapacity: {
    type: Number,
    required: [true, 'Please provide paper capacity'],
    default: 500
  },
  loadedPaper: {
    type: Number,
    required: [true, 'Please provide loaded paper count'],
    default: 0
  },
  printerName: {
    type: String,
    required: [true, 'Please provide a printer name'],
    trim: true
  },
  printerModel: {
    type: String,
    required: [true, 'Please provide a printer model'],
    trim: true
  },
  role: {
    type: String,
    default: 'boothManager'
  },
  isActive: {
    type: Boolean,
    default: true
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
boothManagerSchema.pre('save', async function(next) {
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

// Method to compare password
boothManagerSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const BoothManager = mongoose.model('BoothManager', boothManagerSchema);

module.exports = BoothManager; 