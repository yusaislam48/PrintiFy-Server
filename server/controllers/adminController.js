const User = require('../models/User');
const PrintJob = require('../models/PrintJob');
const { cloudinary } = require('../config/cloudinary');

// Get all users with pagination
exports.getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Build query based on search and filter parameters
    const query = {};
    
    // Handle search query parameter
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { studentId: searchRegex },
        { rfidCardNumber: searchRegex }
      ];
    }
    
    // Handle role filter
    if (req.query.role && req.query.role !== 'all') {
      query.role = req.query.role;
    }
    
    // Handle verification status filter
    if (req.query.verified === 'true') {
      query.isVerified = true;
    } else if (req.query.verified === 'false') {
      query.isVerified = false;
    }
    
    // Get users with applied filters
    const users = await User.find(query)
      .select('-password -verificationCode -verificationCodeExpires')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const totalUsers = await User.countDocuments(query);
    
    res.status(200).json({
      users,
      pagination: {
        total: totalUsers,
        page,
        pages: Math.ceil(totalUsers / limit),
        limit
      }
    });
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ message: 'Failed to get users', error: error.message });
  }
};

// Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -verificationCode -verificationCodeExpires');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json(user);
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({ message: 'Failed to get user', error: error.message });
  }
};

// Update user
exports.updateUser = async (req, res) => {
  try {
    const { name, email, studentId, rfidCardNumber, phone, role, points, isVerified, isAdmin } = req.body;
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if trying to modify a master admin (only master admins can modify other master admins)
    if (user.role === 'master' && req.user.role !== 'master') {
      return res.status(403).json({ message: 'Only master admins can modify other master admins' });
    }
    
    // Validate RFID Card Number format if provided
    if (rfidCardNumber && !/^0\d{9}$/.test(rfidCardNumber)) {
      return res.status(400).json({ 
        message: 'RFID Card Number must be a 10-digit number starting with 0' 
      });
    }
    
    // Update user fields if provided
    if (name) user.name = name;
    if (email) user.email = email;
    if (studentId) user.studentId = studentId;
    if (rfidCardNumber) user.rfidCardNumber = rfidCardNumber;
    if (phone) user.phone = phone;
    if (role !== undefined) user.role = role;
    if (points !== undefined) user.points = points;
    if (isVerified !== undefined) user.isVerified = isVerified;
    if (isAdmin !== undefined) user.isAdmin = isAdmin;
    
    const updatedUser = await user.save();
    
    res.status(200).json({
      message: 'User updated successfully',
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        studentId: updatedUser.studentId,
        rfidCardNumber: updatedUser.rfidCardNumber,
        phone: updatedUser.phone,
        role: updatedUser.role,
        points: updatedUser.points,
        isVerified: updatedUser.isVerified,
        isAdmin: updatedUser.isAdmin
      }
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Failed to update user', error: error.message });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if trying to delete a master admin (only master admins can delete other master admins)
    if (user.role === 'master' && req.user.role !== 'master') {
      return res.status(403).json({ message: 'Only master admins can delete master admins' });
    }
    
    // Delete all print jobs associated with this user
    await PrintJob.deleteMany({ userId: user._id });
    
    // Delete the user using deleteOne instead of remove which is deprecated
    await User.deleteOne({ _id: user._id });
    
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Failed to delete user', error: error.message });
  }
};

// Get all print jobs with pagination and filters
exports.getAllPrintJobs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Build filter object based on query parameters
    const filter = {};
    
    if (req.query.userId) {
      filter.userId = req.query.userId;
    }
    
    if (req.query.status) {
      filter.status = req.query.status;
    }
    
    if (req.query.startDate && req.query.endDate) {
      filter.createdAt = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }
    
    // Get print jobs with populated user data
    const printJobs = await PrintJob.find(filter)
      .populate('userId', 'name email studentId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const totalJobs = await PrintJob.countDocuments(filter);
    
    res.status(200).json({
      printJobs,
      pagination: {
        total: totalJobs,
        page,
        pages: Math.ceil(totalJobs / limit),
        limit
      }
    });
  } catch (error) {
    console.error('Error getting print jobs:', error);
    res.status(500).json({ message: 'Failed to get print jobs', error: error.message });
  }
};

// Get print job by ID
exports.getPrintJobById = async (req, res) => {
  try {
    const printJob = await PrintJob.findById(req.params.id)
      .populate('userId', 'name email studentId');
    
    if (!printJob) {
      return res.status(404).json({ message: 'Print job not found' });
    }
    
    res.status(200).json(printJob);
  } catch (error) {
    console.error('Error getting print job:', error);
    res.status(500).json({ message: 'Failed to get print job', error: error.message });
  }
};

