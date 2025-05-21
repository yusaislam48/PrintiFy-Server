import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Box,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Divider,
  Chip,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  DialogContentText,
  useMediaQuery,
  useTheme,
  Tooltip,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormControl
} from '@mui/material';
import { 
  Search as SearchIcon, 
  Print as PrintIcon, 
  CheckCircle as CheckCircleIcon,
  Close as CloseIcon,
  Download as DownloadIcon,
  OpenInNew as OpenInNewIcon,
  FileDownload as FileDownloadIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  DeleteForever as DeleteForeverIcon,
  LocalPrintshop as LocalPrintshopIcon
} from '@mui/icons-material';
import { printHubAPI } from '../../utils/api';

// Helper function to format date
const formatDate = (dateString) => {
  const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

const PrintHub = () => {
  const [searchValue, setSearchValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [printJobs, setPrintJobs] = useState([]);
  const [studentName, setStudentName] = useState('');
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [selectedJob, setSelectedJob] = useState(null);
  const [userPoints, setUserPoints] = useState(0);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [jobToComplete, setJobToComplete] = useState(null);
  const [printingDialogOpen, setPrintingDialogOpen] = useState(false);
  const [printingStatus, setPrintingStatus] = useState('preparing'); // 'preparing', 'printing', 'success', 'error'
  const [jobToPrint, setJobToPrint] = useState(null);

  // Auto-search when input is valid
  useEffect(() => {
    // Auto-search when input is a valid 7-digit student ID not starting with 0
    if (/^[1-9]\d{6}$/.test(searchValue)) {
      searchPrintJobs();
    }
    // Auto-search when input is a valid RFID (10 digits starting with 0)
    else if (/^0\d{9}$/.test(searchValue)) {
      searchPrintJobs();
    }
  }, [searchValue]);

  // Handle search input change
  const handleSearchValueChange = (e) => {
    const input = e.target.value;
    
    // Allow only digits for both types of IDs
    if (/^\d*$/.test(input)) {
      setSearchValue(input);
      setError('');
    }
  };

  // Search for print jobs
  const searchPrintJobs = async () => {
    if (!searchValue) {
      setError("Please enter a Student ID or RFID Card Number");
      return;
    }

    // Validate input format
    const isStudentId = /^[1-9]\d{6}$/.test(searchValue);
    const isRfidCard = /^0\d{9}$/.test(searchValue);

    if (!isStudentId && !isRfidCard) {
      setError("Invalid format. Student ID should be 7 digits not starting with 0. RFID card should be 10 digits starting with 0.");
      return;
    }

    setLoading(true);
    setError('');
    setErrorMessage('');
    setSuccessMessage('');
    
    try {
      const data = await printHubAPI.findPrintJobsByStudentId(searchValue);
      
      // Log job details for debugging
      if (data.pendingPrintJobs && data.pendingPrintJobs.length > 0) {
        console.log(`Found ${data.pendingPrintJobs.length} jobs for ${isRfidCard ? 'RFID' : 'Student ID'}: ${searchValue}`);
        console.log('Job IDs:', data.pendingPrintJobs.map(job => job._id));
      } else {
        console.log(`No pending jobs found for ${isRfidCard ? 'RFID' : 'Student ID'}: ${searchValue}`);
      }
      
      setPrintJobs(data.pendingPrintJobs || []);
      setStudentName(data.studentName || '');
      setUserPoints(data.userPoints || 0);
      setSearchPerformed(true);
    } catch (err) {
      console.error('Error searching print jobs:', err);
      // More detailed error message
      const errorMessage = err.response?.data?.message || 
                          err.message || 
                          'Failed to find print jobs';
      setError(errorMessage);
      setPrintJobs([]);
      setSearchPerformed(true);
    } finally {
      setLoading(false);
    }
  };

  // Handle key press (Enter)
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      searchPrintJobs();
    }
  };

  // Open confirmation dialog before marking as printed
  const confirmMarkAsPrinted = (job) => {
    setJobToComplete(job);
    setConfirmDialogOpen(true);
  };

  // Handle confirmation dialog close
  const handleConfirmDialogClose = () => {
    setConfirmDialogOpen(false);
    setJobToComplete(null);
  };

  // Mark a job as printed
  const markAsPrinted = async (jobId) => {
    try {
      setErrorMessage('');
      const job = printJobs.find(job => job._id === jobId);
      const pointsNeeded = job?.pointsUsed || job?.printSettings?.totalPages || 0;
      
      // Check if user has enough points before sending request
      if (userPoints < pointsNeeded) {
        setErrorMessage(`Cannot complete print job. Student needs ${pointsNeeded} points but only has ${userPoints} points available.`);
        return;
      }
      
      const response = await printHubAPI.markPrintJobAsCompleted(jobId);
      
      // Update the UI to show it's printed
      setPrintJobs(prevJobs => 
        prevJobs.map(job => 
          job._id === jobId ? { ...job, status: 'completed' } : job
        )
      );
      
      // Update user points
      if (response.user && response.user.points !== undefined) {
        setUserPoints(response.user.points);
      }
      
      // Show success message
      setSuccessMessage(`Print job marked as completed. ${response.printJob.pointsUsed} points deducted. File has been deleted from the server.`);
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      console.error('Error marking job as printed:', err);
      
      // Handle specific error for not enough points
      if (err.response?.data?.message === 'User does not have enough points') {
        const required = err.response.data.required || 0;
        const available = err.response.data.available || 0;
        setErrorMessage(`Cannot complete print job. Student needs ${required} points but only has ${available} points available.`);
      } else {
        // General error
        const errorMessage = err.response?.data?.message || 
                            err.message || 
                            'Failed to mark job as printed';
        setErrorMessage(errorMessage);
      }
    } finally {
      setConfirmDialogOpen(false);
      setJobToComplete(null);
    }
  };

  // Open printing dialog and start print process
  const startPrinting = async (job) => {
    // Show the printing dialog
    setJobToPrint(job);
    setPrintingStatus('preparing');
    setPrintingDialogOpen(true);
    
    try {
      // Check if user has enough points
      const pointsNeeded = job?.pointsUsed || job?.printSettings?.totalPages || 0;
      if (userPoints < pointsNeeded) {
        setPrintingStatus('error');
        setErrorMessage(`Cannot print job. Student needs ${pointsNeeded} points but only has ${userPoints} points available.`);
        return;
      }
      
      // Start the printing process
      setPrintingStatus('printing');
      
      // Call the printNow API function
      const response = await printHubAPI.printNow(job._id);
      
      // Update the UI to show it's printed
      setPrintJobs(prevJobs => 
        prevJobs.map(j => 
          j._id === job._id ? { ...j, status: 'completed' } : j
        )
      );
      
      // Update user points
      if (response.user && response.user.points !== undefined) {
        setUserPoints(response.user.points);
      }
      
      // Set status to success
      setPrintingStatus('success');
      
      // Show success message
      setSuccessMessage(`Print job sent to printer. ${response.printJob.pointsUsed} points deducted.`);
      
      // Automatically close dialog after success
      setTimeout(() => {
        setPrintingDialogOpen(false);
        setJobToPrint(null);
      }, 3000);
      
    } catch (err) {
      console.error('Error printing job:', err);
      setPrintingStatus('error');
      
      // Handle specific error for not enough points
      if (err.response?.data?.message === 'User does not have enough points') {
        const required = err.response.data.required || 0;
        const available = err.response.data.available || 0;
        setErrorMessage(`Cannot print job. Student needs ${required} points but only has ${available} points available.`);
      } 
      // Handle file not found error
      else if (err.response?.status === 404) {
        setErrorMessage(err.response.data?.message || 'PDF file not found. It may have been deleted or expired.');
      }
      else {
        // General error
        const errorMessage = err.response?.data?.message || 
                            err.message || 
                            'Failed to print job';
        setErrorMessage(errorMessage);
      }
    }
  };

  // Close printing dialog
  const handlePrintingDialogClose = () => {
    // Only allow closing if not in the middle of printing
    if (printingStatus !== 'printing') {
      setPrintingDialogOpen(false);
      setJobToPrint(null);
      
      // If there was an error, clear it when dialog closes
      if (printingStatus === 'error') {
        setErrorMessage('');
      }
    }
  };

  // Function to get a proper preview URL for PDFs using the job ID
  const getPreviewUrl = (job) => {
    if (!job) {
      console.error('No job provided to getPreviewUrl');
      return '';
    }
    
    console.log('Getting preview URL for job:', job);
    
    // Use the proxy URL if available - this is the most reliable method
    if (job.proxyUrl) {
      console.log('Using proxy URL:', job.proxyUrl);
      const apiBaseUrl = window.location.origin.replace('5173', '8080');
      const fullUrl = `${apiBaseUrl}${job.proxyUrl}`;
      console.log('Generated full proxy URL:', fullUrl);
      return fullUrl;
    }
    
    // Fallback to direct endpoint if no proxy URL
    console.log('No proxy URL found, using direct endpoint');
    return printHubAPI.getDirectPdfUrl(job._id);
  };
  
  // Function to handle PDF preview
  const handlePreview = async (job) => {
    if (!job) {
      console.error('No job provided to handlePreview');
      return;
    }
    
    console.log('Preview job:', job);
    
    // Set loading state to true when starting preview
    setPdfLoading(true);
    setError(''); // Clear any previous errors
    
    // Store the job for use in the dialog actions
    setSelectedJob(job);
    setPdfPreviewOpen(true); // Open the dialog immediately to show loading
    
    // Get the preview URL
    const url = getPreviewUrl(job);
    console.log(`Final preview URL: ${url}`);
    
    if (!url) {
      setError('Failed to generate PDF view URL');
      setPdfLoading(false);
      return;
    }
    
    // Set the preview URL after we have opened the dialog
    setPreviewUrl(url);
  };
  
  // Function to close the preview
  const handleClosePreview = () => {
    setPdfPreviewOpen(false);
    setPreviewUrl('');
    // Don't immediately clear the selectedJob to avoid UI flicker during closing animation
    setTimeout(() => {
      setSelectedJob(null);
    }, 300);
  };

  // Function to trigger download from the preview
  const handleDownloadFromPreview = () => {
    if (!previewUrl || !selectedJob) return;
    
    setPdfLoading(true);
    
    // Add download=true query parameter to the URL if it doesn't already have it
    const downloadUrl = previewUrl.includes('?') 
      ? `${previewUrl}&download=true` 
      : `${previewUrl}?download=true`;
      
    // Create a temporary link element and follow it
    window.location.href = downloadUrl;
    
    // Set loading to false after a short delay
    setTimeout(() => {
      setPdfLoading(false);
    }, 1000);
  };

  // Check if a job can be printed (user has enough points)
  const canPrintJob = (job) => {
    const pointsNeeded = job?.pointsUsed || job?.printSettings?.totalPages || 0;
    return userPoints >= pointsNeeded;
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={1} sx={{ p: 4, borderRadius: 2, mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          PrintiFy Print Hub
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Search for pending print jobs by entering a Student ID or RFID Card Number
        </Typography>

        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            label="Search"
            variant="outlined"
            value={searchValue}
            onChange={handleSearchValueChange}
            onKeyPress={handleKeyPress}
            placeholder="Enter Student ID (7 digits) or RFID Card Number (10 digits)"
            disabled={loading}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={searchPrintJobs}
                    disabled={loading || (!(/^[1-9]\d{6}$/.test(searchValue) || /^0\d{9}$/.test(searchValue)))}
                  >
                    <SearchIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />

          <Button
            variant="contained"
            onClick={searchPrintJobs}
            disabled={loading || (!(/^[1-9]\d{6}$/.test(searchValue) || /^0\d{9}$/.test(searchValue)))}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SearchIcon />}
            sx={{ mt: 1 }}
          >
            {loading ? 'Searching...' : 'Search Print Jobs'}
          </Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        {searchPerformed && !error && (
          <Box sx={{ mt: 2 }}>
            {printJobs.length > 0 ? (
              <>
                <Alert severity="success" sx={{ mb: 3 }}>
                  Found {printJobs.length} pending print job(s) for {studentName}
                </Alert>
                
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  mb: 2, 
                  p: 2, 
                  bgcolor: 'primary.light', 
                  color: 'primary.contrastText',
                  borderRadius: 1
                }}>
                  <Typography variant="h6" sx={{ mr: 1 }}>
                    Available Points:
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {userPoints}
                  </Typography>
                </Box>
                
                {successMessage && (
                  <Alert severity="success" sx={{ mb: 2 }}>
                    {successMessage}
                  </Alert>
                )}
                
                {errorMessage && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {errorMessage}
                  </Alert>
                )}
                
                <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2 }}>
                  Pending Print Jobs
                </Typography>
                
                <Grid container spacing={3}>
                  {printJobs.map((job) => {
                    const pointsNeeded = job.pointsUsed || job.printSettings?.totalPages || 0;
                    const hasEnoughPoints = userPoints >= pointsNeeded;
                    
                    return (
                    <Grid item xs={12} key={job._id}>
                      <Card 
                        variant="outlined" 
                        sx={{ 
                          borderLeft: '4px solid #1976d2',
                          '&:hover': { boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }
                        }}
                      >
                        <CardContent>
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="h6" component="div">
                              {job.fileName}
                            </Typography>
                            <Chip 
                              label={job.status} 
                              color={
                                job.status === 'pending' ? 'primary' : 
                                job.status === 'completed' ? 'success' : 'default'
                              }
                              size="small"
                            />
                          </Box>
                          
                          <Typography color="text.secondary" sx={{ mt: 1 }}>
                            Uploaded: {formatDate(job.createdAt)}
                          </Typography>
                          
                          <Divider sx={{ my: 2 }} />
                          
                          <Grid container spacing={2}>
                            <Grid item xs={12} sm={6} md={4}>
                              <Typography variant="body2">
                                <strong>Copies:</strong> {job.printSettings?.copies || 1}
                              </Typography>
                              <Typography variant="body2">
                                <strong>Paper Size:</strong> {(job.printSettings?.paperSize || 'a4').toUpperCase()}
                              </Typography>
                              <Typography variant="body2">
                                <strong>Layout:</strong> {(job.printSettings?.layout || 'portrait')}
                              </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6} md={4}>
                              <Typography variant="body2">
                                <strong>Color Mode:</strong> {job.printSettings?.colorMode === 'color' ? 'Color' : 'Black & White'}
                              </Typography>
                              <Typography variant="body2">
                                <strong>Double-sided:</strong> {job.printSettings?.printBothSides ? 'Yes' : 'No'}
                              </Typography>
                              <Typography variant="body2">
                                <strong>Total Pages:</strong> {job.printSettings?.totalPages || 'N/A'}
                              </Typography>
                            </Grid>
                            <Grid item xs={12} sm={12} md={4}>
                              <Box sx={{ 
                                p: 1.5, 
                                bgcolor: hasEnoughPoints ? 'success.light' : 'error.light',
                                borderRadius: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}>
                                <Typography variant="body2" fontWeight="bold" color={hasEnoughPoints ? 'success.dark' : 'error.dark'}>
                                  Points Required:
                                </Typography>
                                <Typography variant="h5" fontWeight="bold" color={hasEnoughPoints ? 'success.dark' : 'error.dark'}>
                                  {pointsNeeded}
                                </Typography>
                                {!hasEnoughPoints && (
                                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                    <WarningIcon color="error" fontSize="small" sx={{ mr: 0.5 }} />
                                    <Typography variant="caption" color="error.dark">
                                      Not enough points
                                    </Typography>
                                  </Box>
                                )}
                              </Box>
                            </Grid>
                          </Grid>
                        </CardContent>
                        
                        <CardActions sx={{ px: 2, pb: 2 }}>
                          {job.status === 'pending' && (
                            <>
                              <Tooltip title={!hasEnoughPoints ? `Student needs ${pointsNeeded} points but only has ${userPoints}` : "Print job now on default printer"}>
                                <span> {/* Wrapper needed for disabled buttons with Tooltip */}
                                  <Button 
                                    variant="contained" 
                                    color="primary"
                                    startIcon={<LocalPrintshopIcon />}
                                    onClick={() => startPrinting(job)}
                                    disabled={!hasEnoughPoints}
                                    sx={{ mr: 2 }}
                                  >
                                    Print Now
                                  </Button>
                                </span>
                              </Tooltip>
                              
                              <Tooltip title={!hasEnoughPoints ? `Student needs ${pointsNeeded} points but only has ${userPoints}` : "Mark as printed (file will be deleted)"}>
                                <span> {/* Wrapper needed for disabled buttons with Tooltip */}
                                  <Button 
                                    variant="contained" 
                                    color="success"
                                    startIcon={<CheckCircleIcon />}
                                    onClick={() => confirmMarkAsPrinted(job)}
                                    disabled={!hasEnoughPoints}
                                  >
                                    Mark as Printed
                                  </Button>
                                </span>
                              </Tooltip>
                            </>
                          )}
                          
                          {job.status !== 'pending' && (
                            <Chip 
                              icon={<PrintIcon />} 
                              label="Printed" 
                              color="success" 
                              variant="outlined" 
                            />
                          )}
                          
                          <Button 
                            variant="outlined" 
                            startIcon={<PrintIcon />}
                            onClick={() => handlePreview(job)}
                            sx={{ ml: job.status === 'pending' ? 2 : 0 }}
                          >
                            View PDF
                          </Button>
                          
                          <Tooltip title="View print job details">
                            <IconButton color="primary" sx={{ ml: 1 }}>
                              <InfoIcon />
                            </IconButton>
                          </Tooltip>
                        </CardActions>
                      </Card>
                    </Grid>
                  )})}
                </Grid>
              </>
            ) : (
              <Typography variant="body1" align="center" color="text.secondary">
                No pending print jobs found for {/^0\d{9}$/.test(searchValue) ? `RFID Card: ${searchValue}` : `Student ID: ${searchValue}`}
              </Typography>
            )}
          </Box>
        )}
      </Paper>
      
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Typography variant="body2" color="text.secondary">
          PrintiFy Print Hub - Manage printing efficiently
        </Typography>
      </Box>

      {/* PDF Preview Dialog */}
      <Dialog
        open={pdfPreviewOpen}
        onClose={handleClosePreview}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { height: '85vh', maxHeight: '85vh' }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            {selectedJob?.fileName || 'PDF Preview'}
          </Typography>
          <IconButton edge="end" color="inherit" onClick={handleClosePreview} aria-label="close">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ padding: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
          {previewUrl ? (
            <Box sx={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
              {/* Loading indicator */}
              <Box 
                sx={{ 
                  position: 'absolute', 
                  top: 0, 
                  left: 0, 
                  right: 0, 
                  bottom: 0, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  bgcolor: 'rgba(255,255,255,0.7)',
                  zIndex: 2,
                  opacity: pdfLoading ? 1 : 0,
                  transition: 'opacity 0.3s ease',
                  pointerEvents: pdfLoading ? 'auto' : 'none'
                }}
              >
                <CircularProgress />
              </Box>
              
              {/* Error display */}
              {error && (
                <Box 
                  sx={{ 
                    position: 'absolute', 
                    top: 0, 
                    left: 0, 
                    right: 0, 
                    bottom: 0, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    bgcolor: 'rgba(255,255,255,0.9)',
                    zIndex: 3,
                    flexDirection: 'column',
                    p: 3
                  }}
                >
                  <Typography color="error" variant="h6" gutterBottom>
                    Error Loading PDF
                  </Typography>
                  <Typography color="error" variant="body1" align="center">
                    {error}
                  </Typography>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    onClick={() => window.open(previewUrl, '_blank')}
                    sx={{ mt: 2 }}
                  >
                    Try Opening in New Tab
                  </Button>
                </Box>
              )}
              
              {/* PDF iframe */}
              <iframe
                key={previewUrl}
                src={previewUrl}
                title="PDF Preview"
                width="100%"
                height="100%"
                style={{ 
                  border: 'none',
                  display: 'block'
                }}
                onLoad={() => {
                  console.log('PDF iframe loaded');
                  setPdfLoading(false);
                }}
                onError={(e) => {
                  console.error('PDF iframe error:', e);
                  setPdfLoading(false);
                  setError('Failed to load the PDF. The file might be corrupted or inaccessible.');
                }}
              />
            </Box>
          ) : (
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                height: '100%',
                flexDirection: 'column' 
              }}
            >
              <Typography variant="body1" gutterBottom>No PDF selected for preview.</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            startIcon={<FileDownloadIcon />}
            onClick={handleDownloadFromPreview}
            disabled={pdfLoading || !previewUrl}
          >
            Download
          </Button>
          <Button 
            startIcon={<OpenInNewIcon />}
            onClick={() => previewUrl && window.open(previewUrl, '_blank', 'noopener,noreferrer')}
            disabled={!previewUrl}
          >
            Open in New Tab
          </Button>
          <Button 
            onClick={handleClosePreview}
            variant="outlined"
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={handleConfirmDialogClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {"Confirm Print Job Completion"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to mark this job as printed? This will:
            <Box component="ul" sx={{ mt: 1 }}>
              <li>Deduct {jobToComplete?.pointsUsed || jobToComplete?.printSettings?.totalPages || 0} points from the student's account</li>
              <li>Mark the job as completed</li>
              <li>Delete the PDF file from the server</li>
            </Box>
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleConfirmDialogClose} color="primary">
            Cancel
          </Button>
          <Button 
            onClick={() => markAsPrinted(jobToComplete?._id)} 
            color="error" 
            variant="contained"
            startIcon={<DeleteForeverIcon />}
            autoFocus
          >
            Complete & Delete
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Printing Dialog */}
      <Dialog
        open={printingDialogOpen}
        onClose={handlePrintingDialogClose}
        aria-labelledby="printing-dialog-title"
        aria-describedby="printing-dialog-description"
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle id="printing-dialog-title" sx={{ textAlign: 'center' }}>
          {printingStatus === 'preparing' && "Preparing to Print"}
          {printingStatus === 'printing' && "Printing in Progress"}
          {printingStatus === 'success' && "Print Job Completed"}
          {printingStatus === 'error' && "Print Error"}
        </DialogTitle>
        <DialogContent sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          p: 4
        }}>
          {(printingStatus === 'preparing' || printingStatus === 'printing') && (
            <CircularProgress size={60} sx={{ mb: 3 }} />
          )}
          
          {printingStatus === 'success' && (
            <CheckCircleIcon color="success" sx={{ fontSize: 60, mb: 3 }} />
          )}
          
          {printingStatus === 'error' && (
            <WarningIcon color="error" sx={{ fontSize: 60, mb: 3 }} />
          )}
          
          <Typography variant="h6" gutterBottom align="center">
            {jobToPrint?.fileName}
          </Typography>
          
          <DialogContentText id="printing-dialog-description" sx={{ textAlign: 'center', mt: 1 }}>
            {printingStatus === 'preparing' && "Preparing your document for printing..."}
            {printingStatus === 'printing' && (
              <>
                <p>Sending the document to your default printer...</p>
                <p>Please wait while the document is being processed.</p>
              </>
            )}
            {printingStatus === 'success' && (
              <>
                <p>Your document has been successfully sent to the printer!</p>
                <p>Check your printer for the printed document.</p>
              </>
            )}
            {printingStatus === 'error' && "There was an error printing your document."}
          </DialogContentText>
          
          {printingStatus === 'success' && (
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                {jobToPrint?.pointsUsed || jobToPrint?.printSettings?.totalPages || 0} points have been deducted from the student's account.
              </Typography>
            </Box>
          )}
          
          {printingStatus === 'error' && errorMessage && (
            <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
              {errorMessage}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handlePrintingDialogClose} 
            disabled={printingStatus === 'printing'}
            variant="outlined"
          >
            {printingStatus === 'success' ? 'Close' : 
             printingStatus === 'error' ? 'Close' : 'Cancel'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default PrintHub; 