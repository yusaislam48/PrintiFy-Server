const PrintJob = require('../models/PrintJob');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const printer = require('pdf-to-printer');
const os = require('os');
const { exec } = require('child_process');

// Handle PDF upload to VPS storage
exports.uploadPDF = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No PDF file uploaded' });
    }

    const userId = req.user.id;
    const filePath = req.file.path;
    const fileName = req.file.filename;
    const fileSize = req.file.size;

    // Generate URLs for file access
    const relativePath = path.relative(path.join(__dirname, '../storage/pdfs'), filePath);
    const pathParts = relativePath.split(path.sep); // [year, month, day, filename]
    const fileUrl = `/api/print/files/pdf/${pathParts.join('/')}`;
    const downloadUrl = `/api/print/files/download/${pathParts.join('/')}`;

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

    // Set deletion time (72 hours from now)
    const deleteAfter = new Date();
    deleteAfter.setHours(deleteAfter.getHours() + 72);

    // Create a new print job in database
    const printJob = new PrintJob({
      userId,
      fileName: req.file.originalname,
      fileUrl: fileUrl,
      proxyUrl: downloadUrl,
      localFilePath: filePath,
      fileSize: fileSize,
      deleteAfter: deleteAfter,
      pointsUsed: pointsNeeded,
      printSettings,
      status: 'pending'
    });

    await printJob.save();

    return res.status(201).json({
      message: 'PDF uploaded successfully',
      printJob: {
        id: printJob._id,
        fileName: printJob.fileName,
        fileUrl: printJob.fileUrl,
        proxyUrl: printJob.proxyUrl,
        status: printJob.status,
        createdAt: printJob.createdAt,
        printSettings: printJob.printSettings,
        pointsUsed: printJob.pointsUsed
      }
    });
  } catch (error) {
    console.error('PDF upload error:', error);
    
    // Delete temp file if it exists
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting temp file:', err);
      });
    }
    
    return res.status(500).json({ message: 'Failed to upload PDF', error: error.message });
  }
};

// Get all print jobs for a user
exports.getPrintJobs = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const totalJobs = await PrintJob.countDocuments({ userId });

    // Get print jobs with pagination, sorted by creation date (newest first)
    const printJobs = await PrintJob.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-localFilePath'); // Don't expose file paths

    const totalPages = Math.ceil(totalJobs / limit);

    // Add URLs to each job for frontend access
    const jobsWithUrls = printJobs.map(job => {
      const jobObject = job.toObject();
      return {
        ...jobObject,
        fileUrl: jobObject.fileUrl,
        downloadUrl: jobObject.proxyUrl
      };
    });

    res.json({
      success: true,
      printJobs: jobsWithUrls,
      pagination: {
        currentPage: page,
        totalPages,
        totalJobs,
        hasMore: page < totalPages
      }
    });
  } catch (error) {
    console.error('Error fetching print jobs:', error);
    res.status(500).json({ message: 'Failed to fetch print jobs', error: error.message });
  }
};

