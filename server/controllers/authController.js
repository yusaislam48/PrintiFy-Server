const jwt = require('jsonwebtoken');
const User = require('../models/User');
const PendingUser = require('../models/PendingUser');
const jwtConfig = require('../config/jwt');
const { generateVerificationCode, sendVerificationEmail, sendPasswordResetEmail } = require('../utils/emailService');

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user._id || user,
      name: user.name,
      email: user.email,
      role: user.role
    },
    jwtConfig.secretKey,
    jwtConfig.options
  );
};

// Generate refresh token
const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id || user },
    jwtConfig.secretKey,
    { expiresIn: jwtConfig.refreshToken.expiresIn }
  );
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    console.log('Register request received:', req.body);
    
    const { name, email, password, studentId, phone, rfidCardNumber } = req.body;

    // Validate input
    if (!name || !email || !password || !studentId || !phone || !rfidCardNumber) {
      console.log('Missing required fields:', { 
        name: !!name, 
        email: !!email, 
        password: !!password, 
        studentId: !!studentId, 
        phone: !!phone,
        rfidCardNumber: !!rfidCardNumber
      });
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if user already exists in verified users
    const userExists = await User.findOne({ email });
    if (userExists) {
      console.log('User already exists with email:', email);
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Check if student ID already exists in verified users
    const studentIdExists = await User.findOne({ studentId });
    if (studentIdExists) {
      console.log('User already exists with student ID:', studentId);
      return res.status(400).json({ message: 'User with this student ID already exists' });
    }

    // Check if RFID Card Number already exists in verified users
    const rfidCardExists = await User.findOne({ rfidCardNumber });
    if (rfidCardExists) {
      console.log('User already exists with RFID Card Number:', rfidCardNumber);
      return res.status(400).json({ message: 'User with this RFID Card Number already exists' });
    }

    // Generate verification code
    const verificationCode = generateVerificationCode();
    const verificationCodeExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    
    console.log('Generated verification details:', {
      email,
      code: verificationCode,
      expires: verificationCodeExpires
    });

    // Check if there's already a pending user with this email
    let pendingUser = await PendingUser.findOne({ email });
    
    if (pendingUser) {
      // Update existing pending user with new verification code
      console.log('Updating existing pending user:', pendingUser._id);
      pendingUser.name = name;
      pendingUser.studentId = studentId;
      pendingUser.rfidCardNumber = rfidCardNumber;
      pendingUser.phone = phone;
      pendingUser.password = password; // Will be hashed by pre-save hook
      pendingUser.verificationCode = verificationCode;
      pendingUser.verificationCodeExpires = verificationCodeExpires;
      await pendingUser.save();
      console.log('Updated pending user with new verification code:', email);
    } else {
      // Create new pending user
      console.log('Creating new pending user');
      pendingUser = await PendingUser.create({
        name,
        email,
        password,
        studentId,
        rfidCardNumber,
        phone,
        verificationCode,
        verificationCodeExpires
      });
      console.log('Created new pending user:', email);
    }
    
    // Double-check that verification code was stored correctly
    const savedPendingUser = await PendingUser.findOne({ email });
    console.log('Saved pending user verification details:', {
      code: savedPendingUser.verificationCode,
      expires: savedPendingUser.verificationCodeExpires
    });

    // Send verification email
    const emailSent = await sendVerificationEmail(email, verificationCode);
    
    if (!emailSent) {
      // If email fails, still create account but warn the user
      console.warn('Failed to send verification email to:', email);
    } else {
      console.log('Verification email sent successfully to:', email);
    }

    // Respond with minimal user data
    res.status(201).json({
      email: pendingUser.email,
      message: 'Registration successful. Please check your email for verification code.'
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      console.error('Validation error:', messages);
      return res.status(400).json({ message: 'Validation error', errors: messages });
    }
    
    // Handle duplicate key error
    if (error.code === 11000) {
      console.error('Duplicate key error:', error.keyValue);
      return res.status(400).json({ message: `User with this ${Object.keys(error.keyValue)[0]} already exists` });
    }
    
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
};

// @desc    Verify user email with code
// @route   POST /api/auth/verify
// @access  Public
exports.verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;
    console.log('Verification attempt received:', { email, code });

    if (!email || !code) {
      console.log('Missing required fields:', { email: !!email, code: !!code });
      return res.status(400).json({ message: 'Email and verification code are required' });
    }

    // Find the pending user
    const pendingUser = await PendingUser.findOne({ email });
    if (!pendingUser) {
      console.log('No pending user found for email:', email);
      return res.status(404).json({ message: 'No pending registration found for this email' });
    }

    // Explicitly retrieve the password
    const pendingUserWithPassword = await PendingUser.findById(pendingUser._id);
    
    console.log('Pending user found:', {
      id: pendingUser._id,
      email: pendingUser.email,
      storedCode: pendingUser.verificationCode,
      expires: pendingUser.verificationCodeExpires,
      inputCode: code,
      hasPassword: !!pendingUserWithPassword.password,
      passwordLength: pendingUserWithPassword.password?.length
    });

    // Convert both codes to strings and trim whitespace for comparison
    const inputCode = code.toString().trim();
    const storedCode = pendingUser.verificationCode.toString().trim();
    
    console.log('Comparing codes:', { 
      inputCode,
      storedCode,
      match: inputCode === storedCode,
      inputLength: inputCode.length,
      storedLength: storedCode.length,
      inputType: typeof inputCode,
      storedType: typeof storedCode
    });

    // Define a robust comparison function
    const compareVerificationCodes = (inputCode, storedCode) => {
      // First try direct string comparison
      if (inputCode === storedCode) {
        return true;
      }
      
      // Try comparing as numbers if both can be parsed as numbers
      const inputNum = parseInt(inputCode, 10);
      const storedNum = parseInt(storedCode, 10);
      
      if (!isNaN(inputNum) && !isNaN(storedNum)) {
        return inputNum === storedNum;
      }
      
      return false;
    };

    // Check if verification code is valid and not expired
    if (!compareVerificationCodes(inputCode, storedCode)) {
      console.log('Invalid verification code');
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    if (pendingUser.verificationCodeExpires < new Date()) {
      console.log('Verification code expired');
      return res.status(400).json({ message: 'Verification code has expired' });
    }

    // Create a new verified user
    const newUser = new User({
      name: pendingUser.name,
      email: pendingUser.email,
      password: pendingUserWithPassword.password, // Use the hashed password
      studentId: pendingUser.studentId,
      rfidCardNumber: pendingUser.rfidCardNumber,
      phone: pendingUser.phone,
      points: pendingUser.points || 10, // Transfer points or default to 10
      isVerified: true
    });

    // Skip password hashing since we're using the already hashed password
    newUser.$skipPasswordHashing = true;

    // Save the new user
    await newUser.save();
    console.log('New verified user created:', newUser._id);

    // Delete the pending user
    await PendingUser.findByIdAndDelete(pendingUser._id);
    console.log('Pending user deleted:', pendingUser._id);

    // Generate tokens
    const token = generateToken(newUser);
    const refreshToken = generateRefreshToken(newUser);

    // Return success response with tokens
    res.status(200).json({
      message: 'Email verified successfully',
      token,
      refreshToken,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        points: newUser.points
      }
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ message: 'Email verification failed', error: error.message });
  }
};

