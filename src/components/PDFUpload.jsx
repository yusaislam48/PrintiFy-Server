import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Paper, 
  TextField, 
  Grid, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  CircularProgress,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormGroup,
  FormControlLabel,
  Checkbox,
  IconButton
} from '@mui/material';
import { CloudUpload, Print, Close } from '@mui/icons-material';
import { Document, Page, pdfjs } from 'react-pdf';
import { printAPI } from '../utils/api';

// Need to set up PDF.js worker source
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url,
).toString();

const PDFUpload = ({ onUploadSuccess }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [uploadedFileUrl, setUploadedFileUrl] = useState(null);
  
  // Printing settings
  const [printSettings, setPrintSettings] = useState({
    copies: 1,
    pageRange: 'all', // 'all' or 'custom'
    customPageRange: '',
    layout: 'portrait', // 'portrait' or 'landscape'
    printBothSides: false,
    paperSize: 'a4', // 'a4', 'a3', 'letter', etc.
    colorMode: 'color', // 'color' or 'bw'
  });

  // Handle file select
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setFilePreview(URL.createObjectURL(file));
      // Reset page viewing
      setPageNumber(1);
      // Reset any previous upload state
      setUploadSuccess(false);
      setUploadError(null);
    } else {
      setUploadError('Please select a valid PDF file.');
      setSelectedFile(null);
      setFilePreview(null);
    }
  };

  // On document load success
  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  // Handle printing settings change
  const handleSettingsChange = (event) => {
    const { name, value, checked, type } = event.target;
    setPrintSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle upload
  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadError('Please select a file to upload.');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('pdfFile', selectedFile);
      
      // Add printing settings to formData
      Object.keys(printSettings).forEach(key => {
        formData.append(key, printSettings[key]);
      });

      const response = await printAPI.uploadPDF(formData, (progressEvent) => {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(progress);
      });

      setUploading(false);
      setUploadSuccess(true);
      console.log('Upload successful:', response);
      
      // Store the uploaded file URL to display it
      if (response.printJob) {
        // Use the proxy URL for better CORS compatibility
        if (response.printJob.proxyUrl) {
          setUploadedFileUrl(response.printJob.proxyUrl);
          setFilePreview(response.printJob.proxyUrl);
        } else if (response.printJob.fileUrl) {
          setUploadedFileUrl(response.printJob.fileUrl);
          setFilePreview(response.printJob.fileUrl);
        }
        
        // Call the onUploadSuccess callback if provided
        if (onUploadSuccess && typeof onUploadSuccess === 'function') {
          onUploadSuccess();
        }
      }
      
      // Reset file selection state after 3 seconds but keep the uploaded file display
      setTimeout(() => {
        setSelectedFile(null);
        setUploadSuccess(false);
      }, 3000);
      
    } catch (error) {
      setUploading(false);
      setUploadError(error.message || 'Failed to upload PDF file.');
      console.error('Upload error:', error);
    }
  };

  // Close alerts
  const handleCloseAlert = () => {
    setUploadError(null);
    setUploadSuccess(false);
  };

  // Cleanup object URL on unmount
  useEffect(() => {
    return () => {
      if (filePreview) {
        URL.revokeObjectURL(filePreview);
      }
    };
  }, [filePreview]);

  // Helper function to download PDF directly
  const handleDownloadPDF = () => {
    if (uploadedFileUrl) {
      // Create an anchor and trigger download
      const link = document.createElement('a');
      link.href = uploadedFileUrl;
      link.setAttribute('download', selectedFile?.name || 'document.pdf');
      link.setAttribute('target', '_blank');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
      <Typography variant="h5" gutterBottom>
        Upload PDF for Printing
      </Typography>

      {/* File Selection Area */}
      <Box
        sx={{
          border: '2px dashed #ccc',
          borderRadius: 2,
          p: 3,
          mb: 3,
          textAlign: 'center',
          bgcolor: '#f8f8f8',
          cursor: 'pointer',
          '&:hover': {
            bgcolor: '#f0f0f0',
          },
        }}
        onClick={() => document.getElementById('pdf-upload-input').click()}
      >
        <input
          id="pdf-upload-input"
          type="file"
          accept="application/pdf"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        <CloudUpload sx={{ fontSize: 48, mb: 1, color: 'primary.main' }} />
        <Typography variant="body1" gutterBottom>
          Click to select or drop your PDF file here
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Supports PDF files only
        </Typography>
      </Box>

      {/* File Preview */}
      {filePreview && (
        <Box sx={{ mb: 3, textAlign: 'center' }}>
          <Typography variant="subtitle1" gutterBottom>
            {selectedFile?.name || 'Uploaded PDF'}
          </Typography>
          
          {/* PDF Viewer using iframe with PDF.js fallback */}
          <Box 
            sx={{ 
              border: '1px solid #ddd', 
              borderRadius: 1, 
              overflow: 'hidden',
              height: '500px', 
              position: 'relative'
            }}
          >
            {/* Primary PDF viewer - direct iframe */}
            <iframe
              src={uploadedFileUrl ? 
                // For uploaded files, use Google Docs Viewer as a fallback
                `https://docs.google.com/viewer?url=${encodeURIComponent(uploadedFileUrl)}&embedded=true` : 
                // For local files, use the blob URL directly
                filePreview
              }
              title="PDF Viewer"
              width="100%"
              height="100%"
              style={{ border: 'none' }}
              allowFullScreen
            />
            
            {/* Fallback message if iframe fails */}
            <Box 
              sx={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'rgba(255,255,255,0.9)',
                zIndex: -1
              }}
            >
              <Typography color="error" gutterBottom>
                Failed to load PDF
              </Typography>
              <Typography variant="body2">
                This might be due to CORS restrictions or file access issues.
              </Typography>
              <Box sx={{ display: 'flex', mt: 2, gap: 2 }}>
                <Button 
                  variant="contained" 
                  onClick={handleDownloadPDF}
                >
                  Download PDF
                </Button>
                <Button 
                  variant="outlined"
                  component="a"
                  href={uploadedFileUrl || filePreview}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open in New Tab
                </Button>
              </Box>
            </Box>
          </Box>
          
          {/* PDF Controls */}
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 2 }}>
            <Button 
              variant="outlined" 
              color="primary"
              onClick={handleDownloadPDF}
              disabled={!uploadedFileUrl && !filePreview}
            >
              Download PDF
            </Button>
            {(uploadedFileUrl || filePreview) && (
              <Button 
                variant="outlined" 
                color="secondary"
                sx={{ ml: 2 }}
                component="a"
                href={uploadedFileUrl || filePreview}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open in New Tab
              </Button>
            )}
          </Box>
        </Box>
      )}

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Print />}
          onClick={() => setShowSettings(true)}
          disabled={!selectedFile || uploading}
        >
          Configure Printing Settings
        </Button>
        <Button
          variant="contained"
          color="success"
          startIcon={<CloudUpload />}
          onClick={handleUpload}
          disabled={!selectedFile || uploading}
        >
          {uploading ? 'Uploading...' : 'Upload and Print'}
        </Button>
      </Box>

      {/* Upload Progress */}
      {uploading && (
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <CircularProgress variant="determinate" value={uploadProgress} />
          <Typography variant="body2" sx={{ mt: 1 }}>
            Uploading: {uploadProgress}%
          </Typography>
        </Box>
      )}

      {/* Print Settings Dialog */}
      <Dialog open={showSettings} onClose={() => setShowSettings(false)} maxWidth="md">
        <DialogTitle>
          Printing Settings
          <IconButton
            aria-label="close"
            onClick={() => setShowSettings(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Copies"
                name="copies"
                type="number"
                value={printSettings.copies}
                onChange={handleSettingsChange}
                InputProps={{ inputProps: { min: 1, max: 100 } }}
                helperText="Number of copies to print"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Page Range</InputLabel>
                <Select
                  name="pageRange"
                  value={printSettings.pageRange}
                  onChange={handleSettingsChange}
                  label="Page Range"
                >
                  <MenuItem value="all">All Pages</MenuItem>
                  <MenuItem value="custom">Custom Range</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {printSettings.pageRange === 'custom' && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Custom Page Range"
                  name="customPageRange"
                  value={printSettings.customPageRange}
                  onChange={handleSettingsChange}
                  helperText="e.g., 1-3, 5, 7-9"
                />
              </Grid>
            )}

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Layout</InputLabel>
                <Select
                  name="layout"
                  value={printSettings.layout}
                  onChange={handleSettingsChange}
                  label="Layout"
                >
                  <MenuItem value="portrait">Portrait</MenuItem>
                  <MenuItem value="landscape">Landscape</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Paper Size</InputLabel>
                <Select
                  name="paperSize"
                  value={printSettings.paperSize}
                  onChange={handleSettingsChange}
                  label="Paper Size"
                >
                  <MenuItem value="a4">A4</MenuItem>
                  <MenuItem value="a3">A3</MenuItem>
                  <MenuItem value="letter">Letter</MenuItem>
                  <MenuItem value="legal">Legal</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Color Mode</InputLabel>
                <Select
                  name="colorMode"
                  value={printSettings.colorMode}
                  onChange={handleSettingsChange}
                  label="Color Mode"
                >
                  <MenuItem value="color">Color</MenuItem>
                  <MenuItem value="bw">Black & White</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={printSettings.printBothSides}
                      onChange={handleSettingsChange}
                      name="printBothSides"
                    />
                  }
                  label="Print on both sides"
                />
              </FormGroup>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSettings(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={() => {
              setShowSettings(false);
            }}
          >
            Apply Settings
          </Button>
        </DialogActions>
      </Dialog>

      {/* Alerts */}
      <Snackbar open={!!uploadError} autoHideDuration={6000} onClose={handleCloseAlert}>
        <Alert onClose={handleCloseAlert} severity="error" sx={{ width: '100%' }}>
          {uploadError}
        </Alert>
      </Snackbar>

      <Snackbar open={uploadSuccess} autoHideDuration={6000} onClose={handleCloseAlert}>
        <Alert onClose={handleCloseAlert} severity="success" sx={{ width: '100%' }}>
          PDF uploaded successfully! Your print job has been sent to the queue.
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default PDFUpload; 