// Download a PDF file directly
exports.downloadPDF = async (req, res) => {
  try {
    const { year, month, day, filename } = req.params;
    const relativePath = path.join(year, month, day, filename);
    const filePath = path.join(__dirname, '../storage/pdfs', relativePath);
    
    // Security check - ensure the file is within our storage directory
    const resolvedPath = path.resolve(filePath);
    const storageDir = path.resolve(path.join(__dirname, '../storage/pdfs'));
    if (!resolvedPath.startsWith(storageDir)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Get file stats
    const stats = fs.statSync(filePath);

    // Set headers for download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', stats.size);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

  } catch (error) {
    console.error('Error downloading PDF:', error);
    return res.status(500).json({ message: 'Failed to download PDF', error: error.message });
  }
};

// View a PDF file in the browser
exports.viewPDF = async (req, res) => {
  try {
    const { year, month, day, filename } = req.params;
    const relativePath = path.join(year, month, day, filename);
    const filePath = path.join(__dirname, '../storage/pdfs', relativePath);
    
    // Security check - ensure the file is within our storage directory
    const resolvedPath = path.resolve(filePath);
    const storageDir = path.resolve(path.join(__dirname, '../storage/pdfs'));
    if (!resolvedPath.startsWith(storageDir)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Get file stats
    const stats = fs.statSync(filePath);

    // Set headers for viewing in browser
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', stats.size);
    res.setHeader('Content-Disposition', 'inline');
    
    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

  } catch (error) {
    console.error('Error viewing PDF:', error);
    return res.status(500).json({ message: 'Failed to view PDF', error: error.message });
  }
};

// View a PDF file publicly without authentication
exports.viewPublicPDF = async (req, res) => {
  try {
    const { jobId } = req.params;
    
    console.log(`Attempting to view PDF for job: ${jobId}`);
    
    // Find the print job by ID (no user restriction for public view)
    const printJob = await PrintJob.findById(jobId);
    
    if (!printJob) {
      return res.status(404).json({ message: 'Print job not found' });
    }

    // Check if file exists
    if (!fs.existsSync(printJob.localFilePath)) {
      return res.status(404).json({ message: 'PDF file not found' });
    }

    // Get file stats
    const stats = fs.statSync(printJob.localFilePath);

    // Set headers for viewing
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', stats.size);
    res.setHeader('Content-Disposition', 'inline');
    
    // Stream the file
    const fileStream = fs.createReadStream(printJob.localFilePath);
    fileStream.pipe(res);

  } catch (error) {
    console.error('Error viewing public PDF:', error);
    return res.status(500).json({ message: 'Failed to view PDF', error: error.message });
  }
};

// Print a PDF file
exports.printPDF = async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.user.id;

    // Find the print job
    const printJob = await PrintJob.findOne({ _id: jobId, userId });

    if (!printJob) {
      return res.status(404).json({ message: 'Print job not found' });
    }

    // Check if the file exists
    if (!fs.existsSync(printJob.localFilePath)) {
      return res.status(404).json({ message: 'PDF file not found' });
    }

    // Update print job status
    printJob.status = 'processing';
    await printJob.save();

    // Get print options from request body or use defaults from printJob
    const printOptions = {
      copies: req.body.copies || printJob.printSettings.copies || 1,
      paperSize: req.body.paperSize || printJob.printSettings.paperSize || 'a4',
      colorMode: req.body.colorMode || printJob.printSettings.colorMode || 'color',
      orientation: req.body.orientation || printJob.printSettings.layout || 'portrait',
      duplex: req.body.duplex || printJob.printSettings.printBothSides || false,
      pages: req.body.pages || printJob.printSettings.customPageRange || 'all'
    };

    console.log(`Printing PDF: ${printJob.localFilePath}`);
    console.log('Print options:', printOptions);

    try {
      // Handle printing based on platform
      if (process.platform === 'darwin') {
        // macOS - use lpr command or open with Preview
        const printCommand = `lpr -P "Default" "${printJob.localFilePath}"`;
        
        exec(printCommand, (error, stdout, stderr) => {
          if (error) {
            console.log('Direct print failed, opening in Preview:', error.message);
            // Fallback: open in Preview for manual printing
            exec(`open "${printJob.localFilePath}"`, (openError) => {
              if (openError) {
                console.error('Failed to open in Preview:', openError);
              } else {
                console.log('PDF opened in Preview for manual printing');
              }
            });
          } else {
            console.log('Print command executed successfully');
          }
        });
      } else {
        // Windows/Linux - use pdf-to-printer
        const pdfToPrinterOptions = {};

        if (printOptions.copies > 1) {
          pdfToPrinterOptions.copies = printOptions.copies;
        }

        if (printOptions.colorMode === 'bw') {
          pdfToPrinterOptions.monochrome = true;
        } else {
          pdfToPrinterOptions.color = true;
        }

        if (printOptions.orientation === 'landscape') {
          pdfToPrinterOptions.landscape = true;
        } else {
          pdfToPrinterOptions.portrait = true;
        }

        if (printOptions.duplex) {
          pdfToPrinterOptions.duplex = true;
        }

        if (printOptions.pages && printOptions.pages !== 'all') {
          pdfToPrinterOptions.pages = printOptions.pages;
        }

        console.log('Printing with pdf-to-printer options:', pdfToPrinterOptions);

        await printer.print(printJob.localFilePath, pdfToPrinterOptions);
        console.log('Print job sent to printer via pdf-to-printer');
      }

      // Update job status to completed
      printJob.status = 'completed';
      printJob.updatedAt = new Date();
      await printJob.save();

      // Delete the file immediately after printing
      if (fs.existsSync(printJob.localFilePath)) {
        fs.unlink(printJob.localFilePath, (err) => {
          if (err) {
            console.error('Error deleting file after printing:', err);
          } else {
            console.log('File deleted successfully after printing');
          }
        });
      }

      // Remove the print job from database as well
      await PrintJob.findByIdAndDelete(jobId);

      res.json({
        success: true,
        message: 'Print job completed successfully',
        printJob: {
          id: printJob._id,
          status: 'completed',
          fileName: printJob.fileName
        }
      });

    } catch (printError) {
      console.error('Print execution error:', printError);
      
      // Update job status to failed
      printJob.status = 'failed';
      await printJob.save();

      res.status(500).json({
        success: false,
        message: 'Failed to print PDF',
        error: printError.message
      });
    }

  } catch (error) {
    console.error('Error in printPDF:', error);
    res.status(500).json({ message: 'Failed to process print request', error: error.message });
  }
};

