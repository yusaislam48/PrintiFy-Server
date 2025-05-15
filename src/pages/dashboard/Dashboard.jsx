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
  TableContainer,
  Chip,
  Tooltip,
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
  ArrowForward as ArrowForwardIcon,
  CreditCard as PointsIcon,
  Refresh as RefreshIcon,
  AdminPanelSettings as AdminPanelSettingsIcon,
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
  const [pointHistory, setPointHistory] = useState([]);

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

  // Add this function to calculate completed jobs and points used
  const calculatePointsStatistics = () => {
    if (!printJobs || printJobs.length === 0) {
      return { 
        totalPointsUsed: 0, 
        completedJobs: 0,
        pendingJobs: 0,
        pointsPerJob: [] 
      };
    }

    const completedJobs = printJobs.filter(job => job.status === 'completed');
    const pendingJobs = printJobs.filter(job => job.status === 'pending');
    
    const totalPointsUsed = completedJobs.reduce((total, job) => {
      return total + (job.pointsUsed || job.printSettings.totalPages || 0);
    }, 0);

    // Create point history entries
    const pointsPerJob = completedJobs.map(job => ({
      id: job._id,
      date: job.updatedAt,
      fileName: job.fileName,
      pointsUsed: job.pointsUsed || job.printSettings.totalPages || 0
    }));

    return { 
      totalPointsUsed, 
      completedJobs: completedJobs.length,
      pendingJobs: pendingJobs.length,
      pointsPerJob 
    };
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
      <AppBar position="static" sx={{ backgroundColor: '#1a237e', boxShadow: 3 }}>
        <Toolbar>
          <IconButton edge="start" color="inherit" aria-label="menu" sx={{ mr: 2 }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
            <PrintIcon sx={{ mr: 1 }} />
            PrintiFy Dashboard
          </Typography>
          
          {/* Admin Access Button - Only shown for admin/master users */}
          {(user?.role === 'admin' || user?.role === 'master' || user?.isAdmin) && (
            <Button 
              color="secondary" 
              variant="contained"
              startIcon={<AdminPanelSettingsIcon />}
              onClick={() => navigate('/admin')}
              sx={{ mr: 2, borderRadius: 2 }}
            >
              Admin Panel
            </Button>
          )}
          
          <Button 
            color="inherit" 
            size="small" 
            variant="outlined" 
            startIcon={<FileUploadIcon />}
            onClick={() => setTabValue(1)}
            sx={{ mr: 2, borderRadius: 2, display: { xs: 'none', md: 'flex' } }}
          >
            Upload PDF
          </Button>
          
          <Tooltip title="Notifications">
            <IconButton color="inherit">
              <NotificationsIcon />
            </IconButton>
          </Tooltip>
          
          <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
            <Box sx={{ mr: 1, display: { xs: 'none', sm: 'block' } }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', lineHeight: 1 }}>
                {user?.name}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                {user?.points || 0} points
              </Typography>
            </Box>
            <Avatar
              alt={user?.name || 'User'}
              src=""
              sx={{ width: 32, height: 32, bgcolor: 'primary.light', color: 'primary.dark' }}
            >
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </Avatar>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Box sx={{ display: 'flex', flex: 1 }}>
        {/* Sidebar */}
        <Paper
          elevation={3}
          sx={{
            width: 240,
            p: 2,
            display: { xs: 'none', sm: 'block' },
            borderRadius: 0,
            borderRight: '1px solid #eee',
            height: 'calc(100vh - 64px)',
            position: 'sticky',
            top: 64,
            overflow: 'auto'
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Avatar
              alt={user?.name || 'User'}
              src=""
              sx={{ 
                width: 80, 
                height: 80, 
                mx: 'auto', 
                mb: 1, 
                bgcolor: 'primary.main',
                boxShadow: '0 4px 10px rgba(0,0,0,0.15)'
              }}
            >
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </Avatar>
            <Typography variant="h6" fontWeight="bold">{user?.name || 'User'}</Typography>
            <Typography variant="body2" color="text.secondary">
              {user?.email || 'user@example.com'}
            </Typography>
            
            {/* Admin badge for admin users */}
            {(user?.role === 'admin' || user?.role === 'master' || user?.isAdmin) && (
              <Chip
                label={user?.role === 'master' ? 'Master Admin' : 'Admin'}
                color={user?.role === 'master' ? 'secondary' : 'primary'}
                sx={{ mt: 1, fontWeight: 'bold', mb: 1 }}
              />
            )}
            
            <Box 
              sx={{ 
                mt: 1, 
                p: 1, 
                bgcolor: 'primary.main', 
                color: 'white',
                borderRadius: 2,
                fontWeight: 'bold',
                fontSize: '0.875rem'
              }}
            >
              {user?.points || 0} Points Available
            </Box>
            
            {/* Admin access button in sidebar */}
            {(user?.role === 'admin' || user?.role === 'master' || user?.isAdmin) && (
              <Button
                variant="contained"
                color="secondary"
                startIcon={<AdminPanelSettingsIcon />}
                fullWidth
                onClick={() => navigate('/admin')}
                sx={{ mt: 2, borderRadius: 2 }}
              >
                Go to Admin Panel
              </Button>
            )}
          </Box>

          <Divider sx={{ my: 2 }} />

          <List sx={{ px: 0 }}>
            <ListItem 
              button 
              selected={tabValue === 0} 
              onClick={() => setTabValue(0)}
              sx={{ 
                borderRadius: 2,
                mb: 0.5,
                '&.Mui-selected': {
                  bgcolor: 'primary.light',
                  color: 'primary.dark',
                  '& .MuiListItemIcon-root': {
                    color: 'primary.dark',
                  },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <DashboardIcon />
              </ListItemIcon>
              <ListItemText primary="Dashboard" />
            </ListItem>
            
            <ListItem 
              button 
              selected={tabValue === 1} 
              onClick={() => setTabValue(1)}
              sx={{ 
                borderRadius: 2,
                mb: 0.5,
                '&.Mui-selected': {
                  bgcolor: 'primary.light',
                  color: 'primary.dark',
                  '& .MuiListItemIcon-root': {
                    color: 'primary.dark',
                  },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <FileUploadIcon />
              </ListItemIcon>
              <ListItemText primary="Upload PDF" />
            </ListItem>
            
            <ListItem 
              button 
              selected={tabValue === 2} 
              onClick={() => setTabValue(2)}
              sx={{ 
                borderRadius: 2,
                mb: 0.5,
                '&.Mui-selected': {
                  bgcolor: 'primary.light',
                  color: 'primary.dark',
                  '& .MuiListItemIcon-root': {
                    color: 'primary.dark',
                  },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <PrintIcon />
              </ListItemIcon>
              <ListItemText primary="Print Jobs" />
            </ListItem>
            
            <ListItem 
              button
              sx={{ 
                borderRadius: 2,
                mb: 0.5,
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <DescriptionIcon />
              </ListItemIcon>
              <ListItemText primary="Templates" />
            </ListItem>
            
            <ListItem 
              button
              sx={{ 
                borderRadius: 2,
                mb: 0.5,
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <HistoryIcon />
              </ListItemIcon>
              <ListItemText primary="History" />
            </ListItem>
            
            <ListItem 
              button
              sx={{ 
                borderRadius: 2,
                mb: 0.5,
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <PersonIcon />
              </ListItemIcon>
              <ListItemText primary="Profile" />
            </ListItem>
            
            <ListItem 
              button 
              selected={tabValue === 3} 
              onClick={() => setTabValue(3)}
              sx={{ 
                borderRadius: 2,
                mb: 0.5,
                '&.Mui-selected': {
                  bgcolor: 'primary.light',
                  color: 'primary.dark',
                  '& .MuiListItemIcon-root': {
                    color: 'primary.dark',
                  },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <LockIcon />
              </ListItemIcon>
              <ListItemText primary="Change Password" />
            </ListItem>
            
            <ListItem 
              button
              sx={{ 
                borderRadius: 2,
                mb: 0.5,
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
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
            sx={{ borderRadius: 2 }}
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
            <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold', color: 'primary.main' }}>
              Welcome, {user?.name || 'User'}!
            </Typography>

            <Grid container spacing={3}>
              {/* User Info Card */}
              <Grid item xs={12} md={4}>
                <Paper elevation={3} sx={{ p: 3, height: '100%', borderRadius: 2, position: 'relative', overflow: 'hidden' }}>
                  <Box sx={{ 
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '80px',
                    bgcolor: 'primary.main',
                    zIndex: 0
                  }} />
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2, position: 'relative', zIndex: 1 }}>
                    <Avatar
                      src={user?.profilePicture || ''}
                      alt={user?.name}
                      sx={{ 
                        width: 100, 
                        height: 100, 
                        mb: 2, 
                        mt: 1,
                        border: '4px solid white',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                      }}
                    >
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </Avatar>
                    <Typography variant="h5" gutterBottom fontWeight="bold">
                      {user?.name}
                    </Typography>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      bgcolor: user?.isVerified ? 'success.light' : 'warning.light',
                      px: 1.5,
                      py: 0.5,
                      borderRadius: 2,
                      mb: 1
                    }}>
                      {user?.isVerified ? (
                        <Typography variant="body2" color="success.dark" fontWeight="medium">
                          Verified Account
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="warning.dark" fontWeight="medium">
                          Verification Pending
                        </Typography>
                      )}
                    </Box>
                    
                    <Box sx={{ width: '100%', mt: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ minWidth: 100 }}>
                          Email:
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {user?.email}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ minWidth: 100 }}>
                          Student ID:
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {user?.studentId || 'Not set'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ minWidth: 100 }}>
                          Phone:
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {user?.phone || 'Not set'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body2" color="text.secondary" sx={{ minWidth: 100 }}>
                          Joined:
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {user?.createdAt ? formatDate(user.createdAt) : 'Unknown'}
                        </Typography>
                      </Box>
                    </Box>
                    
                    {/* Points Display */}
                    <Box sx={{ 
                      mt: 3, 
                      p: 2, 
                      bgcolor: 'primary.light', 
                      color: 'primary.contrastText',
                      borderRadius: 3,
                      width: '100%',
                      textAlign: 'center',
                      boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                    }}>
                      <Typography variant="h6" gutterBottom>
                        Available Points
                      </Typography>
                      <Typography variant="h2" fontWeight="bold">
                        {user?.points || 0}
                      </Typography>
                      <Button 
                        variant="contained" 
                        size="small" 
                        sx={{ mt: 1, bgcolor: 'primary.dark' }}
                        onClick={() => navigate('/profile/add-points')}
                      >
                        Get More Points
                      </Button>
                    </Box>
                  </Box>
                </Paper>
              </Grid>

              {/* Print Stats Card */}
              <Grid item xs={12} md={8}>
                <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
                  <Typography variant="h6" gutterBottom>
                    Printing Statistics
                  </Typography>
                  
                  {jobsLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                      <CircularProgress />
                    </Box>
                  ) : (
                    <Grid container spacing={3}>
                      <Grid item xs={12} sm={6} md={3}>
                        <Card sx={{ bgcolor: 'info.light', color: 'info.contrastText' }}>
                          <CardContent>
                            <Typography variant="h5">{printJobs.length}</Typography>
                            <Typography variant="body2">Total Print Jobs</Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      
                      <Grid item xs={12} sm={6} md={3}>
                        <Card sx={{ bgcolor: 'warning.light', color: 'warning.contrastText' }}>
                          <CardContent>
                            <Typography variant="h5">
                              {calculatePointsStatistics().pendingJobs}
                            </Typography>
                            <Typography variant="body2">Pending Jobs</Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      
                      <Grid item xs={12} sm={6} md={3}>
                        <Card sx={{ bgcolor: 'success.light', color: 'success.contrastText' }}>
                          <CardContent>
                            <Typography variant="h5">
                              {calculatePointsStatistics().completedJobs}
                            </Typography>
                            <Typography variant="body2">Completed Jobs</Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      
                      <Grid item xs={12} sm={6} md={3}>
                        <Card sx={{ bgcolor: 'error.light', color: 'error.contrastText' }}>
                          <CardContent>
                            <Typography variant="h5">
                              {calculatePointsStatistics().totalPointsUsed}
                            </Typography>
                            <Typography variant="body2">Points Used</Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    </Grid>
                  )}
                </Paper>
              </Grid>
              
              {/* Points History Card */}
              <Grid item xs={12}>
                <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center' }}>
                      <PointsIcon sx={{ mr: 1, color: 'primary.main' }} />
                      Points History
                    </Typography>
                    
                    <Box>
                      <Button 
                        color="primary" 
                        size="small" 
                        sx={{ fontWeight: 'medium' }}
                        endIcon={<ArrowForwardIcon />}
                        onClick={() => navigate('/points-history')}
                      >
                        View All
                      </Button>
                    </Box>
                  </Box>
                  
                  {jobsLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                      <CircularProgress />
                    </Box>
                  ) : calculatePointsStatistics().pointsPerJob.length > 0 ? (
                    <>
                      <TableContainer sx={{ 
                        maxHeight: 300, 
                        '&::-webkit-scrollbar': {
                          width: '8px',
                        },
                        '&::-webkit-scrollbar-thumb': {
                          backgroundColor: '#ddd',
                          borderRadius: '4px',
                        },
                        '&::-webkit-scrollbar-track': {
                          backgroundColor: '#f5f5f5',
                        },
                      }}>
                        <Table size="small" stickyHeader>
                          <TableHead>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 'bold', bgcolor: 'background.paper' }}>Date</TableCell>
                              <TableCell sx={{ fontWeight: 'bold', bgcolor: 'background.paper' }}>File Name</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 'bold', bgcolor: 'background.paper' }}>Points Used</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {calculatePointsStatistics().pointsPerJob.map((job) => (
                              <TableRow key={job.id} hover>
                                <TableCell>{formatDate(job.date)}</TableCell>
                                <TableCell sx={{ maxWidth: 300 }}>
                                  <Typography variant="body2" noWrap>
                                    {job.fileName}
                                  </Typography>
                                </TableCell>
                                <TableCell align="right">
                                  <Chip 
                                    label={`-${job.pointsUsed}`}
                                    color="error"
                                    size="small"
                                    variant="outlined"
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                      
                      <Box sx={{ 
                        mt: 2, 
                        p: 2, 
                        bgcolor: '#f9f9f9', 
                        borderRadius: 2,
                        border: '1px dashed #ccc',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Total Points Used
                          </Typography>
                          <Typography variant="h6" color="error.main" fontWeight="bold">
                            {calculatePointsStatistics().totalPointsUsed}
                          </Typography>
                        </Box>
                        
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Available Points
                          </Typography>
                          <Typography variant="h6" color="primary.main" fontWeight="bold">
                            {user?.points || 0}
                          </Typography>
                        </Box>
                        
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Completed Jobs
                          </Typography>
                          <Typography variant="h6" color="success.main" fontWeight="bold">
                            {calculatePointsStatistics().completedJobs}
                          </Typography>
                        </Box>
                      </Box>
                    </>
                  ) : (
                    <Box sx={{ p: 3, textAlign: 'center', bgcolor: '#f9f9f9', borderRadius: 2 }}>
                      <Typography variant="body1" color="text.secondary" gutterBottom>
                        No points history available
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Your points usage history will appear here after you complete print jobs.
                      </Typography>
                      <Button 
                        variant="contained" 
                        startIcon={<FileUploadIcon />}
                        onClick={() => setTabValue(1)}
                      >
                        Start Printing Now
                      </Button>
                    </Box>
                  )}
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
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h4" fontWeight="bold" color="primary.main">
                My Print Jobs
              </Typography>
              
              <Button
                variant="contained"
                startIcon={<FileUploadIcon />}
                onClick={() => setTabValue(1)}
                sx={{ borderRadius: 2 }}
              >
                Upload New PDF
              </Button>
            </Box>
            
            <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center' }}>
                  <PrintIcon sx={{ mr: 1, color: 'primary.main' }} />
                  Print Queue
                </Typography>
                
                <Box>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<RefreshIcon />}
                    onClick={() => fetchPrintJobs(true)}
                    sx={{ borderRadius: 2 }}
                  >
                    Refresh Jobs
                  </Button>
                </Box>
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
                        backgroundColor: '#f9f9f9',
                        borderRadius: 2,
                        border: '1px dashed #ccc'
                      }}
                    >
                      <Box sx={{ mb: 3 }}>
                        <img 
                          src="/empty-queue.svg" 
                          alt="Empty Queue" 
                          style={{ width: '180px', height: 'auto', opacity: 0.7 }}
                        />
                      </Box>
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        Your Print Queue is Empty
                      </Typography>
                      <Typography variant="body1" sx={{ mb: 3 }} color="text.secondary">
                        Upload a PDF document to get started with printing.
                      </Typography>
                      <Button 
                        variant="contained" 
                        onClick={() => setTabValue(1)}
                        startIcon={<FileUploadIcon />}
                        size="large"
                        sx={{ borderRadius: 2 }}
                      >
                        Upload a PDF Now
                      </Button>
                    </Paper>
                  ) : (
                    <Box sx={{ overflow: 'auto' }}>
                      <Table sx={{ minWidth: 800 }}>
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>File Name</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Upload Date</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Details</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {printJobs.map((job) => (
                            <TableRow 
                              key={job._id} 
                              hover 
                              sx={{
                                '&:last-child td, &:last-child th': { border: 0 },
                                bgcolor: job.status === 'pending' ? 'rgba(255, 244, 229, 0.3)' : 'inherit'
                              }}
                            >
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <Avatar 
                                    variant="rounded" 
                                    sx={{ 
                                      bgcolor: 'primary.light', 
                                      width: 36, 
                                      height: 36,
                                      mr: 1.5,
                                      color: 'primary.main'
                                    }}
                                  >
                                    <DescriptionIcon />
                                  </Avatar>
                                  <Box>
                                    <Typography variant="body2" sx={{ fontWeight: 'medium', maxWidth: 250 }} noWrap>
                                      {job.fileName}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {job.fileSize ? `${(job.fileSize / 1024 / 1024).toFixed(2)} MB` : 'Size unknown'}
                                    </Typography>
                                  </Box>
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
                              <TableCell>
                                <Box>
                                  <Typography variant="body2">
                                    Copies: <strong>{job.printSettings?.copies || 1}</strong>
                                  </Typography>
                                  <Typography variant="body2">
                                    Pages: <strong>{job.printSettings?.totalPages || 'Unknown'}</strong>
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                  <Tooltip title="Preview PDF">
                                    <IconButton
                                      size="small"
                                      onClick={() => handlePreview(job)}
                                      sx={{ color: 'primary.main' }}
                                    >
                                      <PreviewIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="View Print Settings">
                                    <IconButton
                                      size="small"
                                      color="info"
                                      onClick={() => handleViewSettings(job)}
                                    >
                                      <InfoIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Download PDF">
                                    <IconButton
                                      size="small"
                                      color="success"
                                      onClick={() => handleDownload(job.fileUrl, job.fileName, job._id)}
                                    >
                                      <FileDownloadIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  {(job.status === 'pending' || job.status === 'processing') && (
                                    <Tooltip title="Cancel Job">
                                      <IconButton
                                        size="small"
                                        color="error"
                                        onClick={() => handleCancelJob(job._id)}
                                      >
                                        <CancelIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
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
            <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold', color: 'primary.main' }}>
              Change Password
            </Typography>
            
            <Paper elevation={3} sx={{ p: 3, borderRadius: 2, maxWidth: 600, mx: 'auto' }}>
              <Box sx={{ mb: 3, textAlign: 'center' }}>
                <Avatar sx={{ 
                  width: 70, 
                  height: 70, 
                  mx: 'auto', 
                  mb: 2, 
                  bgcolor: 'primary.light', 
                  color: 'primary.dark' 
                }}>
                  <LockIcon sx={{ fontSize: 40 }} />
                </Avatar>
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  Update Your Password
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Choose a strong, unique password to protect your account.
                </Typography>
              </Box>
              
              <Divider sx={{ mb: 3 }} />
              
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