// @desc    Resend verification code
// @route   POST /api/auth/resend-verification
// @access  Public
exports.resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    console.log('Resend verification requested for:', email);

    // Find the pending user
    const pendingUser = await PendingUser.findOne({ email });

    // Check if the user is already verified
    const verifiedUser = await User.findOne({ email });
    if (verifiedUser) {
      console.log('User is already verified:', email);
      return res.status(400).json({ message: 'Email is already verified' });
    }

    // Generate new verification code
    const verificationCode = generateVerificationCode();
    // Set expiration 24 hours from now to account for timezone differences
    const verificationCodeExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    if (pendingUser) {
      // Update existing pending user
      console.log('Updating existing pending user with new code:', email);
      pendingUser.verificationCode = verificationCode;
      pendingUser.verificationCodeExpires = verificationCodeExpires;
      await pendingUser.save();
    } else {
      // No pending user found, but we'll still send a verification code
      // This can happen if the pending user was deleted or not properly created
      console.log('No pending user found, creating a basic one for email:', email);
      await PendingUser.create({
        email,
        verificationCode,
        verificationCodeExpires,
        // Add minimum required fields with placeholder values
        name: 'Temporary User',
        studentId: '0000000',
        rfidCardNumber: '0000000000',
        phone: '00000000000',
        password: Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
      });
    }

    // Verify the code was saved correctly
    const updatedPendingUser = await PendingUser.findOne({ email });
    console.log('Verification code stored for resend:', {
      code: updatedPendingUser.verificationCode,
      expires: updatedPendingUser.verificationCodeExpires
    });

    // Send verification email
    const emailSent = await sendVerificationEmail(email, verificationCode);
    
    if (!emailSent) {
      console.error('Failed to send verification email to:', email);
      return res.status(500).json({ message: 'Failed to send verification email' });
    }

    console.log('Verification code sent successfully to:', email);
    res.json({ 
      message: 'Verification code sent successfully',
      // Include code in response for development environments
      ...(process.env.NODE_ENV === 'development' && { code: verificationCode })
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ message: 'Failed to resend verification code', error: error.message });
  }
};

