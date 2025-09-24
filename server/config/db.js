const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Check for both environment variable names to be more flexible
    const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/printify';
    
    // Add debug logging
    console.log(`Attempting to connect to MongoDB with URI type: ${mongoURI ? (mongoURI.includes('mongodb+srv') ? 'Atlas URI' : 'Local URI') : 'No URI found'}`);
    
    // MongoDB connection with modern driver (no deprecated options needed)
    const conn = await mongoose.connect(mongoURI);
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    
    // Provide more helpful error information
    if (error.message.includes('ECONNREFUSED')) {
      console.error('Could not connect to MongoDB. Please check if:');
      console.error('- MongoDB is running on your local machine');
      console.error('- Your MongoDB Atlas credentials are correct');
      console.error('- Network connectivity is available');
    }
    
    // Exit process with failure
    process.exit(1);
  }
};

module.exports = connectDB; 