// Delete a print job and its associated file
exports.deletePrintJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.user.id;

    // Find the print job
    const printJob = await PrintJob.findOne({ _id: jobId, userId });

    if (!printJob) {
      return res.status(404).json({ message: 'Print job not found' });
    }

    // Delete the file if it exists
    if (fs.existsSync(printJob.localFilePath)) {
      try {
        fs.unlinkSync(printJob.localFilePath);
        console.log(`Deleted file: ${printJob.localFilePath}`);
      } catch (deleteError) {
        console.error(`Error deleting file: ${deleteError.message}`);
      }
    }

    // Delete the print job from database
    await PrintJob.findByIdAndDelete(jobId);

    res.json({
      success: true,
      message: 'Print job deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting print job:', error);
    res.status(500).json({ message: 'Failed to delete print job', error: error.message });
  }
};

// Cleanup expired files (called periodically)
exports.cleanupExpiredFiles = async () => {
  try {
    console.log('Starting cleanup of expired files...');
    
    // Find all expired print jobs
    const expiredJobs = await PrintJob.find({
      deleteAfter: { $lte: new Date() }
    });

    console.log(`Found ${expiredJobs.length} expired jobs`);

    for (const job of expiredJobs) {
      try {
        // Delete the file if it exists
        if (fs.existsSync(job.localFilePath)) {
          fs.unlinkSync(job.localFilePath);
          console.log(`Deleted expired file: ${job.localFilePath}`);
        }

        // Delete the job from database
        await PrintJob.findByIdAndDelete(job._id);
        console.log(`Deleted expired job: ${job._id}`);

      } catch (deleteError) {
        console.error(`Error cleaning up job ${job._id}:`, deleteError);
      }
    }

    console.log('Cleanup completed');

  } catch (error) {
    console.error('Error during cleanup:', error);
  }
};

// Get print jobs for a specific user (by user ID)
exports.getUserPrintJobs = exports.getPrintJobs;

// Get a specific print job
exports.getPrintJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.user.id;
    
    // Find the print job
    const printJob = await PrintJob.findOne({ _id: jobId, userId })
      .select('-localFilePath'); // Don't expose file paths
    
    if (!printJob) {
      return res.status(404).json({ message: 'Print job not found' });
    }

    res.json({
      success: true,
      printJob
    });
  } catch (error) {
    console.error('Error fetching print job:', error);
    res.status(500).json({ message: 'Failed to fetch print job', error: error.message });
  }
};

// Cancel a print job
exports.cancelPrintJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.user.id;

    // Find the print job
    const printJob = await PrintJob.findOne({ _id: jobId, userId });

    if (!printJob) {
      return res.status(404).json({ message: 'Print job not found' });
    }

    if (printJob.status === 'completed') {
      return res.status(400).json({ message: 'Cannot cancel completed print job' });
    }

    // Delete the file if it exists
    if (printJob.localFilePath && fs.existsSync(printJob.localFilePath)) {
      try {
        fs.unlinkSync(printJob.localFilePath);
        console.log(`Deleted file: ${printJob.localFilePath}`);
      } catch (deleteError) {
        console.error(`Error deleting file: ${deleteError.message}`);
      }
    }

    // Update job status
    printJob.status = 'cancelled';
    printJob.updatedAt = new Date();
    await printJob.save();

    res.json({
      success: true,
      message: 'Print job cancelled and file deleted successfully',
      printJob: {
        id: printJob._id,
        status: printJob.status
      }
    });

  } catch (error) {
    console.error('Error cancelling print job:', error);
    res.status(500).json({ message: 'Failed to cancel print job', error: error.message });
  }
};

