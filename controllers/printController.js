const { cloudinary, getSignedUrl, getProxyUrl } = require('../config/cloudinary');
const PrintJob = require('../models/PrintJob');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Handle PDF upload to Cloudinary
exports.uploadPDF = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No PDF file uploaded' });
    }

    // Get user ID from authenticated request
    const userId = req.user.id;

    // Create a unique public ID
    const publicId = `printify/pdfs/${userId}_${Date.now()}`;

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      resource_type: 'raw',
      public_id: publicId,
      format: 'pdf',
      access_mode: 'public',
      type: 'upload',
      overwrite: true,
      use_filename: true,
      unique_filename: true,
      disposition: 'inline',
      tags: ['pdf', 'printify']
    });

    // Generate both direct and proxy URLs for secure access
    const directUrl = getSignedUrl(publicId);
    const proxyUrl = getProxyUrl(publicId);

    // Parse printing settings from request
    const printSettings = {
      copies: parseInt(req.body.copies) || 1,
      pageRange: req.body.pageRange || 'all',
      customPageRange: req.body.customPageRange || '',
      layout: req.body.layout || 'portrait',
      printBothSides: req.body.printBothSides === 'true',
      paperSize: req.body.paperSize || 'a4',
      colorMode: req.body.colorMode || 'color',
      totalPages: parseInt(req.body.totalPages) || 0
    };

    console.log('Print job with total pages:', printSettings.totalPages);

    // Create a new print job in database
    const printJob = new PrintJob({
      userId,
      fileName: req.file.originalname,
      fileUrl: directUrl,
      proxyUrl: proxyUrl,
      cloudinaryPublicId: result.public_id,
      printSettings,
      status: 'pending'
    });

    await printJob.save();

    // Delete temp file after successful upload
    fs.unlink(req.file.path, (err) => {
      if (err) console.error('Error deleting temp file:', err);
    });

    return res.status(201).json({
      message: 'PDF uploaded successfully',
      printJob: {
        id: printJob._id,
        fileName: printJob.fileName,
        fileUrl: directUrl,
        proxyUrl: proxyUrl,
        status: printJob.status,
        createdAt: printJob.createdAt,
        printSettings: printJob.printSettings
      }
    });
  } catch (error) {
    console.error('PDF upload error:', error);
    
    // Delete temp file if it exists
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting temp file:', err);
      });
    }
    
    return res.status(500).json({ message: 'Failed to upload PDF', error: error.message });
  }
};

// Get all print jobs for current user
exports.getUserPrintJobs = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const printJobs = await PrintJob.find({ userId })
      .sort({ createdAt: -1 })
      .select('-cloudinaryPublicId');
      
    return res.status(200).json({ printJobs });
  } catch (error) {
    console.error('Error fetching print jobs:', error);
    return res.status(500).json({ message: 'Failed to fetch print jobs', error: error.message });
  }
};

// Get specific print job
exports.getPrintJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.user.id;
    
    const printJob = await PrintJob.findOne({ _id: jobId, userId });
      
    if (!printJob) {
      return res.status(404).json({ message: 'Print job not found' });
    }
    
    // Generate fresh URLs for access
    const directUrl = getSignedUrl(printJob.cloudinaryPublicId);
    const proxyUrl = getProxyUrl(printJob.cloudinaryPublicId);
    
    return res.status(200).json({ 
      printJob: {
        ...printJob.toObject(),
        fileUrl: directUrl,
        proxyUrl: proxyUrl,
        cloudinaryPublicId: undefined
      }
    });
  } catch (error) {
    console.error('Error fetching print job:', error);
    return res.status(500).json({ message: 'Failed to fetch print job', error: error.message });
  }
};

// Cancel a print job
exports.cancelPrintJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.user.id;
    
    const printJob = await PrintJob.findOne({ _id: jobId, userId });
      
    if (!printJob) {
      return res.status(404).json({ message: 'Print job not found' });
    }
    
    // Can only cancel jobs that are pending or processing
    if (printJob.status !== 'pending' && printJob.status !== 'processing') {
      return res.status(400).json({ 
        message: `Cannot cancel a job with status: ${printJob.status}` 
      });
    }
    
    printJob.status = 'cancelled';
    await printJob.save();
    
    return res.status(200).json({ 
      message: 'Print job cancelled successfully',
      printJob: {
        id: printJob._id,
        status: printJob.status
      }
    });
  } catch (error) {
    console.error('Error cancelling print job:', error);
    return res.status(500).json({ message: 'Failed to cancel print job', error: error.message });
  }
};

