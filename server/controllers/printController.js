const { cloudinary, getSignedUrl, getProxyUrl } = require('../config/cloudinary');
const PrintJob = require('../models/PrintJob');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const printer = require('pdf-to-printer');
const os = require('os');
const { exec } = require('child_process');

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
    
    // Calculate points needed for this job - 1 point per page
    const pointsNeeded = printSettings.totalPages > 0 ? printSettings.totalPages : 1;

    // Create a new print job in database
    const printJob = new PrintJob({
      userId,
      fileName: req.file.originalname,
      fileUrl: directUrl,
      proxyUrl: proxyUrl,
      cloudinaryPublicId: result.public_id,
      pointsUsed: pointsNeeded,
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
        printSettings: printJob.printSettings,
        pointsUsed: printJob.pointsUsed
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

// Find print jobs by student ID or RFID Card Number (public endpoint - no auth required)
exports.findPrintJobsByStudentId = async (req, res) => {
  try {
    const { studentId } = req.params;
    const User = require('../models/User'); // Import User model
    
    if (!studentId) {
      return res.status(400).json({ message: 'Invalid search parameter' });
    }
    
    let user;
    
    // Check if it's a Student ID (7 digits not starting with 0)
    if (/^[1-9]\d{6}$/.test(studentId)) {
      // Find the user by student ID
      user = await User.findOne({ studentId });
    } 
    // Check if it's a RFID Card Number (10 digits starting with 0)
    else if (/^0\d{9}$/.test(studentId)) {
      // Find the user by RFID Card Number
      user = await User.findOne({ rfidCardNumber: studentId });
    } else {
      return res.status(400).json({ message: 'Invalid ID format. Must be either a 7-digit Student ID not starting with 0 or a 10-digit RFID Card Number starting with 0.' });
    }
    
    if (!user) {
      return res.status(404).json({ message: 'No user found with this ID or RFID Card' });
    }
    
    // Find pending print jobs for this user
    const pendingPrintJobs = await PrintJob.find({ 
      userId: user._id,
      status: { $in: ['pending', 'processing'] }
    }).sort({ createdAt: -1 });
    
    // Generate fresh URLs for each job
    const jobsWithUrls = pendingPrintJobs.map(job => {
      const directUrl = getSignedUrl(job.cloudinaryPublicId);
      const proxyUrl = getProxyUrl(job.cloudinaryPublicId);
      
      return {
        ...job.toObject(),
        fileUrl: directUrl,
        proxyUrl: proxyUrl,
        cloudinaryPublicId: undefined
      };
    });
    
    return res.status(200).json({ 
      studentName: user.name,
      userPoints: user.points || 0, // Include user points in the response
      pendingPrintJobs: jobsWithUrls
    });
  } catch (error) {
    console.error('Error finding print jobs by search parameter:', error);
    return res.status(500).json({ 
      message: 'Failed to find print jobs', 
      error: error.message 
    });
  }
};

// Mark a print job as completed and deduct points
exports.markPrintJobAsCompleted = async (req, res) => {
  try {
    const { jobId } = req.params;
    const User = require('../models/User'); // Import User model
    
    // Find the print job
    const printJob = await PrintJob.findById(jobId);
    
    if (!printJob) {
      return res.status(404).json({ message: 'Print job not found' });
    }
    
    // Can only complete jobs that are pending or processing
    if (printJob.status !== 'pending' && printJob.status !== 'processing') {
      return res.status(400).json({ 
        message: `Cannot complete a job with status: ${printJob.status}` 
      });
    }
    
    // Find the user who owns this print job
    const user = await User.findById(printJob.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Calculate points to deduct (should be set during upload, but fallback to total pages if needed)
    const pointsToDeduct = printJob.pointsUsed || printJob.printSettings.totalPages || 1;
    
    // Check if user has enough points
    if (user.points < pointsToDeduct) {
      return res.status(400).json({
        message: 'User does not have enough points',
        required: pointsToDeduct,
        available: user.points
      });
    }
    
    // Update user's points
    user.points = Math.max(0, user.points - pointsToDeduct); // Ensure points don't go below 0
    await user.save();
    
    // Update print job status
    printJob.status = 'completed';
    await printJob.save();
    
    // Delete the file from Cloudinary
    try {
      if (printJob.cloudinaryPublicId) {
        console.log(`Attempting to delete file from Cloudinary: ${printJob.cloudinaryPublicId}`);
        await cloudinary.uploader.destroy(printJob.cloudinaryPublicId, { resource_type: 'raw' });
        console.log(`Successfully deleted file from Cloudinary: ${printJob.cloudinaryPublicId}`);
      }
    } catch (deleteError) {
      console.error(`Error deleting file from Cloudinary: ${deleteError.message}`);
      // Continue with the response even if file deletion fails
    }
    
    return res.status(200).json({
      message: 'Print job completed successfully',
      printJob: {
        id: printJob._id,
        status: printJob.status,
        pointsUsed: pointsToDeduct
      },
      user: {
        id: user._id,
        points: user.points
      }
    });
  } catch (error) {
    console.error('Error marking print job as completed:', error);
    return res.status(500).json({ 
      message: 'Failed to mark print job as completed', 
      error: error.message 
    });
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
    if (formattedPublicId.endsWith('.pdf')) {
      // Don't add format if the public ID already has .pdf extension
      viewOptions.format = null;
    } else {
      viewOptions.format = 'pdf';
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
        // Remove .pdf extension if it's there to avoid doubling
        const altPublicId = publicId.endsWith('.pdf') ? publicId : `${publicId}.pdf`;
        const altUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/raw/upload/fl_attachment:false/${altPublicId}`;
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

// Print a job directly and mark it as completed
exports.printJobNow = async (req, res) => {
  try {
    const { jobId } = req.params;
    const User = require('../models/User'); // Import User model
    
    // Find the print job
    const printJob = await PrintJob.findById(jobId);
    
    if (!printJob) {
      return res.status(404).json({ message: 'Print job not found' });
    }
    
    // Can only print jobs that are pending or processing
    if (printJob.status !== 'pending' && printJob.status !== 'processing') {
      return res.status(400).json({ 
        message: `Cannot print a job with status: ${printJob.status}` 
      });
    }
    
    // Find the user who owns this print job
    const user = await User.findById(printJob.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Calculate points to deduct
    const pointsToDeduct = printJob.pointsUsed || printJob.printSettings.totalPages || 1;
    
    // Check if user has enough points
    if (user.points < pointsToDeduct) {
      return res.status(400).json({
        message: 'User does not have enough points',
        required: pointsToDeduct,
        available: user.points
      });
    }
    
    // Get the cloudinary public ID and fetch the PDF for printing
    const publicId = printJob.cloudinaryPublicId;
    
    if (!publicId) {
      return res.status(404).json({ message: 'PDF file reference not found' });
    }
    
    // Create a download URL to get the PDF
    const downloadOptions = {
      resource_type: 'raw',
      type: 'upload',
      format: 'pdf',
      secure: true,
      sign_url: true
    };
    
    // Make sure we don't have double extensions in the URL
    let formattedPublicId = publicId;
    if (formattedPublicId.endsWith('.pdf')) {
      // Remove .pdf extension if already present in the public ID
      downloadOptions.format = null; // Don't add format if already in public ID
    }
    
    console.log(`Using Cloudinary public ID for printing: ${formattedPublicId}`);
    const downloadUrl = cloudinary.url(formattedPublicId, downloadOptions);
    console.log(`Generated download URL: ${downloadUrl}`);
    
    try {
      // Fetch the PDF file from Cloudinary
      const pdfResponse = await axios({
        url: downloadUrl,
        method: 'GET',
        responseType: 'arraybuffer',
        timeout: 15000
      });
      
      // Create a temporary file path for the PDF
      const tempFilePath = path.join(os.tmpdir(), `printjob_${jobId}_${Date.now()}.pdf`);
      
      // Write the PDF data to a temporary file
      fs.writeFileSync(tempFilePath, Buffer.from(pdfResponse.data));
      console.log(`PDF saved to temporary file: ${tempFilePath}`);
      
      // Get print settings from the job
      const printOptions = {};
      
      // Apply print settings if available
      if (printJob.printSettings) {
        // Set number of copies
        if (printJob.printSettings.copies > 1) {
          printOptions.copies = printJob.printSettings.copies;
        }
        
        // Set color mode
        if (printJob.printSettings.colorMode === 'bw') {
          printOptions.monochrome = true;
        }
        
        // Set double-sided printing
        if (printJob.printSettings.printBothSides) {
          printOptions.duplex = true;
        }
        
        // Set page range if not "all"
        if (printJob.printSettings.pageRange !== 'all' && printJob.printSettings.customPageRange) {
          printOptions.pages = printJob.printSettings.customPageRange;
        }
        
        // Set orientation
        if (printJob.printSettings.layout === 'landscape') {
          printOptions.landscape = true;
        }
      }
      
      console.log('Printing with options:', printOptions);
      
      try {
        // Detect the operating system
        const platform = os.platform();
        console.log(`Detected platform: ${platform}`);
        
        if (platform === 'darwin') {
          // macOS specific printing using multiple approaches
          let printSuccess = false;
          
          // Approach 1: Using lp command
          console.log('Trying lp command for printing...');
          
          try {
            // Build lp command with options
            let lpCommand = `lp "${tempFilePath}"`;
            
            // Add copies if specified
            if (printOptions.copies) {
              lpCommand += ` -n ${printOptions.copies}`;
            }
            
            // Add orientation if landscape
            if (printOptions.landscape) {
              lpCommand += ` -o landscape`;
            }
            
            // Add duplex if needed
            if (printOptions.duplex) {
              lpCommand += ` -o sides=two-sided-long-edge`;
            }
            
            // Add page ranges if specified
            if (printOptions.pages) {
              lpCommand += ` -o page-ranges=${printOptions.pages}`;
            }
            
            // Add color mode
            if (printOptions.monochrome) {
              lpCommand += ` -o ColorModel=Gray`;
            }
            
            console.log(`Executing lp command: ${lpCommand}`);
            
            // Execute the print command
            const lpResult = await new Promise((resolve) => {
              exec(lpCommand, (error, stdout, stderr) => {
                if (error) {
                  console.error(`lp command error: ${error.message}`);
                  resolve(false);
                } else {
                  if (stderr) console.error(`lp command stderr: ${stderr}`);
                  console.log(`lp command stdout: ${stdout}`);
                  resolve(true);
                }
              });
            });
            
            printSuccess = lpResult;
            if (printSuccess) {
              console.log('Print job sent to printer via lp command successfully');
            } else {
              console.log('lp command did not succeed, trying alternative methods');
            }
          } catch (lpError) {
            console.error('Error with lp command:', lpError);
          }
          
          // Approach 2: Using lpr command if lp failed
          if (!printSuccess) {
            try {
              console.log('Trying lpr command for printing...');
              
              // Build lpr command with options
              let lprCommand = `lpr "${tempFilePath}"`;
              
              // Add copies if specified
              if (printOptions.copies && printOptions.copies > 1) {
                lprCommand += ` -#${printOptions.copies}`;
              }
              
              // Add printer name if we can get it
              const printerName = await new Promise((resolve) => {
                exec('lpstat -d', (error, stdout) => {
                  if (error) {
                    resolve('');
                  } else {
                    const match = stdout.match(/system default destination: (.+)/);
                    resolve(match ? match[1].trim() : '');
                  }
                });
              });
              
              if (printerName) {
                lprCommand += ` -P "${printerName}"`;
              }
              
              await new Promise((resolve) => {
                exec(lprCommand, (error, stdout, stderr) => {
                  if (error) {
                    console.error(`lpr command error: ${error.message}`);
                    resolve(false);
                  } else {
                    if (stderr) console.error(`lpr command stderr: ${stderr}`);
                    console.log(`lpr command stdout: ${stdout}`);
                    console.log('Print job sent via lpr command');
                    printSuccess = true;
                    resolve(true);
                  }
                });
              });
            } catch (lprError) {
              console.error('Error with lpr command:', lprError);
            }
          }
          
          // Approach 3: Open in Preview as last resort
          if (!printSuccess) {
            console.log('Trying open command with Preview...');
            try {
              const openCommand = `open -a "Preview" "${tempFilePath}"`;
              
              await new Promise((resolve) => {
                exec(openCommand, (error, stdout, stderr) => {
                  if (error) {
                    console.error(`open command error: ${error.message}`);
                  } else {
                    if (stderr) console.error(`open command stderr: ${stderr}`);
                    console.log(`open command stdout: ${stdout}`);
                    console.log('PDF opened in Preview for manual printing');
                    printSuccess = true;
                  }
                  resolve();
                });
              });
            } catch (openError) {
              console.error('Error with open command:', openError);
            }
          }
          
          // Wait a moment to ensure printing has started before cleaning up
          await new Promise(resolve => setTimeout(resolve, 3000));
        } else {
          // Use pdf-to-printer for Windows and other platforms
          // Map our print options to pdf-to-printer options
          const pdfToPrinterOptions = {};
          
          // Set printer name if available (leave default if not specified)
          // pdfToPrinterOptions.printer = "Printer Name";
          
          // Set number of copies
          if (printOptions.copies && printOptions.copies > 1) {
            pdfToPrinterOptions.copies = printOptions.copies;
          }
          
          // Set color/monochrome mode
          if (printOptions.monochrome) {
            pdfToPrinterOptions.monochrome = true;
          } else {
            pdfToPrinterOptions.color = true;
          }
          
          // Set orientation
          if (printOptions.landscape) {
            pdfToPrinterOptions.landscape = true;
          } else {
            pdfToPrinterOptions.portrait = true;
          }
          
          // Set duplex printing
          if (printOptions.duplex) {
            pdfToPrinterOptions.duplex = true;
          }
          
          // Set page ranges if specified
          if (printOptions.pages) {
            pdfToPrinterOptions.pages = printOptions.pages;
          }
          
          // Apply any additional options
          if (printOptions.scale) {
            pdfToPrinterOptions.scale = printOptions.scale;
          }
          
          console.log('Printing with pdf-to-printer options:', pdfToPrinterOptions);
          
          await printer.print(tempFilePath, pdfToPrinterOptions);
          console.log('Print job sent to printer via pdf-to-printer');
        }
        
        // Update user's points
        user.points = Math.max(0, user.points - pointsToDeduct);
        await user.save();
        
        // Update print job status
        printJob.status = 'completed';
        await printJob.save();
        
        // Delete the file from Cloudinary
        try {
          if (printJob.cloudinaryPublicId) {
            await cloudinary.uploader.destroy(printJob.cloudinaryPublicId, { resource_type: 'raw' });
          }
        } catch (deleteError) {
          console.error(`Error deleting file from Cloudinary: ${deleteError.message}`);
          // Continue with the response even if file deletion fails
        }
        
        // Send success response
        const response = {
          message: 'Print job sent to printer successfully',
          printJob: {
            id: printJob._id,
            status: printJob.status,
            pointsUsed: pointsToDeduct
          },
          user: {
            id: user._id,
            points: user.points
          }
        };
        
        // Clean up the temporary file after sending the response
        setTimeout(() => {
          fs.unlink(tempFilePath, (err) => {
            if (err) console.error('Error deleting temp file:', err);
            else console.log(`Temporary file deleted: ${tempFilePath}`);
          });
        }, 5000); // Wait 5 seconds before deleting
        
        return res.status(200).json(response);
      } catch (printError) {
        console.error('Error sending to printer:', printError);
        
        // Clean up the temporary file
        fs.unlink(tempFilePath, (err) => {
          if (err) console.error('Error deleting temp file:', err);
        });
        
        return res.status(500).json({ 
          message: 'Failed to print document. Printer error.', 
          error: printError.message 
        });
      }
    } catch (pdfError) {
      console.error('Error fetching PDF for printing:', pdfError);
      // Check if the error is a 404 (Not Found)
      const statusCode = pdfError.response?.status;
      if (statusCode === 404) {
        return res.status(404).json({
          message: 'PDF file not found in cloud storage. It may have been deleted or expired.',
          error: pdfError.message
        });
      }
      return res.status(500).json({ 
        message: 'Failed to fetch PDF for printing', 
        error: pdfError.message 
      });
    }
  } catch (error) {
    console.error('Error printing job:', error);
    return res.status(500).json({ 
      message: 'Failed to print job', 
      error: error.message 
    });
  }
}; 