// Update print job status
exports.updatePrintJobStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }
    
    const printJob = await PrintJob.findById(req.params.id);
    
    if (!printJob) {
      return res.status(404).json({ message: 'Print job not found' });
    }
    
    // Update status
    printJob.status = status;
    
    // If marking as completed, handle point deduction
    if (status === 'completed' && printJob.status !== 'completed') {
      const user = await User.findById(printJob.userId);
      
      if (user) {
        const pointsToDeduct = printJob.pointsUsed || printJob.printSettings.totalPages || 1;
        user.points = Math.max(0, user.points - pointsToDeduct);
        await user.save();
      }
    }
    
    await printJob.save();
    
    res.status(200).json({
      message: 'Print job status updated successfully',
      printJob
    });
  } catch (error) {
    console.error('Error updating print job status:', error);
    res.status(500).json({ message: 'Failed to update print job status', error: error.message });
  }
};

// Delete print job
exports.deletePrintJob = async (req, res) => {
  try {
    const printJob = await PrintJob.findById(req.params.id);
    
    if (!printJob) {
      return res.status(404).json({ message: 'Print job not found' });
    }
    
    // Delete file from Cloudinary if it exists
    if (printJob.cloudinaryPublicId) {
      try {
        await cloudinary.uploader.destroy(printJob.cloudinaryPublicId, { resource_type: 'raw' });
      } catch (deleteError) {
        console.error('Error deleting file from Cloudinary:', deleteError);
      }
    }
    
    // Delete the print job
    await printJob.remove();
    
    res.status(200).json({ message: 'Print job deleted successfully' });
  } catch (error) {
    console.error('Error deleting print job:', error);
    res.status(500).json({ message: 'Failed to delete print job', error: error.message });
  }
};

// Get dashboard statistics
exports.getDashboardStats = async (req, res) => {
  try {
    // Get total users
    const totalUsers = await User.countDocuments();
    
    // Get total print jobs
    const totalPrintJobs = await PrintJob.countDocuments();
    
    // Get print jobs by status
    const pendingJobs = await PrintJob.countDocuments({ status: 'pending' });
    const completedJobs = await PrintJob.countDocuments({ status: 'completed' });
    const cancelledJobs = await PrintJob.countDocuments({ status: 'cancelled' });
    
    // Get total points in the system
    const pointsAggregate = await User.aggregate([
      {
        $group: {
          _id: null,
          totalPoints: { $sum: '$points' }
        }
      }
    ]);
    
    const totalPoints = pointsAggregate.length > 0 ? pointsAggregate[0].totalPoints : 0;
    
    // Get recent users
    const recentUsers = await User.find()
      .select('name email studentId createdAt')
      .sort({ createdAt: -1 })
      .limit(5);
    
    // Get recent print jobs
    const recentPrintJobs = await PrintJob.find()
      .populate('userId', 'name studentId')
      .sort({ createdAt: -1 })
      .limit(5);
    
    res.status(200).json({
      stats: {
        totalUsers,
        totalPrintJobs,
        pendingJobs,
        completedJobs,
        cancelledJobs,
        totalPoints
      },
      recentUsers,
      recentPrintJobs
    });
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json({ message: 'Failed to get dashboard statistics', error: error.message });
  }
};

// Create a master admin account
exports.createMasterAdmin = async (req, res) => {
  try {
    const { name, email, password, studentId, phone } = req.body;
    
    // Check if required fields are provided
    if (!name || !email || !password || !studentId || !phone) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    // Check if user already exists
    const userExists = await User.findOne({ email });
    
    if (userExists) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }
    
    // Create master admin user
    const user = await User.create({
      name,
      email,
      password,
      studentId,
      phone,
      role: 'master',
      isAdmin: true,
      isVerified: true,
      points: 999999 // Give master admin a large number of points
    });
    
    if (user) {
      res.status(201).json({
        message: 'Master admin created successfully',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Error creating master admin:', error);
    res.status(500).json({ message: 'Failed to create master admin', error: error.message });
  }
};

// Add points to a user
exports.addPointsToUser = async (req, res) => {
  try {
    const { points } = req.body;
    const userId = req.params.id;
    
    if (!points || isNaN(points)) {
      return res.status(400).json({ message: 'Valid points value is required' });
    }
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Add points to user
    user.points += parseInt(points);
    await user.save();
    
    res.status(200).json({
      message: `${points} points added to user successfully`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        points: user.points
      }
    });
  } catch (error) {
    console.error('Error adding points to user:', error);
    res.status(500).json({ message: 'Failed to add points to user', error: error.message });
  }
}; 