// Download a PDF file directly
exports.downloadPDF = async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.user.id;
    
    // Find the print job
    const printJob = await PrintJob.findOne({ _id: jobId, userId });
      
    if (!printJob) {
      return res.status(404).json({ message: 'Print job not found' });
    }
    
    // Get the cloudinary public ID
    const publicId = printJob.cloudinaryPublicId;
    
    // Create a direct download URL with attachment disposition
    const downloadOptions = {
      resource_type: 'raw',
      type: 'upload',
      format: 'pdf',
      flags: 'attachment',  // Force download
      secure: true,
      sign_url: true
    };
    
    const downloadUrl = cloudinary.url(publicId, downloadOptions);
    
    try {
      // Fetch the file from Cloudinary
      const response = await axios({
        url: downloadUrl,
        method: 'GET',
        responseType: 'stream'
      });
      
      // Set appropriate headers for download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${printJob.fileName}"`);
      
      // Stream the file to the client
      response.data.pipe(res);
    } catch (error) {
      console.error('Error streaming PDF from Cloudinary:', error);
      return res.status(500).json({ message: 'Failed to download PDF from cloud storage' });
    }
  } catch (error) {
    console.error('Error downloading PDF:', error);
    return res.status(500).json({ message: 'Failed to download PDF', error: error.message });
  }
};

// View a PDF file in the browser
exports.viewPDF = async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.user.id;
    
    // Find the print job
    const printJob = await PrintJob.findOne({ _id: jobId, userId });
      
    if (!printJob) {
      return res.status(404).json({ message: 'Print job not found' });
    }
    
    // Get the cloudinary public ID
    const publicId = printJob.cloudinaryPublicId;
    
    // Create a view URL with inline disposition
    const viewOptions = {
      resource_type: 'raw',
      type: 'upload',
      format: 'pdf',
      flags: 'attachment:false',  // Don't force download
      disposition: 'inline',       // Display in browser
      secure: true,
      sign_url: true
    };
    
    const viewUrl = cloudinary.url(publicId, viewOptions);
    
    // Redirect to the Cloudinary URL
    return res.redirect(viewUrl);
  } catch (error) {
    console.error('Error viewing PDF:', error);
    return res.status(500).json({ message: 'Failed to view PDF', error: error.message });
  }
};

// Find print jobs by student ID (public endpoint - no auth required)
exports.findPrintJobsByStudentId = async (req, res) => {
  try {
    const { studentId } = req.params;
    
    if (!studentId || studentId.length !== 7) {
      return res.status(400).json({ message: 'Valid student ID is required (7 digits)' });
    }
    
    console.log(`Finding print jobs for student ID: ${studentId}`);
    
    // Find the user with this student ID first
    const user = await require('../models/User').findOne({ studentId });
    
    if (!user) {
      console.log(`No user found with student ID: ${studentId}`);
      return res.status(404).json({ message: 'No user found with this student ID' });
    }
    
    console.log(`Found user: ${user.name}, ID: ${user._id}`);
    
    // Find all pending print jobs for this user
    const pendingPrintJobs = await PrintJob.find({ 
      userId: user._id,
      status: 'pending'
    }).sort({ createdAt: -1 });
    
    // Log job details for debugging
    console.log(`Found ${pendingPrintJobs.length} pending jobs for student ${studentId}`);
    
    const updatedJobs = [];
    
    // Process each job to ensure it has the correct URLs
    for (const job of pendingPrintJobs) {
      const jobObj = job.toObject();
      
      // Log job details
      console.log(`Processing job: ${job._id}, filename: ${job.fileName}`);
      
      if (job.cloudinaryPublicId) {
        console.log(`Job has cloudinaryPublicId: ${job.cloudinaryPublicId}`);
        
        // Extract the filename part from cloudinaryPublicId
        const publicIdPath = job.cloudinaryPublicId.replace('printify/pdfs/', '');
        console.log(`Extracted public ID path: ${publicIdPath}`);
        
        // Generate a proxy URL for the PDF - remove .pdf extension if it exists
        const cleanedPath = publicIdPath.endsWith('.pdf') 
          ? publicIdPath 
          : `${publicIdPath}.pdf`;
          
        const proxyUrl = `/pdf-proxy/${process.env.CLOUDINARY_CLOUD_NAME}/raw/upload/${cleanedPath}`;
        console.log(`Generated proxy URL: ${proxyUrl}`);
        
        // Add the proxy URL to the job object
        jobObj.proxyUrl = proxyUrl;
      } else {
        console.warn(`Job ${job._id} missing cloudinaryPublicId`);
      }
      
      updatedJobs.push(jobObj);
    }
    
    return res.status(200).json({ 
      studentName: user.name,
      pendingPrintJobs: updatedJobs
    });
  } catch (error) {
    console.error('Error finding print jobs by student ID:', error);
    return res.status(500).json({ message: 'Failed to find print jobs', error: error.message });
  }
};

