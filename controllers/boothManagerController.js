const BoothManager = require('../models/BoothManager');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Generate JWT token for booth manager
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Register a new booth manager
// @route   POST /api/booth-managers
// @access  Private/Admin
exports.registerBoothManager = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      boothName,
      boothLocation,
      boothNumber,
      paperCapacity,
      loadedPaper,
      printerName,
      printerModel
    } = req.body;

    // Check if booth manager already exists
    const boothManagerExists = await BoothManager.findOne({ email });
    if (boothManagerExists) {
      return res.status(400).json({ success: false, message: 'Booth manager already exists' });
    }

    // Check if booth number already exists
    const boothNumberExists = await BoothManager.findOne({ boothNumber });
    if (boothNumberExists) {
      return res.status(400).json({ success: false, message: 'Booth number already exists' });
    }

    // Create booth manager
    const boothManager = await BoothManager.create({
      name,
      email,
      password,
      boothName,
      boothLocation,
      boothNumber,
      paperCapacity,
      loadedPaper: loadedPaper || 0,
      printerName,
      printerModel
    });

    if (boothManager) {
      res.status(201).json({
        success: true,
        message: 'Booth manager created successfully',
        boothManager: {
          _id: boothManager._id,
          name: boothManager.name,
          email: boothManager.email,
          boothName: boothManager.boothName,
          boothNumber: boothManager.boothNumber,
          role: boothManager.role
        }
      });
    } else {
      res.status(400).json({ success: false, message: 'Invalid booth manager data' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Get all booth managers
// @route   GET /api/booth-managers
// @access  Private/Admin
exports.getAllBoothManagers = async (req, res) => {
  try {
    const boothManagers = await BoothManager.find({}).select('-password');
    res.status(200).json({ success: true, boothManagers });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Get booth manager by ID
// @route   GET /api/booth-managers/:id
// @access  Private/Admin
exports.getBoothManagerById = async (req, res) => {
  try {
    const boothManager = await BoothManager.findById(req.params.id).select('-password');
    if (boothManager) {
      res.status(200).json({ success: true, boothManager });
    } else {
      res.status(404).json({ success: false, message: 'Booth manager not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Update booth manager
// @route   PUT /api/booth-managers/:id
// @access  Private/Admin
exports.updateBoothManager = async (req, res) => {
  try {
    const boothManager = await BoothManager.findById(req.params.id);
    if (!boothManager) {
      return res.status(404).json({ success: false, message: 'Booth manager not found' });
    }

    // Check if booth number already exists when updating
    if (req.body.boothNumber && req.body.boothNumber !== boothManager.boothNumber) {
      const boothNumberExists = await BoothManager.findOne({ boothNumber: req.body.boothNumber });
      if (boothNumberExists) {
        return res.status(400).json({ success: false, message: 'Booth number already exists' });
      }
    }

    // Check if email already exists when updating
    if (req.body.email && req.body.email !== boothManager.email) {
      const emailExists = await BoothManager.findOne({ email: req.body.email });
      if (emailExists) {
        return res.status(400).json({ success: false, message: 'Email already exists' });
      }
    }

    // Update booth manager fields
    boothManager.name = req.body.name || boothManager.name;
    boothManager.email = req.body.email || boothManager.email;
    boothManager.boothName = req.body.boothName || boothManager.boothName;
    boothManager.boothLocation = req.body.boothLocation || boothManager.boothLocation;
    boothManager.boothNumber = req.body.boothNumber || boothManager.boothNumber;
    boothManager.paperCapacity = req.body.paperCapacity || boothManager.paperCapacity;
    boothManager.loadedPaper = req.body.loadedPaper !== undefined ? req.body.loadedPaper : boothManager.loadedPaper;
    boothManager.printerName = req.body.printerName || boothManager.printerName;
    boothManager.printerModel = req.body.printerModel || boothManager.printerModel;
    boothManager.isActive = req.body.isActive !== undefined ? req.body.isActive : boothManager.isActive;

    if (req.body.password) {
      boothManager.password = req.body.password;
    }

    const updatedBoothManager = await boothManager.save();
    res.status(200).json({
      success: true,
      message: 'Booth manager updated successfully',
      boothManager: {
        _id: updatedBoothManager._id,
        name: updatedBoothManager.name,
        email: updatedBoothManager.email,
        boothName: updatedBoothManager.boothName,
        boothNumber: updatedBoothManager.boothNumber,
        role: updatedBoothManager.role,
        isActive: updatedBoothManager.isActive
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Delete booth manager
// @route   DELETE /api/booth-managers/:id
// @access  Private/Admin
exports.deleteBoothManager = async (req, res) => {
  try {
    const boothManager = await BoothManager.findById(req.params.id);
    if (!boothManager) {
      return res.status(404).json({ success: false, message: 'Booth manager not found' });
    }

    await boothManager.deleteOne();
    res.status(200).json({ success: true, message: 'Booth manager deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Booth manager login
// @route   POST /api/booth-managers/login
// @access  Public
exports.loginBoothManager = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for booth manager email
    const boothManager = await BoothManager.findOne({ email }).select('+password');
    if (!boothManager) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Check if booth manager is active
    if (!boothManager.isActive) {
      return res.status(401).json({ success: false, message: 'Account is deactivated' });
    }

    // Check if password matches
    const isMatch = await boothManager.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(boothManager._id);

    res.status(200).json({
      success: true,
      token,
      boothManager: {
        _id: boothManager._id,
        name: boothManager.name,
        email: boothManager.email,
        boothName: boothManager.boothName,
        boothLocation: boothManager.boothLocation,
        boothNumber: boothManager.boothNumber,
        paperCapacity: boothManager.paperCapacity,
        loadedPaper: boothManager.loadedPaper,
        printerName: boothManager.printerName,
        printerModel: boothManager.printerModel,
        role: boothManager.role
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Update paper count
// @route   PUT /api/booth-managers/paper-count
// @access  Private/BoothManager
exports.updatePaperCount = async (req, res) => {
  try {
    const { loadedPaper, operation } = req.body;

    // Get the booth manager ID from the authenticated user
    const boothManagerId = req.user.id;

    const boothManager = await BoothManager.findById(boothManagerId);
    if (!boothManager) {
      return res.status(404).json({ success: false, message: 'Booth manager not found' });
    }

    // Update paper count based on operation
    if (operation === 'add') {
      boothManager.loadedPaper = boothManager.loadedPaper + Number(loadedPaper);
    } else if (operation === 'set') {
      boothManager.loadedPaper = Number(loadedPaper);
    }

    // Check if loaded paper exceeds capacity
    if (boothManager.loadedPaper > boothManager.paperCapacity) {
      return res.status(400).json({ 
        success: false, 
        message: `Paper count exceeds capacity of ${boothManager.paperCapacity} sheets` 
      });
    }

    const updatedBoothManager = await boothManager.save();
    res.status(200).json({
      success: true,
      message: 'Paper count updated successfully',
      loadedPaper: updatedBoothManager.loadedPaper,
      paperCapacity: updatedBoothManager.paperCapacity
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Get booth manager profile
// @route   GET /api/booth-managers/profile
// @access  Private/BoothManager
exports.getBoothManagerProfile = async (req, res) => {
  try {
    const boothManager = await BoothManager.findById(req.user.id).select('-password');
    if (boothManager) {
      res.status(200).json({ success: true, boothManager });
    } else {
      res.status(404).json({ success: false, message: 'Booth manager not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
}; 