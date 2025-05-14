require('dotenv').config();
const mongoose = require('mongoose');

// Test MongoDB connection
async function testConnection() {
  try {
    console.log('MongoDB URI:', process.env.MONGODB_URI);
    
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('MongoDB connection successful!');
    console.log('Connection state:', mongoose.connection.readyState);
    console.log('Connected to MongoDB host:', mongoose.connection.host);
    console.log('Database name:', mongoose.connection.name);
    
    await mongoose.connection.close();
    console.log('Connection closed');
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    
    if (error.message.includes('failed to connect')) {
      console.error('Possible reasons:');
      console.error('- Check if MongoDB Atlas cluster name is correct');
      console.error('- Verify username and password');
      console.error('- Check if your IP is whitelisted in Atlas');
    }
  }
  
  process.exit();
}

testConnection(); 