// @desc    Login user & get token
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('Login attempt received for email:', email);
    
    if (!email || !password) {
      console.log('Missing login credentials');
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // First, check if the user has a verified account
    const user = await User.findOne({ email }).select('+password');
    console.log('User lookup result:', user ? `Found (ID: ${user._id})` : 'Not found');
    
    if (!user) {
      // Check if there's a pending registration
      const pendingUser = await PendingUser.findOne({ email });
      console.log('Pending user lookup:', pendingUser ? `Found (ID: ${pendingUser._id})` : 'Not found');
      
      if (pendingUser) {
        // User exists but isn't verified
        console.log('User exists but is not verified:', email);
        return res.status(403).json({ 
          message: 'Email not verified',
          isVerified: false,
          email: pendingUser.email
        });
      }
      
      // No user found with this email
      console.log('No user found with email:', email);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check password
    console.log('Checking password for user:', user.email);
    
    // Debug: Check password hash format
    const passwordHashPrefix = user.password.substring(0, 7);
    console.log('Password hash format check:', {
      hashPrefix: passwordHashPrefix,
      isCorrectFormat: passwordHashPrefix === '$2a$10$' || passwordHashPrefix === '$2b$10$'
    });
    
    const isMatch = await user.matchPassword(password);
    console.log('Password match result:', isMatch);
    
    if (!isMatch) {
      console.log('Password does not match for user:', email);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate tokens
    console.log('Generating tokens for user:', user.email);
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    // Respond with user data and tokens
    console.log('Login successful for user:', user.email);
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token,
      refreshToken
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
exports.getCurrentUser = async (req, res) => {
  try {
    // User is already attached to req from auth middleware
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ message: 'Failed to get user data', error: error.message });
  }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token is required' });
    }
    
    // Verify the refresh token
    const decoded = jwt.verify(refreshToken, jwtConfig.secretKey);
    
    // Find the user
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }
    
    // Generate new access token
    const accessToken = generateToken(user);
    
    res.json({
      accessToken
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({ message: 'Invalid refresh token' });
  }
};

// @desc    Create a test user (DEVELOPMENT ONLY)
// @route   POST /api/auth/test-create-user
// @access  Public
exports.createTestUser = async (req, res) => {
  // Temporarily allow in all environments for testing
  // if (process.env.NODE_ENV !== 'development') {
  //   return res.status(403).json({ message: 'This endpoint is only available in development mode' });
  // }

  try {
    const { email, password, name = 'Test User', studentId = '1234567', phone = '01234567890', rfidCardNumber = '0000012345' } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }
    
    // Create user directly (password will be hashed by the pre-save hook)
    const user = await User.create({
      name,
      email,
      password,
      studentId,
      rfidCardNumber,
      phone,
      isVerified: true,
      role: 'user'
    });
    
    // Generate tokens
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);
    
    // Verify created user's password retrieval works
    const createdUser = await User.findById(user._id).select('+password');
    
    console.log('Test user created successfully:', {
      id: user._id,
      email: user.email,
      passwordExists: !!createdUser.password,
      passwordLength: createdUser.password.length,
      isBcryptHash: createdUser.password.startsWith('$2')
    });
    
    res.status(201).json({
      _id: user._id,
      email: user.email,
      name: user.name,
      token,
      refreshToken,
      message: 'Test user created successfully'
    });
  } catch (error) {
    console.error('Test user creation error:', error);
    res.status(500).json({ message: 'Failed to create test user', error: error.message });
  }
};

// @desc    Reset password (for fixing users with corrupted passwords)
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    
    if (!email || !newPassword) {
      return res.status(400).json({ message: 'Email and new password are required' });
    }
    
    console.log('Password reset requested for:', email);
    
    // Find the user
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('No user found for password reset:', email);
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update the password (will be hashed by pre-save hook)
    user.password = newPassword;
    await user.save();
    
    console.log('Password reset successful for user:', email);
    
    // Try to send email with new password
    const emailSent = await sendPasswordResetEmail(email, newPassword);
    
    if (!emailSent) {
      console.warn('Failed to send password reset email to:', email);
      return res.status(500).json({ 
        message: 'Password was reset but we could not send the email. Please contact support.'
      });
    } else {
      console.log('Password reset email sent successfully to:', email);
    }
    
    // Generate tokens
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);
    
    // Respond with tokens but NOT the password
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token,
      refreshToken,
      emailSent,
      message: 'Password reset successful. Check your email for the temporary password.'
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ message: 'Password reset failed', error: error.message });
  }
};

// @desc    Change user password
// @route   POST /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;
    
    console.log('Change password attempt for user ID:', userId);
    
    // Validate input
    if (!currentPassword || !newPassword) {
      console.log('Missing required fields:', { currentPassword: !!currentPassword, newPassword: !!newPassword });
      return res.status(400).json({ message: 'Current password and new password are required' });
    }
    
    // Validate new password length
    if (newPassword.length < 6) {
      console.log('New password too short:', newPassword.length);
      return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    }
    
    // Get user from database with password field included
    const user = await User.findById(userId).select('+password');
    if (!user) {
      console.log('User not found with ID:', userId);
      return res.status(404).json({ message: 'User not found' });
    }
    
    console.log('User found:', {
      id: user._id,
      email: user.email,
      passwordExists: !!user.password,
      passwordLength: user.password?.length
    });
    
    // Check if current password is correct
    const isMatch = await user.matchPassword(currentPassword);
    console.log('Password match result:', isMatch);
    
    if (!isMatch) {
      console.log('Current password is incorrect for user:', user.email);
      return res.status(401).json({ message: 'Current password is incorrect' });
    }
    
    // Set new password (will be hashed by the pre-save hook in the User model)
    console.log('Setting new password for user:', user.email);
    user.password = newPassword;
    await user.save();
    
    console.log('Password changed successfully for user:', user.email);
    res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Failed to change password', error: error.message });
  }
}; 