// Find print jobs by student ID (public endpoint)
exports.findPrintJobsByStudentId = async (req, res) => {
  try {
    const { studentId } = req.params;
    
    // Find user by student ID
    const User = require('../models/User');
    const user = await User.findOne({ studentId });
    
    if (!user) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Find print jobs for this user
    const printJobs = await PrintJob.find({ userId: user._id })
      .select('-localFilePath -userId') // Don't expose sensitive data
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      printJobs,
      student: {
        name: user.name,
        studentId: user.studentId
      }
    });
  } catch (error) {
    console.error('Error finding print jobs by student ID:', error);
    res.status(500).json({ message: 'Failed to find print jobs', error: error.message });
  }
};

// Mark print job as completed (public endpoint for booth managers)
exports.markPrintJobAsCompleted = async (req, res) => {
  try {
    const { jobId } = req.params;
    
    // Find the print job
    const printJob = await PrintJob.findById(jobId);
    
    if (!printJob) {
      return res.status(404).json({ message: 'Print job not found' });
    }

    // Update job status
    printJob.status = 'completed';
    printJob.updatedAt = new Date();
    await printJob.save();

    // Delete the file after marking as completed
    if (fs.existsSync(printJob.localFilePath)) {
      fs.unlink(printJob.localFilePath, (err) => {
        if (err) {
          console.error('Error deleting file after completion:', err);
        } else {
          console.log('File deleted successfully after completion');
        }
      });
    }

    // Remove the print job from database
    await PrintJob.findByIdAndDelete(jobId);

    res.json({
      success: true,
      message: 'Print job marked as completed and file deleted'
    });

  } catch (error) {
    console.error('Error marking print job as completed:', error);
    res.status(500).json({ message: 'Failed to mark print job as completed', error: error.message });
  }
};

// Print job now (public endpoint for booth managers)
exports.printJobNow = async (req, res) => {
  try {
    const { jobId } = req.params;
    
    // Find the print job
    const printJob = await PrintJob.findById(jobId);
    
    if (!printJob) {
      return res.status(404).json({ message: 'Print job not found' });
    }

    // Check if the file exists
    if (!fs.existsSync(printJob.localFilePath)) {
      return res.status(404).json({ message: 'PDF file not found' });
    }

    // Update print job status
    printJob.status = 'processing';
    await printJob.save();

    try {
      // Handle printing based on platform
      if (process.platform === 'darwin') {
        // macOS - use lpr command or open with Preview
        const printCommand = `lpr -P "Default" "${printJob.localFilePath}"`;
        
        exec(printCommand, (error, stdout, stderr) => {
          if (error) {
            console.log('Direct print failed, opening in Preview:', error.message);
            // Fallback: open in Preview for manual printing
            exec(`open "${printJob.localFilePath}"`, (openError) => {
              if (openError) {
                console.error('Failed to open in Preview:', openError);
              } else {
                console.log('PDF opened in Preview for manual printing');
              }
            });
          } else {
            console.log('Print command executed successfully');
          }
        });
      } else {
        // Windows/Linux - use pdf-to-printer
        await printer.print(printJob.localFilePath);
        console.log('Print job sent to printer via pdf-to-printer');
      }

      // Update job status to completed
      printJob.status = 'completed';
      printJob.updatedAt = new Date();
      await printJob.save();

      // Delete the file after printing
      if (fs.existsSync(printJob.localFilePath)) {
        fs.unlink(printJob.localFilePath, (err) => {
          if (err) {
            console.error('Error deleting file after printing:', err);
          } else {
            console.log('File deleted successfully after printing');
          }
        });
      }

      // Remove the print job from database
      await PrintJob.findByIdAndDelete(jobId);

      res.json({
        success: true,
        message: 'Print job completed successfully and file deleted'
      });

    } catch (printError) {
      console.error('Print execution error:', printError);
      
      // Update job status to failed
      printJob.status = 'failed';
      await printJob.save();

      res.status(500).json({
        success: false,
        message: 'Failed to print PDF',
        error: printError.message
      });
    }

  } catch (error) {
    console.error('Error in printJobNow:', error);
    res.status(500).json({ message: 'Failed to process print request', error: error.message });
  }
};

module.exports = exports;