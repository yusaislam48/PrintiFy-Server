const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// BoothManager Schema (inline since model might not be available)
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
    select: false
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
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
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

// Create the model
const BoothManager = mongoose.model('BoothManager', boothManagerSchema);

// Connect to MongoDB
const connectDB = async () => {
  try {
    // Use the same connection string as the main app
    const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/printify';
    const conn = await mongoose.connect(mongoURI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// Create booth manager
const createBoothManager = async () => {
  try {
    // Check if booth manager already exists
    const existingManager = await BoothManager.findOne({ email: 'booth1@printify.com' });
    
    if (existingManager) {
      console.log('✅ Booth manager already exists:');
      console.log('Email:', existingManager.email);
      console.log('Name:', existingManager.name);
      console.log('Booth:', existingManager.boothName);
      console.log('Active:', existingManager.isActive);
      return existingManager;
    }

    // Create new booth manager
    const boothManager = new BoothManager({
      name: 'Print Hub Manager',
      email: 'booth1@printify.com',
      password: 'Yu2521191', // This will be hashed automatically
      boothName: 'Main Print Hub',
      boothLocation: 'Library - Ground Floor',
      boothNumber: 'HUB-001',
      paperCapacity: 500,
      loadedPaper: 250,
      printerName: 'HP LaserJet Pro',
      printerModel: 'M404dn',
      isActive: true
    });

    const savedManager = await boothManager.save();
    
    console.log('✅ Booth manager created successfully!');
    console.log('Email: booth1@printify.com');
    console.log('Password: Yu2521191');
    console.log('Name:', savedManager.name);
    console.log('Booth:', savedManager.boothName);
    console.log('Location:', savedManager.boothLocation);
    
    return savedManager;
    
  } catch (error) {
    console.error('❌ Error creating booth manager:', error);
    throw error;
  }
};

// Main function
const main = async () => {
  try {
    await connectDB();
    await createBoothManager();
    
    // List all booth managers
    const allManagers = await BoothManager.find({}).select('-password');
    console.log('\n📋 All booth managers in database:');
    allManagers.forEach((manager, index) => {
      console.log(`${index + 1}. ${manager.name} (${manager.email}) - ${manager.boothName} - Active: ${manager.isActive}`);
    });
    
  } catch (error) {
    console.error('❌ Script failed:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n🔌 Database connection closed.');
  }
};

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { createBoothManager, BoothManager }; 