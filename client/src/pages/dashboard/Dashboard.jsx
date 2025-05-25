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
  Drawer,
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
  const [open, setOpen] = useState(true);

  // Use media query to automatically close sidebar on small screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 600) {
        setOpen(false);
      } else {
        setOpen(true);
      }
    };
    
    // Set initial state
    handleResize();
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Toggle sidebar function
  const toggleSidebar = () => {
    setOpen(!open);
  };

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
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100vw', bgcolor: '#fafafa' }}>
      {/* App Bar */}
      <AppBar position="fixed" sx={{ backgroundColor: '#000', boxShadow: '0 1px 3px rgba(0,0,0,0.12)', zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton 
            edge="start" 
            color="inherit" 
            aria-label="menu" 
            sx={{ mr: 2 }} 
            onClick={toggleSidebar}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', fontWeight: 500 }}>
            <PrintIcon sx={{ mr: 1 }} />
            PrintiFy
          </Typography>
          
          {/* Admin Access Button - Only shown for admin/master users */}
          {(user?.role === 'admin' || user?.role === 'master' || user?.isAdmin) && (
            <Button 
              color="inherit" 
              variant="outlined"
              startIcon={<AdminPanelSettingsIcon />}
              onClick={() => navigate('/admin')}
              sx={{ mr: 2, borderRadius: 1, textTransform: 'none' }}
            >
              Admin
            </Button>
          )}
          
          <Button 
            color="inherit" 
            size="small" 
            variant="outlined" 
            startIcon={<FileUploadIcon />}
            onClick={() => setTabValue(1)}
            sx={{ mr: 2, borderRadius: 1, display: { xs: 'none', md: 'flex' }, textTransform: 'none' }}
          >
            Upload
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
              sx={{ width: 32, height: 32, bgcolor: 'white', color: 'black' }}
            >
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </Avatar>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Box sx={{ display: 'flex', flex: 1, width: '100%', mt: '64px' }}>
        {/* Sidebar */}
        <Drawer
          variant="permanent"
          open={open}
          sx={{
            width: open ? { sm: 240 } : { sm: 72 },
            flexShrink: 0,
            [`& .MuiDrawer-paper`]: { 
              width: open ? 240 : 72, 
              boxSizing: 'border-box',
            borderRight: '1px solid #eee',
            height: 'calc(100vh - 64px)',
            top: 64,
              display: { xs: open ? 'block' : 'none', sm: 'block' },
              bgcolor: 'white',
              overflowX: 'hidden',
              transition: 'width 0.2s ease-in-out'
            },
          }}
        >
          <Box sx={{ 
            textAlign: 'center', 
            p: 2, 
            mb: 2,
            display: open ? 'block' : 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Avatar
              alt={user?.name || 'User'}
              src=""
              sx={{ 
                width: open ? 80 : 40, 
                height: open ? 80 : 40, 
                mx: 'auto', 
                mb: open ? 1 : 0, 
                bgcolor: '#000',
                color: 'white',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                transition: 'width 0.2s, height 0.2s'
              }}
            >
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </Avatar>
            {open && (
              <>
                <Typography variant="h6" fontWeight="500">{user?.name || 'User'}</Typography>
            <Typography variant="body2" color="text.secondary">
              {user?.email || 'user@example.com'}
            </Typography>
            
            {/* Admin badge for admin users */}
            {(user?.role === 'admin' || user?.role === 'master' || user?.isAdmin) && (
              <Chip
                label={user?.role === 'master' ? 'Master Admin' : 'Admin'}
                    color="default"
                    sx={{ mt: 1, fontWeight: 'bold', mb: 1, bgcolor: '#000', color: 'white' }}
                    size="small"
              />
            )}
            
            <Box 
              sx={{ 
                mt: 1, 
                p: 1, 
                    bgcolor: '#000', 
                color: 'white',
                    borderRadius: 1,
                    fontWeight: 'medium',
                fontSize: '0.875rem'
              }}
            >
              {user?.points || 0} Points Available
            </Box>
              </>
            )}
          </Box>

          <Divider sx={{ my: 2 }} />

          <List sx={{ px: open ? 2 : 1 }}>
            <ListItem 
              button 
              selected={tabValue === 0} 
              onClick={() => setTabValue(0)}
              sx={{ 
                borderRadius: 1,
                mb: 0.5,
                justifyContent: open ? 'initial' : 'center',
                px: open ? 2 : 1,
                '&.Mui-selected': {
                  bgcolor: '#f0f0f0',
                  color: 'black',
                  '& .MuiListItemIcon-root': {
                    color: 'black',
                  },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: open ? 40 : 'auto', color: 'rgba(0,0,0,0.65)' }}>
                <DashboardIcon />
              </ListItemIcon>
              {open && <ListItemText primary="Dashboard" />}
            </ListItem>
            
            <ListItem 
              button 
              selected={tabValue === 1} 
              onClick={() => setTabValue(1)}
              sx={{ 
                borderRadius: 1,
                mb: 0.5,
                justifyContent: open ? 'initial' : 'center',
                px: open ? 2 : 1,
                '&.Mui-selected': {
                  bgcolor: '#f0f0f0',
                  color: 'black',
                  '& .MuiListItemIcon-root': {
                    color: 'black',
                  },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: open ? 40 : 'auto', color: 'rgba(0,0,0,0.65)' }}>
                <FileUploadIcon />
              </ListItemIcon>
              {open && <ListItemText primary="Upload PDF" />}
            </ListItem>
            
            <ListItem 
              button 
              selected={tabValue === 2} 
              onClick={() => setTabValue(2)}
              sx={{ 
                borderRadius: 1,
                mb: 0.5,
                justifyContent: open ? 'initial' : 'center',
                px: open ? 2 : 1,
                '&.Mui-selected': {
                  bgcolor: '#f0f0f0',
                  color: 'black',
                  '& .MuiListItemIcon-root': {
                    color: 'black',
                  },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: open ? 40 : 'auto', color: 'rgba(0,0,0,0.65)' }}>
                <PrintIcon />
              </ListItemIcon>
              {open && <ListItemText primary="Print Jobs" />}
            </ListItem>
            
            <ListItem 
              button
              selected={tabValue === 5}
              onClick={() => setTabValue(5)}
              sx={{ 
                borderRadius: 1,
                mb: 0.5,
                justifyContent: open ? 'initial' : 'center',
                px: open ? 2 : 1,
                '&.Mui-selected': {
                  bgcolor: '#f0f0f0',
                  color: 'black',
                  '& .MuiListItemIcon-root': {
                    color: 'black',
                  },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: open ? 40 : 'auto', color: 'rgba(0,0,0,0.65)' }}>
                <HistoryIcon />
              </ListItemIcon>
              {open && <ListItemText primary="History" />}
            </ListItem>
            
            <ListItem 
              button
              selected={tabValue === 6}
              onClick={() => setTabValue(6)}
              sx={{ 
                borderRadius: 1,
                mb: 0.5,
                justifyContent: open ? 'initial' : 'center',
                px: open ? 2 : 1,
                '&.Mui-selected': {
                  bgcolor: '#f0f0f0',
                  color: 'black',
                  '& .MuiListItemIcon-root': {
                    color: 'black',
                  },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: open ? 40 : 'auto', color: 'rgba(0,0,0,0.65)' }}>
                <PersonIcon />
              </ListItemIcon>
              {open && <ListItemText primary="Profile" />}
            </ListItem>
            
            <ListItem 
              button 
              selected={tabValue === 3} 
              onClick={() => setTabValue(3)}
              sx={{ 
                borderRadius: 1,
                mb: 0.5,
                justifyContent: open ? 'initial' : 'center',
                px: open ? 2 : 1,
                '&.Mui-selected': {
                  bgcolor: '#f0f0f0',
                  color: 'black',
                  '& .MuiListItemIcon-root': {
                    color: 'black',
                  },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: open ? 40 : 'auto', color: 'rgba(0,0,0,0.65)' }}>
                <LockIcon />
              </ListItemIcon>
              {open && <ListItemText primary="Change Password" />}
            </ListItem>
            
            <ListItem 
              button
              selected={tabValue === 7}
              onClick={() => setTabValue(7)}
              sx={{ 
                borderRadius: 1,
                mb: 0.5,
                justifyContent: open ? 'initial' : 'center',
                px: open ? 2 : 1,
                '&.Mui-selected': {
                  bgcolor: '#f0f0f0',
                  color: 'black',
                  '& .MuiListItemIcon-root': {
                    color: 'black',
                  },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: open ? 40 : 'auto', color: 'rgba(0,0,0,0.65)' }}>
                <SettingsIcon />
              </ListItemIcon>
              {open && <ListItemText primary="Settings" />}
            </ListItem>
          </List>

          <Divider sx={{ my: 2 }} />

          <Box sx={{ px: open ? 2 : 1 }}>
          <Button
            variant="outlined"
            color="error"
              startIcon={open && <LogoutIcon />}
            fullWidth
            onClick={handleLogout}
              sx={{ 
                borderRadius: 1, 
                textTransform: 'none', 
                minWidth: 0,
                justifyContent: open ? 'flex-start' : 'center',
                px: open ? 2 : 1
              }}
          >
              {open ? 'Logout' : <LogoutIcon fontSize="small" />}
          </Button>
          </Box>
        </Drawer>

        {/* Main Content Area */}
        <Box sx={{ flex: 1, p: 3, maxWidth: '100%', width: '100%', bgcolor: '#fafafa' }}>
          {/* Tabs for mobile view */}
          <Box sx={{ display: { xs: 'block', sm: 'none' }, mb: 2 }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              aria-label="dashboard tabs"
              sx={{
                '& .MuiTab-root': {
                  color: 'rgba(0,0,0,0.6)',
                  '&.Mui-selected': {
                    color: 'black',
                  }
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: 'black',
                }
              }}
            >
              <Tab icon={<DashboardIcon />} label="Dashboard" />
              <Tab icon={<FileUploadIcon />} label="Upload PDF" />
              <Tab icon={<PrintIcon />} label="Print Jobs" />
              <Tab icon={<LockIcon />} label="Password" />
              <Tab icon={<HistoryIcon />} label="History" />
              <Tab icon={<PersonIcon />} label="Profile" />
              <Tab icon={<SettingsIcon />} label="Settings" />
            </Tabs>
          </Box>

          {/* Dashboard Tab */}
          <TabPanel value={tabValue} index={0}>
            <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold', color: 'black' }}>
              Welcome, {user?.name || 'User'}!
            </Typography>

            <Grid container spacing={3}>
              {/* Quick Actions Card */}
              <Grid item xs={12} md={4}>
                <Paper elevation={0} sx={{ p: 3, height: '100%', borderRadius: 1, border: '1px solid #eee' }}>
                  <Typography variant="h6" gutterBottom fontWeight="medium">
                    Quick Actions
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Button
                        fullWidth
                        variant="outlined"
                        sx={{ 
                          py: 2, 
                          borderColor: '#eee', 
                          color: 'black', 
                          display: 'flex', 
                          flexDirection: 'column',
                          gap: 1,
                          '&:hover': {
                            bgcolor: '#f5f5f5',
                            borderColor: '#ddd'
                          }
                        }}
                        onClick={() => setTabValue(1)}
                      >
                        <FileUploadIcon sx={{ fontSize: 32 }} />
                        <Typography variant="body2">Upload PDF</Typography>
                      </Button>
                    </Grid>
                    <Grid item xs={6}>
                      <Button
                        fullWidth
                        variant="outlined"
                        sx={{ 
                          py: 2, 
                          borderColor: '#eee', 
                          color: 'black', 
                          display: 'flex', 
                          flexDirection: 'column',
                          gap: 1,
                          '&:hover': {
                            bgcolor: '#f5f5f5',
                            borderColor: '#ddd'
                          }
                        }}
                        onClick={() => setTabValue(2)}
                      >
                        <PrintIcon sx={{ fontSize: 32 }} />
                        <Typography variant="body2">Print Jobs</Typography>
                      </Button>
                    </Grid>
                    <Grid item xs={6}>
                      <Button
                        fullWidth
                        variant="outlined"
                        sx={{ 
                          py: 2, 
                          borderColor: '#eee', 
                          color: 'black', 
                          display: 'flex', 
                          flexDirection: 'column',
                          gap: 1,
                          '&:hover': {
                            bgcolor: '#f5f5f5',
                            borderColor: '#ddd'
                          }
                        }}
                        onClick={() => setTabValue(5)}
                      >
                        <HistoryIcon sx={{ fontSize: 32 }} />
                        <Typography variant="body2">History</Typography>
                      </Button>
                    </Grid>
                    <Grid item xs={6}>
                      <Button
                        fullWidth
                        variant="outlined"
                        sx={{ 
                          py: 2, 
                          borderColor: '#eee', 
                          color: 'black', 
                          display: 'flex', 
                          flexDirection: 'column',
                          gap: 1,
                          '&:hover': {
                            bgcolor: '#f5f5f5',
                            borderColor: '#ddd'
                          }
                        }}
                        onClick={() => navigate('/profile/add-points')}
                      >
                        <PointsIcon sx={{ fontSize: 32 }} />
                        <Typography variant="body2">Get Points</Typography>
                      </Button>
                    </Grid>
                  </Grid>
                  
                  <Box sx={{ mt: 3, textAlign: 'center' }}>
                    <Typography variant="h5" fontWeight="bold">
                      {user?.points || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Available Points
                    </Typography>
                  </Box>
                </Paper>
              </Grid>

              {/* Print Stats Card - Redesigned */}
              <Grid item xs={12} md={8}>
                <Paper elevation={0} sx={{ p: 3, height: '100%', borderRadius: 1, border: '1px solid #eee' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" fontWeight="medium">
                      Printing Statistics
                    </Typography>
                    <Button 
                      variant="text" 
                      size="small" 
                      endIcon={<RefreshIcon />}
                      onClick={() => fetchPrintJobs(true)}
                      sx={{ color: 'black', textTransform: 'none' }}
                    >
                      Refresh
                    </Button>
                  </Box>
                  
                  {jobsLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                      <CircularProgress size={30} sx={{ color: 'black' }} />
                    </Box>
                  ) : (
                    <>
                      <Box sx={{ display: 'flex', mb: 3, p: 1, justifyContent: 'space-between' }}>
                  <Box sx={{ 
                          flex: 1, 
                          borderRight: '1px solid #eee', 
                          display: 'flex', 
                          flexDirection: 'column', 
                          alignItems: 'center',
                          p: 2
                        }}>
                          <Typography variant="h3" fontWeight="medium">{printJobs.length}</Typography>
                          <Typography variant="body2" color="text.secondary">Total Jobs</Typography>
                        </Box>
                        <Box sx={{ 
                          flex: 1, 
                          borderRight: '1px solid #eee', 
                          display: 'flex', 
                          flexDirection: 'column', 
                          alignItems: 'center',
                          p: 2
                        }}>
                          <Typography variant="h3" fontWeight="medium" sx={{ color: '#ff9800' }}>
                            {calculatePointsStatistics().pendingJobs}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">Pending</Typography>
                        </Box>
                        <Box sx={{ 
                          flex: 1, 
                          borderRight: '1px solid #eee', 
                          display: 'flex', 
                          flexDirection: 'column', 
                          alignItems: 'center',
                          p: 2
                        }}>
                          <Typography variant="h3" fontWeight="medium" sx={{ color: '#4caf50' }}>
                            {calculatePointsStatistics().completedJobs}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">Completed</Typography>
                        </Box>
                        <Box sx={{ 
                          flex: 1, 
                          display: 'flex', 
                          flexDirection: 'column', 
                          alignItems: 'center',
                          p: 2
                        }}>
                          <Typography variant="h3" fontWeight="medium" sx={{ color: '#f44336' }}>
                            {calculatePointsStatistics().totalPointsUsed}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">Points Used</Typography>
                        </Box>
                      </Box>
                      
                      <Divider sx={{ mb: 2 }} />
                      
                      <Typography variant="subtitle2" fontWeight="medium" sx={{ mb: 1 }}>
                        Most Recent Jobs
                      </Typography>
                      
                      <Box sx={{ maxHeight: 260, overflow: 'auto' }}>
                        {printJobs.length > 0 ? (
                          printJobs.slice(0, 5).map((job) => (
                            <Box 
                              key={job._id}
                              sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                p: 1, 
                                mb: 1,
                                borderRadius: 1,
                                '&:hover': { bgcolor: '#f9f9f9' }
                              }}
                            >
                              <Avatar 
                                variant="rounded" 
                                sx={{ bgcolor: '#f5f5f5', color: 'black', mr: 2 }}
                              >
                                <DescriptionIcon />
                              </Avatar>
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="body2" fontWeight="medium" noWrap>
                                  {job.fileName}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {formatDate(job.createdAt)}
                                </Typography>
                              </Box>
                              <Box 
                                sx={{ 
                                  py: 0.5, 
                                  px: 1.5, 
                                  borderRadius: 10, 
                                  bgcolor: `${getStatusColor(job.status)}15`,
                                  color: getStatusColor(job.status),
                                  fontSize: '0.75rem',
                                  fontWeight: 'medium',
                                  textTransform: 'capitalize'
                                }}
                              >
                                {job.status}
                              </Box>
                            </Box>
                          ))
                        ) : (
                          <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
                            <Typography variant="body2">No print jobs yet</Typography>
                          </Box>
                        )}
                      </Box>
                    </>
                  )}
                </Paper>
              </Grid>
              
              {/* System Notifications Card */}
              <Grid item xs={12} md={6}>
                <Paper elevation={0} sx={{ p: 3, borderRadius: 1, border: '1px solid #eee' }}>
                  <Typography variant="h6" fontWeight="medium" gutterBottom>
                    System Notifications
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Box sx={{ height: 260, overflow: 'auto' }}>
                    <Box sx={{ 
                      p: 2, 
                      mb: 2, 
                      borderRadius: 1, 
                      bgcolor: '#f9f9f9', 
                      border: '1px solid #eee' 
                    }}>
                      <Typography variant="body2" fontWeight="medium">
                        Printer 2 Maintenance Scheduled
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                        Today at 9:00 AM
                      </Typography>
                      <Typography variant="body2">
                        Printer 2 will be unavailable on May 15th due to scheduled maintenance.
                      </Typography>
                    </Box>
                    
                    <Box sx={{ 
                      p: 2, 
                      mb: 2, 
                      borderRadius: 1, 
                      bgcolor: '#f9f9f9', 
                      border: '1px solid #eee' 
                    }}>
                      <Typography variant="body2" fontWeight="medium">
                        New Paper Stock Available
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                        Yesterday at 2:30 PM
                      </Typography>
                      <Typography variant="body2">
                        Premium glossy paper is now available for photo printing.
                      </Typography>
                    </Box>
                    
                    <Box sx={{ 
                      p: 2, 
                      mb: 2, 
                      borderRadius: 1, 
                      bgcolor: '#f9f9f9', 
                      border: '1px solid #eee' 
                    }}>
                      <Typography variant="body2" fontWeight="medium">
                        System Maintenance Complete
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                        May 1, 2023
                      </Typography>
                      <Typography variant="body2">
                        The system maintenance has been completed successfully.
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              </Grid>
              
              {/* Recent Activity Card */}
              <Grid item xs={12} md={6}>
                <Paper elevation={0} sx={{ p: 3, borderRadius: 1, border: '1px solid #eee' }}>
                  <Typography variant="h6" fontWeight="medium" gutterBottom>
                    Recent Activity
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Box sx={{ height: 260, overflow: 'auto' }}>
                    {calculatePointsStatistics().pointsPerJob.length > 0 ? (
                      calculatePointsStatistics().pointsPerJob.map((job, index) => (
                        <Box 
                          key={index} 
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'flex-start', 
                            mb: 2, 
                            p: 1,
                            borderRadius: 1,
                            '&:hover': { bgcolor: '#f9f9f9' }
                          }}
                        >
                          <Box 
                            sx={{ 
                              width: 36, 
                              height: 36, 
                              bgcolor: '#f5f5f5', 
                              borderRadius: '50%', 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              mr: 2
                            }}
                          >
                            <PrintIcon fontSize="small" />
                          </Box>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" fontWeight="medium">
                              Document Printed
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block">
                              {formatDate(job.date)}
                            </Typography>
                            <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                              {job.fileName}
                            </Typography>
                          </Box>
                          <Chip 
                            label={`-${job.pointsUsed} points`} 
                            size="small" 
                            sx={{ bgcolor: '#ffebee', color: '#d32f2f' }} 
                          />
                        </Box>
                      ))
                    ) : (
                      <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
                        <Typography variant="body2">No recent activity</Typography>
                      </Box>
                    )}
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Profile Tab */}
          <TabPanel value={tabValue} index={6}>
            <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold', color: 'black' }}>
              My Profile
            </Typography>
            
            <Grid container spacing={3}>
              {/* User Info Card */}
              <Grid item xs={12} md={5}>
                <Paper elevation={0} sx={{ p: 0, height: '100%', borderRadius: 1, border: '1px solid #eee', overflow: 'hidden' }}>
                  <Box sx={{ bgcolor: 'black', height: 100 }} />
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center',
                    mt: -5,
                    p: 3
                  }}>
                    <Avatar
                      src={user?.profilePicture || ''}
                      alt={user?.name}
                      sx={{ 
                        width: 100, 
                        height: 100, 
                        mb: 2, 
                        border: '4px solid white',
                        bgcolor: '#bdbdbd',
                        fontSize: 40
                      }}
                    >
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </Avatar>
                    
                    <Typography variant="h5" gutterBottom fontWeight="medium">
                      {user?.name}
                    </Typography>
                    
                    <Chip 
                      label="Verified Account" 
                      size="small"
                      sx={{ 
                        bgcolor: '#e8f5e9',
                        color: '#2e7d32',
                        fontWeight: 'medium',
                        mb: 2
                      }}
                    />
                    
                    <Box sx={{ width: '100%' }}>
                      <Box sx={{ display: 'flex', mb: 2 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ width: 120 }}>
                          Email:
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {user?.email}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', mb: 2 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ width: 120 }}>
                          Student ID:
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {user?.studentId || 'Not set'}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', mb: 2 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ width: 120 }}>
                          RFID Card:
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {user?.rfidCardNumber || 'Not set'}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', mb: 2 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ width: 120 }}>
                          Phone:
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {user?.phone || 'Not set'}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', mb: 3 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ width: 120 }}>
                          Joined:
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {user?.createdAt ? formatDate(user.createdAt) : 'Unknown'}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{ 
                      width: '100%',
                      bgcolor: '#f5f5f5', 
                      p: 3, 
                      borderRadius: 1,
                      textAlign: 'center'
                    }}>
                      <Typography variant="h6" gutterBottom>
                        Available Points
                      </Typography>
                      <Typography variant="h2" fontWeight="bold" sx={{ mb: 1 }}>
                        {user?.points || 0}
                      </Typography>
                      <Button 
                        variant="contained" 
                        fullWidth
                        sx={{ 
                          bgcolor: 'black', 
                          color: 'white', 
                          '&:hover': { bgcolor: '#333' },
                          textTransform: 'uppercase',
                          py: 1,
                          fontWeight: 'bold'
                        }}
                        onClick={() => navigate('/profile/add-points')}
                      >
                        Get More Points
                      </Button>
                    </Box>
                  </Box>
                </Paper>
              </Grid>

              {/* Additional Profile Info */}
              <Grid item xs={12} md={7}>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Paper elevation={0} sx={{ p: 3, borderRadius: 1, border: '1px solid #eee' }}>
                      <Typography variant="h6" fontWeight="medium" gutterBottom>
                        Account Information
                  </Typography>
                      <Divider sx={{ mb: 2 }} />
                      
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Edit your account information and change your password here.
                      </Typography>
                      
                      <Box sx={{ display: 'flex', mt: 2, gap: 2 }}>
                        <Button 
                          variant="outlined" 
                          sx={{ color: 'black', borderColor: 'rgba(0,0,0,0.23)', textTransform: 'none' }}
                          onClick={() => setTabValue(3)}
                        >
                          Change Password
                        </Button>
                        <Button 
                          variant="outlined" 
                          sx={{ color: 'black', borderColor: 'rgba(0,0,0,0.23)', textTransform: 'none' }}
                          onClick={() => setTabValue(7)}
                        >
                          Edit Profile
                        </Button>
                    </Box>
                    </Paper>
                      </Grid>
                      
                  <Grid item xs={12}>
                    <Paper elevation={0} sx={{ p: 3, borderRadius: 1, border: '1px solid #eee' }}>
                      <Typography variant="h6" fontWeight="medium" gutterBottom>
                        Printing Summary
                            </Typography>
                      <Divider sx={{ mb: 2 }} />
                      
                      <Grid container spacing={3}>
                        <Grid item xs={6}>
                          <Box sx={{ textAlign: 'center', p: 2 }}>
                            <Typography variant="h4" fontWeight="medium">
                              {printJobs.length}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Total Print Jobs
                            </Typography>
                          </Box>
                      </Grid>
                      
                        <Grid item xs={6}>
                          <Box sx={{ textAlign: 'center', p: 2 }}>
                            <Typography variant="h4" fontWeight="medium">
                              {calculatePointsStatistics().totalPointsUsed}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Points Used
                            </Typography>
                          </Box>
                      </Grid>
              </Grid>
              
                      <Button 
                        fullWidth 
                        variant="outlined"
                        sx={{ mt: 2, color: 'black', borderColor: 'rgba(0,0,0,0.23)', textTransform: 'none' }}
                        onClick={() => setTabValue(5)}
                      >
                        View Print History
                      </Button>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Paper elevation={0} sx={{ p: 3, borderRadius: 1, border: '1px solid #eee' }}>
                      <Typography variant="h6" fontWeight="medium" gutterBottom>
                        Device Information
                                  </Typography>
                      <Divider sx={{ mb: 2 }} />
                      
                      <Box sx={{ display: 'flex', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ width: 120 }}>
                          Last Login:
                          </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {formatDate(new Date())}
                          </Typography>
                        </Box>
                        
                      <Box sx={{ display: 'flex', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ width: 120 }}>
                          Browser:
                          </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {navigator.userAgent.split(' ').slice(-2, -1)[0].split('/')[0]}
                          </Typography>
                        </Box>
                        
                      <Box sx={{ display: 'flex', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ width: 120 }}>
                          Platform:
                          </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {navigator.platform}
                          </Typography>
                        </Box>
                </Paper>
                  </Grid>
                </Grid>
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
              <Typography variant="h4" fontWeight="bold" color="black">
                My Print Jobs
              </Typography>
              
              <Button
                variant="contained"
                startIcon={<FileUploadIcon />}
                onClick={() => setTabValue(1)}
                sx={{ borderRadius: 1, textTransform: 'none', bgcolor: 'black', '&:hover': { bgcolor: '#333' } }}
              >
                Upload New PDF
              </Button>
            </Box>
            
            <Paper elevation={0} sx={{ p: 3, borderRadius: 1, border: '1px solid #eee' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" fontWeight="medium" sx={{ display: 'flex', alignItems: 'center' }}>
                  <PrintIcon sx={{ mr: 1, color: 'black' }} />
                  Print Queue
                </Typography>
                
                <Box>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<RefreshIcon />}
                    onClick={() => fetchPrintJobs(true)}
                    sx={{ borderRadius: 1, textTransform: 'none', color: 'black', borderColor: 'rgba(0,0,0,0.23)' }}
                  >
                    Refresh Jobs
                  </Button>
                </Box>
              </Box>
              
              {jobsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress size={30} sx={{ color: 'black' }} />
                </Box>
              ) : (
                <Box>
                  {printJobs.length === 0 ? (
                    <Paper 
                      elevation={0}
                      sx={{ 
                        p: 4, 
                        textAlign: 'center',
                        backgroundColor: '#f9f9f9',
                        borderRadius: 1,
                        border: '1px solid #eee'
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
                        size="medium"
                        sx={{ borderRadius: 1, textTransform: 'none', bgcolor: 'black', '&:hover': { bgcolor: '#333' } }}
                      >
                        Upload a PDF Now
                      </Button>
                    </Paper>
                  ) : (
                    <Box sx={{ overflow: 'auto' }}>
                      <Table sx={{ minWidth: 800 }}>
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 'bold', bgcolor: 'white' }}>File Name</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', bgcolor: 'white' }}>Upload Date</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', bgcolor: 'white' }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', bgcolor: 'white' }}>Details</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', bgcolor: 'white' }}>Actions</TableCell>
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

          {/* History Tab */}
          <TabPanel value={tabValue} index={5}>
            <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold', color: 'black' }}>
              Print History
            </Typography>
            
            <Paper elevation={0} sx={{ p: 3, borderRadius: 1, border: '1px solid #eee' }}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom fontWeight="medium">
                  Your Printing History
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  View your completed print jobs and points used
                </Typography>
              </Box>
              
              <Divider sx={{ mb: 3 }} />
              
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>File Name</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Date Completed</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Points Used</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {printJobs
                      .filter(job => job.status === 'completed')
                      .map((job) => (
                        <TableRow key={job._id}>
                          <TableCell>{job.fileName}</TableCell>
                          <TableCell>{formatDate(job.updatedAt || job.createdAt)}</TableCell>
                          <TableCell>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                color: '#d32f2f', 
                                fontWeight: 'medium',
                                display: 'flex',
                                alignItems: 'center'
                              }}
                            >
                              -{job.pointCost || job.printSettings?.totalPages || 0} points
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))
                    }
                    
                    {printJobs.filter(job => job.status === 'completed').length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} align="center" sx={{ py: 3 }}>
                          <Typography variant="body2" color="text.secondary">
                            No completed print jobs available
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </TabPanel>

          {/* Settings Tab */}
          <TabPanel value={tabValue} index={7}>
            <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold', color: 'black' }}>
              Settings
            </Typography>
            
            <Paper elevation={0} sx={{ p: 3, borderRadius: 1, border: '1px solid #eee', maxWidth: 800, mx: 'auto' }}>
              <Box sx={{ mb: 3, textAlign: 'center' }}>
                <Avatar sx={{ 
                  width: 70, 
                  height: 70, 
                  mx: 'auto', 
                  mb: 2, 
                  bgcolor: '#f5f5f5', 
                  color: 'black'
                }}>
                  <SettingsIcon sx={{ fontSize: 40 }} />
                </Avatar>
                <Typography variant="h6" gutterBottom fontWeight="medium">
                  Account Settings
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Manage your account preferences and settings
                </Typography>
        </Box>
              
              <Divider sx={{ mb: 3 }} />
              
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                    Notification Settings
                  </Typography>
                  <Box sx={{ 
                    p: 2, 
                    borderRadius: 1, 
                    border: '1px solid #eee', 
                    bgcolor: '#f9f9f9',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <Box>
                      <Typography variant="body1" fontWeight="medium">Email Notifications</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Receive email notifications for important updates
                      </Typography>
                    </Box>
                    <Button variant="outlined" sx={{ color: 'black', borderColor: 'rgba(0,0,0,0.23)', textTransform: 'none' }}>
                      Manage
                    </Button>
                  </Box>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                    Account Preferences
                  </Typography>
                  <Box sx={{ 
                    p: 2, 
                    borderRadius: 1, 
                    border: '1px solid #eee', 
                    bgcolor: '#f9f9f9',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <Box>
                      <Typography variant="body1" fontWeight="medium">Language Settings</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Change your preferred language
                      </Typography>
                    </Box>
                    <Button variant="outlined" sx={{ color: 'black', borderColor: 'rgba(0,0,0,0.23)', textTransform: 'none' }}>
                      English
                    </Button>
                  </Box>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                    Privacy & Security
                  </Typography>
                  <Box sx={{ 
                    p: 2, 
                    borderRadius: 1, 
                    border: '1px solid #eee', 
                    bgcolor: '#f9f9f9',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <Box>
                      <Typography variant="body1" fontWeight="medium">Two-Factor Authentication</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Add an extra layer of security to your account
                      </Typography>
                    </Box>
                    <Button variant="outlined" sx={{ color: 'black', borderColor: 'rgba(0,0,0,0.23)', textTransform: 'none' }}>
                      Enable
                    </Button>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sx={{ mt: 2 }}>
                  <Button 
                    variant="contained" 
                    fullWidth 
                    sx={{ 
                      bgcolor: 'black', 
                      color: 'white', 
                      textTransform: 'none',
                      '&:hover': { bgcolor: '#333' },
                      py: 1.5
                    }}
                  >
                    Save Settings
                  </Button>
                </Grid>
              </Grid>
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
        PaperProps={{
          sx: { borderRadius: 1 }
        }}
      >
        <DialogTitle sx={{ bgcolor: 'black', color: 'white' }}>
          Print Settings
          <IconButton
            aria-label="close"
            onClick={() => setSettingsDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8, color: 'white' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedJob && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight="medium">
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
                  border: '1px solid #eee',
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
                      <Typography variant="body1" fontWeight="medium" sx={{ color: 'black' }}>
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
          <Button 
            onClick={() => setSettingsDialogOpen(false)}
            sx={{ color: 'black', textTransform: 'none' }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* PDF Preview Dialog */}
      <Dialog
        open={pdfPreviewOpen}
        onClose={handleClosePreview}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { height: '85vh', maxHeight: '85vh', borderRadius: 1 }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'black', color: 'white' }}>
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
                <CircularProgress size={40} sx={{ color: 'black' }} />
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
            sx={{ color: 'black', textTransform: 'none' }}
          >
            Download
          </Button>
          <Button 
            startIcon={<OpenInNewIcon />}
            onClick={() => previewUrl && window.open(previewUrl, '_blank', 'noopener,noreferrer')}
            disabled={!previewUrl}
            sx={{ color: 'black', textTransform: 'none' }}
          >
            Open in New Tab
          </Button>
          <Button 
            onClick={handleClosePreview}
            variant="outlined"
            sx={{ color: 'black', borderColor: 'rgba(0,0,0,0.23)', textTransform: 'none' }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Dashboard; 