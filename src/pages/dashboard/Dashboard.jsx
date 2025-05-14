import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Container,
  Grid,
  Paper,
  Button,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Card,
  CardContent,
  IconButton,
  AppBar,
  Toolbar,
  Tab,
  Tabs,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Modal,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  Logout as LogoutIcon,
  Menu as MenuIcon,
  Print as PrintIcon,
  Description as DescriptionIcon,
  History as HistoryIcon,
  FileUpload as FileUploadIcon,
  Visibility as VisibilityIcon,
  Cancel as CancelIcon,
  Info as InfoIcon,
  Close as CloseIcon,
  FileDownload as FileDownloadIcon,
  OpenInNew as OpenInNewIcon,
  Preview as PreviewIcon,
  Lock as LockIcon,
} from '@mui/icons-material';
import { authAPI, printAPI } from '../../utils/api';
import PDFUpload from '../../components/PDFUpload';
import ChangePassword from '../../components/ChangePassword';
import axios from 'axios';

// TabPanel component for tab content
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`dashboard-tabpanel-${index}`}
      aria-labelledby={`dashboard-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [printJobs, setPrintJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');

  // Update the useEffect hooks to fetch user data and print jobs on initial load
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Check if token exists
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        // Fetch current user data
        const userData = await authAPI.getCurrentUser();
        setUser(userData);
      } catch (err) {
        console.error('Failed to fetch user data:', err);
        setError('Failed to load user data. Please log in again.');
        localStorage.removeItem('token');
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  // Fetch print jobs when dashboard loads and when tab changes to Print Jobs (tab index 2)
  useEffect(() => {
    // Only fetch if we're not in the loading state (i.e., after user data is fetched)
    if (!loading) {
      // Fetch all jobs for dashboard stats, but only show loading indicator on Print Jobs tab
      const showLoading = tabValue === 2;
      fetchPrintJobs(showLoading);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, tabValue]);

  const fetchPrintJobs = async (showLoading = true) => {
    try {
      // Only show loading indicator if requested (on Print Jobs tab)
      if (showLoading) {
        setJobsLoading(true);
      }
      
      const response = await printAPI.getUserPrintJobs();
      if (response && response.printJobs) {
        setPrintJobs(response.printJobs);
      }
    } catch (error) {
      console.error('Failed to fetch print jobs:', error);
    } finally {
      // Always reset loading state
      setJobsLoading(false);
    }
  };

  const handleCancelJob = async (jobId) => {
    try {
      await printAPI.cancelPrintJob(jobId);
      // Refresh the jobs list
      fetchPrintJobs();
    } catch (error) {
      console.error('Failed to cancel job:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Format date to a readable format
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Get color based on job status
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning.main';
      case 'processing': return 'info.main';
      case 'completed': return 'success.main';
      case 'failed': return 'error.main';
      case 'cancelled': return 'text.disabled';
      default: return 'text.primary';
    }
  };

  const handleViewSettings = (job) => {
    setSelectedJob(job);
    setSettingsDialogOpen(true);
  };

  // Function to get a readable URL for opening PDFs in a new tab
  const getReadableUrl = (job) => {
    if (!job) return '';
    
    // Use direct Cloudinary URL with proper parameters for viewing
    if (job.fileUrl && job.fileUrl.includes('cloudinary')) {
      // Ensure it has the right parameters for viewing
      const baseUrl = job.fileUrl.split('?')[0];
      return `${baseUrl}?fl_attachment=false&fl_inline=true`;
    } 
    
    // Fallback to whatever URL is available
    return job.fileUrl || '';
  };

  // Function to properly open PDFs in a new tab
  const openInNewTab = (job) => {
    if (!job) return;
    
    // 1. First try using the server's PDF proxy endpoint
    if (job.proxyUrl) {
      // Get the API base URL (replace client port with server port)
      const apiBaseUrl = window.location.origin.replace('5173', '8080');
      const proxyUrl = `${apiBaseUrl}${job.proxyUrl}`;
      window.open(proxyUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    
    // 2. Fallback to direct URL if proxyUrl isn't available
    const viewUrl = getReadableUrl(job);
    window.open(viewUrl, '_blank', 'noopener,noreferrer');
  };

  // Function to trigger download using the printAPI method
  const handleDownload = async (fileUrl, fileName, jobId) => {
    try {
      setPdfLoading(true);
      
      if (jobId) {
        // Use our API utility for downloading
        const blob = await printAPI.downloadPDF(jobId);
        
        // Create a blob URL and trigger download
        const blobUrl = window.URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = blobUrl;
        link.setAttribute('download', fileName || 'document.pdf');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up the blob URL
        window.URL.revokeObjectURL(blobUrl);
      } else {
        // Fallback to direct URL if we don't have the job ID
        const job = { fileUrl }; // Create minimal job object
        const directUrl = getReadableUrl(job);
        
        // Use fetch API to get the file and download it
        const response = await fetch(directUrl);
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = blobUrl;
        link.setAttribute('download', fileName || 'document.pdf');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up the blob URL
        window.URL.revokeObjectURL(blobUrl);
      }
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download the PDF. Please try again later.');
    } finally {
      setPdfLoading(false);
    }
  };

  // Function to get a proper preview URL for PDFs
  const getPreviewUrl = (job) => {
    if (!job) return '';
    
    // For server proxy
    if (job.proxyUrl) {
      const apiBaseUrl = window.location.origin.replace('5173', '8080');
      return `${apiBaseUrl}${job.proxyUrl}`;
    }
    
    // Fallback to direct Cloudinary URL
    if (job.fileUrl && job.fileUrl.includes('cloudinary')) {
      const baseUrl = job.fileUrl.split('?')[0];
      return `${baseUrl}?fl_attachment=false&fl_inline=true`;
    }
    
    return job.fileUrl || '';
  };
  
  // Function to handle PDF preview
  const handlePreview = (job) => {
    if (!job) return;
    
    // Set loading state to true when starting preview
    setPdfLoading(true);
    
    // Store the job for use in the dialog actions
    setSelectedJob(job);
    
    // Get the preview URL
    const url = getPreviewUrl(job);
    setPreviewUrl(url);
    setPdfPreviewOpen(true);
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

  // Function to trigger download directly from the preview URL
  const handleDownloadFromPreview = () => {
    if (!previewUrl) return;
    
    setPdfLoading(true);
    
    // Add download=true query parameter to the URL
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

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* App Bar */}
      <AppBar position="static" sx={{ backgroundColor: '#111' }}>
        <Toolbar>
          <IconButton edge="start" color="inherit" aria-label="menu" sx={{ mr: 2 }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            PrintiFy Dashboard
          </Typography>
          <IconButton color="inherit">
            <NotificationsIcon />
          </IconButton>
          <Avatar
            alt={user?.name || 'User'}
            src=""
            sx={{ width: 32, height: 32, ml: 1, bgcolor: 'primary.main' }}
          >
            {user?.name?.charAt(0) || 'U'}
          </Avatar>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Box sx={{ display: 'flex', flex: 1 }}>
        {/* Sidebar */}
        <Paper
          sx={{
            width: 240,
            p: 2,
            display: { xs: 'none', sm: 'block' },
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 2 }}>
            <Avatar
              alt={user?.name || 'User'}
              src=""
              sx={{ width: 64, height: 64, mx: 'auto', mb: 1, bgcolor: 'primary.main' }}
            >
              {user?.name?.charAt(0) || 'U'}
            </Avatar>
            <Typography variant="h6">{user?.name || 'User'}</Typography>
            <Typography variant="body2" color="text.secondary">
              {user?.email || 'user@example.com'}
            </Typography>
          </Box>

          <Divider sx={{ my: 2 }} />

          <List>
            <ListItem button selected={tabValue === 0} onClick={() => setTabValue(0)}>
              <ListItemIcon>
                <DashboardIcon />
              </ListItemIcon>
              <ListItemText primary="Dashboard" />
            </ListItem>
            <ListItem button selected={tabValue === 1} onClick={() => setTabValue(1)}>
              <ListItemIcon>
                <FileUploadIcon />
              </ListItemIcon>
              <ListItemText primary="Upload PDF" />
            </ListItem>
            <ListItem button selected={tabValue === 2} onClick={() => setTabValue(2)}>
              <ListItemIcon>
                <PrintIcon />
              </ListItemIcon>
              <ListItemText primary="Print Jobs" />
            </ListItem>
            <ListItem button>
              <ListItemIcon>
                <DescriptionIcon />
              </ListItemIcon>
              <ListItemText primary="Templates" />
            </ListItem>
            <ListItem button>
              <ListItemIcon>
                <HistoryIcon />
              </ListItemIcon>
              <ListItemText primary="History" />
            </ListItem>
            <ListItem button>
              <ListItemIcon>
                <PersonIcon />
              </ListItemIcon>
              <ListItemText primary="Profile" />
            </ListItem>
            <ListItem button selected={tabValue === 3} onClick={() => setTabValue(3)}>
              <ListItemIcon>
                <LockIcon />
              </ListItemIcon>
              <ListItemText primary="Change Password" />
            </ListItem>
            <ListItem button>
              <ListItemIcon>
                <SettingsIcon />
              </ListItemIcon>
              <ListItemText primary="Settings" />
            </ListItem>
          </List>

          <Divider sx={{ my: 2 }} />

          <Button
            variant="outlined"
            color="error"
            startIcon={<LogoutIcon />}
            fullWidth
            onClick={handleLogout}
          >
            Logout
          </Button>
        </Paper>

        {/* Main Content */}
        <Box sx={{ flex: 1, p: 3, backgroundColor: '#f5f5f5' }}>
          {/* Tabs for mobile view */}
          <Box sx={{ display: { xs: 'block', sm: 'none' }, mb: 2 }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              aria-label="dashboard tabs"
            >
              <Tab icon={<DashboardIcon />} label="Dashboard" />
              <Tab icon={<FileUploadIcon />} label="Upload PDF" />
              <Tab icon={<PrintIcon />} label="Print Jobs" />
              <Tab icon={<LockIcon />} label="Password" />
              <Tab icon={<HistoryIcon />} label="History" />
            </Tabs>
          </Box>

          {/* Dashboard Tab */}
          <TabPanel value={tabValue} index={0}>
          <Typography variant="h4" sx={{ mb: 3 }}>
            Welcome, {user?.name || 'User'}!
          </Typography>

          <Grid container spacing={3}>
            {/* Stats Cards */}
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <PrintIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">Print Jobs</Typography>
                  </Box>
                  <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
                      {printJobs.length || '0'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                      {printJobs.filter(job => job.status === 'pending' || job.status === 'processing').length} in progress, 
                      {' '}{printJobs.filter(job => job.status === 'completed').length} completed
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <DescriptionIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">Templates</Typography>
                  </Box>
                  <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
                    5
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    2 custom, 3 from library
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <HistoryIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">Print History</Typography>
                  </Box>
                  <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
                      {printJobs.filter(job => job.status === 'completed').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                      Last print: {printJobs.length > 0 ? formatDate(printJobs[0].createdAt) : 'No prints yet'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Quick Actions */}
            <Grid item xs={12}>
              <Paper sx={{ p: 3, mt: 3 }}>
                <Typography variant="h5" sx={{ mb: 2 }}>
                  Quick Actions
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Button
                      variant="contained"
                      startIcon={<PrintIcon />}
                      fullWidth
                      sx={{ py: 1.5, textTransform: 'none' }}
                        onClick={() => setTabValue(1)}
                    >
                      New Print Job
                    </Button>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Button
                      variant="outlined"
                      startIcon={<DescriptionIcon />}
                      fullWidth
                      sx={{ py: 1.5, textTransform: 'none' }}
                    >
                      Create Template
                    </Button>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Button
                      variant="outlined"
                      startIcon={<HistoryIcon />}
                      fullWidth
                      sx={{ py: 1.5, textTransform: 'none' }}
                    >
                      View History
                    </Button>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Button
                      variant="outlined"
                      startIcon={<SettingsIcon />}
                      fullWidth
                      sx={{ py: 1.5, textTransform: 'none' }}
                    >
                      Settings
                    </Button>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {/* Recent Activity */}
            <Grid item xs={12}>
              <Paper sx={{ p: 3, mt: 3 }}>
                <Typography variant="h5" sx={{ mb: 2 }}>
                  Recent Activity
                </Typography>
                <List>
                    {printJobs.slice(0, 3).map((job) => (
                      <ListItem key={job._id} divider>
                    <ListItemIcon>
                      <PrintIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                          primary={job.fileName}
                          secondary={formatDate(job.createdAt)}
                        />
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            textTransform: 'capitalize', 
                            color: getStatusColor(job.status),
                            fontWeight: 'medium'
                          }}
                        >
                          {job.status}
                        </Typography>
                  </ListItem>
                    ))}
                    {printJobs.length === 0 && (
                  <ListItem>
                    <ListItemText
                          primary="No print jobs yet"
                          secondary={
                            <Button 
                              variant="text" 
                              color="primary"
                              sx={{ mt: 1, pl: 0 }}
                              onClick={() => setTabValue(1)}
                              startIcon={<FileUploadIcon />}
                            >
                              Upload a PDF to start printing
                            </Button>
                          }
                    />
                  </ListItem>
                    )}
                </List>
              </Paper>
            </Grid>
          </Grid>
          </TabPanel>

          {/* Upload PDF Tab */}
          <TabPanel value={tabValue} index={1}>
            <Typography variant="h4" sx={{ mb: 3 }}>
              Upload PDF for Printing
            </Typography>
            <PDFUpload onUploadSuccess={fetchPrintJobs} />
          </TabPanel>

          {/* Print Jobs Tab */}
          <TabPanel value={tabValue} index={2}>
            <Typography variant="h4" sx={{ mb: 3 }}>
              Print Jobs
            </Typography>
            
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Your Print Queue</Typography>
                <Button
                  variant="outlined"
                  startIcon={<FileUploadIcon />}
                  onClick={() => setTabValue(1)}
                >
                  Upload New PDF
                </Button>
              </Box>
              
              {jobsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <Box>
                  {printJobs.length === 0 ? (
                    <Paper 
                      sx={{ 
                        p: 4, 
                        textAlign: 'center',
                        backgroundColor: '#f9f9f9' 
                      }}
                    >
                      <Typography variant="body1" sx={{ mb: 2 }}>
                        You don't have any print jobs yet.
                      </Typography>
                      <Button 
                        variant="contained" 
                        onClick={() => setTabValue(1)}
                        startIcon={<FileUploadIcon />}
                      >
                        Upload a PDF Now
                      </Button>
                    </Paper>
                  ) : (
                    <Box sx={{ overflow: 'auto' }}>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>File Name</TableCell>
                            <TableCell>Upload Date</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Copies</TableCell>
                            <TableCell>Paper Size</TableCell>
                            <TableCell>Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {printJobs.map((job) => (
                            <TableRow key={job._id} hover>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <DescriptionIcon sx={{ mr: 1, color: 'primary.main' }} />
                                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                    {job.fileName}
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell>{formatDate(job.createdAt)}</TableCell>
                              <TableCell>
                                <Box sx={{ 
                                  display: 'inline-flex', 
                                  alignItems: 'center', 
                                  px: 1.5, 
                                  py: 0.5, 
                                  borderRadius: '16px',
                                  bgcolor: `${getStatusColor(job.status)}15`,
                                }}>
                                  <Box
                                    sx={{
                                      width: 8,
                                      height: 8,
                                      borderRadius: '50%',
                                      bgcolor: getStatusColor(job.status),
                                      mr: 1
                                    }}
                                  />
                                  <Typography 
                                    variant="body2" 
                                    sx={{ 
                                      textTransform: 'capitalize', 
                                      color: getStatusColor(job.status),
                                      fontWeight: 'medium'
                                    }}
                                  >
                                    {job.status}
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell>{job.printSettings?.copies || 1}</TableCell>
                              <TableCell sx={{ textTransform: 'uppercase' }}>
                                {job.printSettings?.paperSize || 'A4'}
                              </TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                  <IconButton
                                    size="small"
                                    onClick={() => handlePreview(job)}
                                    title="Preview PDF"
                                  >
                                    <PreviewIcon fontSize="small" />
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    color="info"
                                    onClick={() => handleViewSettings(job)}
                                    title="View Print Settings"
                                  >
                                    <InfoIcon fontSize="small" />
                                  </IconButton>
                                  {(job.status === 'pending' || job.status === 'processing') && (
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={() => handleCancelJob(job._id)}
                                      title="Cancel Job"
                                    >
                                      <CancelIcon fontSize="small" />
                                    </IconButton>
                                  )}
                                </Box>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </Box>
                  )}
                </Box>
              )}
            </Paper>
          </TabPanel>
          
          {/* Change Password Tab */}
          <TabPanel value={tabValue} index={3}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h4" sx={{ mb: 3 }}>
                Change Password
              </Typography>
              <ChangePassword />
            </Paper>
          </TabPanel>
        </Box>
      </Box>

      {/* Print Settings Dialog */}
      <Dialog
        open={settingsDialogOpen}
        onClose={() => setSettingsDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Print Settings
          <IconButton
            aria-label="close"
            onClick={() => setSettingsDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedJob && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight="bold">
                  {selectedJob.fileName}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Copies:
                </Typography>
                <Typography variant="body1">
                  {selectedJob.printSettings?.copies || 1}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Paper Size:
                </Typography>
                <Typography variant="body1" sx={{ textTransform: 'uppercase' }}>
                  {selectedJob.printSettings?.paperSize || 'A4'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Layout:
                </Typography>
                <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                  {selectedJob.printSettings?.layout || 'Portrait'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Color Mode:
                </Typography>
                <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                  {selectedJob.printSettings?.colorMode === 'bw' ? 'Black & White' : 'Color'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Double-sided:
                </Typography>
                <Typography variant="body1">
                  {selectedJob.printSettings?.printBothSides ? 'Yes' : 'No'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Page Range:
                </Typography>
                <Typography variant="body1">
                  {selectedJob.printSettings?.pageRange === 'custom' 
                    ? selectedJob.printSettings?.customPageRange 
                    : 'All Pages'}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  Uploaded on:
                </Typography>
                <Typography variant="body1">
                  {formatDate(selectedJob.createdAt)}
                </Typography>
              </Grid>
              
              {/* Total Pages Summary */}
              <Grid item xs={12}>
                <Box sx={{ 
                  p: 2, 
                  bgcolor: '#f5f5f5', 
                  borderRadius: 1,
                  border: '1px dashed #ccc',
                  mt: 1 
                }}>
                  <Typography variant="subtitle2" fontWeight="medium" gutterBottom>
                    Print Summary
                  </Typography>
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Total Pages:
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {selectedJob.printSettings?.totalPages > 0 
                          ? selectedJob.printSettings.totalPages 
                          : (selectedJob.printSettings?.copies || 1) + ' copy/copies'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Estimated Cost:
                      </Typography>
                      <Typography variant="body1" fontWeight="medium" color="primary.main">
                        ${((selectedJob.printSettings?.totalPages || 0) * 0.10).toFixed(2)}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

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
          <Typography variant="h6">PDF Preview</Typography>
          <IconButton edge="end" color="inherit" onClick={handleClosePreview} aria-label="close">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ padding: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
          {previewUrl ? (
            <Box sx={{ flex: 1, position: 'relative' }}>
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
              {/* PDF iframe */}
              <iframe
                src={previewUrl}
                title="PDF Preview"
                width="100%"
                height="100%"
                style={{ border: 'none' }}
                onLoad={() => setPdfLoading(false)}
                onError={() => setPdfLoading(false)}
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
    </Box>
  );
};

export default Dashboard; 