// Mark a print job as completed (public endpoint - no auth required)
exports.markPrintJobAsCompleted = async (req, res) => {
  try {
    const { jobId } = req.params;
    
    // Find the print job
    const printJob = await PrintJob.findById(jobId);
      
    if (!printJob) {
      return res.status(404).json({ message: 'Print job not found' });
    }
    
    // Can only mark jobs that are pending as completed
    if (printJob.status !== 'pending') {
      return res.status(400).json({ 
        message: `Cannot mark a job with status: ${printJob.status} as completed` 
      });
    }
    
    // Update the job status
    printJob.status = 'completed';
    await printJob.save();
    
    return res.status(200).json({ 
      message: 'Print job marked as completed successfully',
      printJob: {
        id: printJob._id,
        fileName: printJob.fileName,
        status: printJob.status
      }
    });
  } catch (error) {
    console.error('Error marking print job as completed:', error);
    return res.status(500).json({ message: 'Failed to update print job status', error: error.message });
  }
};

// View a PDF file publicly without authentication
exports.viewPublicPDF = async (req, res) => {
  try {
    const { jobId } = req.params;
    
    if (!jobId || !jobId.match(/^[0-9a-fA-F]{24}$/)) {
      console.error(`Invalid job ID format: ${jobId}`);
      return res.status(400).json({ message: 'Invalid job ID format' });
    }
    
    console.log(`Attempting to view PDF for job: ${jobId}`);
    
    // Find the print job without requiring user authentication
    const printJob = await PrintJob.findById(jobId).lean();
    
    if (!printJob) {
      console.error(`Print job not found with ID: ${jobId}`);
      
      // Try to find by comparing string representation instead
      const allJobs = await PrintJob.find().limit(10);
      console.log('Available jobs:', allJobs.map(j => ({ id: j._id.toString(), filename: j.fileName })));
      
      return res.status(404).json({ message: 'Print job not found' });
    }
    
    console.log(`Found print job: ${printJob.fileName}, ID: ${printJob._id}`);
    console.log('Print job details:', JSON.stringify({
      id: printJob._id,
      filename: printJob.fileName,
      hasCloudinaryId: !!printJob.cloudinaryPublicId
    }));
    
    // Get the cloudinary public ID
    const publicId = printJob.cloudinaryPublicId;
    
    if (!publicId) {
      console.error('Missing cloudinary public ID');
      return res.status(404).json({ message: 'PDF file reference not found' });
    }
    
    console.log(`Using cloudinary public ID: ${publicId}`);
    
    // Create a view URL with inline disposition
    const viewOptions = {
      resource_type: 'raw',
      type: 'upload',
      flags: req.query.download === 'true' ? 'attachment' : 'attachment:false',
      disposition: req.query.download === 'true' ? 'attachment' : 'inline',
      secure: true,
      sign_url: true
    };
    
    // Ensure we don't have double extensions in the URL
    let formattedPublicId = publicId;
    if (!formattedPublicId.endsWith('.pdf')) {
      formattedPublicId = `${formattedPublicId}.pdf`;
    }
    
    const viewUrl = cloudinary.url(formattedPublicId, viewOptions);
    console.log(`Generated Cloudinary URL: ${viewUrl}`);
    
    // Fetch and stream the PDF from Cloudinary
    try {
      const response = await axios({
        url: viewUrl,
        method: 'GET',
        responseType: 'stream',
        timeout: 15000 // 15 second timeout
      });
      
      // Set appropriate headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', req.query.download === 'true' ? 
        `attachment; filename="${printJob.fileName}"` : 'inline');
      
      // Add CORS headers to avoid browser restrictions
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      
      // Stream the file to the client
      response.data.pipe(res);
    } catch (error) {
      console.error('Error streaming PDF from Cloudinary:', error);
      
      // Try an alternative URL construction as a fallback
      try {
        console.log('Trying alternative URL format...');
        const altUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/raw/upload/fl_attachment:false/${publicId}`;
        console.log(`Alternative URL: ${altUrl}`);
        
        const altResponse = await axios({
          url: altUrl,
          method: 'GET',
          responseType: 'stream',
          timeout: 15000
        });
        
        // Set appropriate headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', req.query.download === 'true' ? 
          `attachment; filename="${printJob.fileName}"` : 'inline');
        
        // Add CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        
        // Stream the file to the client
        altResponse.data.pipe(res);
      } catch (fallbackError) {
        console.error('Fallback URL also failed:', fallbackError.message);
        return res.status(500).json({ 
          message: 'Failed to stream PDF from cloud storage',
          error: error.message,
          fallbackError: fallbackError.message
        });
      }
    }
  } catch (error) {
    console.error('Error viewing public PDF:', error);
    return res.status(500).json({ message: 'Failed to view PDF', error: error.message });
  }
}; 