import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Grid, 
  Paper, 
  Typography, 
  Card, 
  CardContent, 
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Button,
  Divider,
  Chip,
  IconButton,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { 
  People as PeopleIcon, 
  Print as PrintIcon, 
  Pending as PendingIcon, 
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  LocalPrintshop as LocalPrintshopIcon,
  Refresh as RefreshIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import { adminAPI } from '../../utils/api';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPrintJobs: 0,
    pendingJobs: 0,
    completedJobs: 0,
    cancelledJobs: 0,
    totalPoints: 0
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentPrintJobs, setRecentPrintJobs] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getDashboardStats();
      
      setStats(data.stats);
      setRecentUsers(data.recentUsers);
      setRecentPrintJobs(data.recentPrintJobs);
      setError('');
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Format date to readable string
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

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'processing': return 'info';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress sx={{ color: '#000' }} />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: '500', color: '#000' }}>
          Admin Dashboard
        </Typography>
        <IconButton 
          onClick={fetchDashboardData} 
          sx={{ 
            bgcolor: '#000', 
            color: 'white',
            '&:hover': { bgcolor: '#333' }
          }}
        >
          <RefreshIcon />
        </IconButton>
      </Box>
      
      {error && (
        <Paper 
          elevation={0}
          sx={{ 
            p: 2, 
            mb: 3, 
            bgcolor: 'error.light',
            border: '1px solid',
            borderColor: 'error.main',
            borderRadius: 1
          }}
        >
          <Typography color="error">{error}</Typography>
          <Button 
            variant="contained" 
            color="error" 
            onClick={fetchDashboardData} 
            sx={{ mt: 1, bgcolor: '#000' }}
          >
            Retry
          </Button>
        </Paper>
      )}
      
      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card 
            elevation={0}
            sx={{ 
              borderRadius: 2, 
              border: '1px solid', 
              borderColor: 'divider',
              height: '100%'
            }}
          >
            <CardContent sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
              <Box sx={{ 
                mr: 2, 
                p: 1.5, 
                borderRadius: '50%', 
                bgcolor: 'rgba(0,0,0,0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <PeopleIcon sx={{ fontSize: 40, color: '#000' }} />
              </Box>
              <Box>
                <Typography variant="h4" fontWeight="500">
                  {stats.totalUsers}
                </Typography>
                <Typography color="text.secondary" variant="body1">
                  Total Users
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <Card 
            elevation={0}
            sx={{ 
              borderRadius: 2, 
              border: '1px solid', 
              borderColor: 'divider',
              height: '100%'
            }}
          >
            <CardContent sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
              <Box sx={{ 
                mr: 2, 
                p: 1.5, 
                borderRadius: '50%', 
                bgcolor: 'rgba(0,0,0,0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <LocalPrintshopIcon sx={{ fontSize: 40, color: '#000' }} />
              </Box>
              <Box>
                <Typography variant="h4" fontWeight="500">
                  {stats.totalPrintJobs}
                </Typography>
                <Typography color="text.secondary" variant="body1">
                  Total Print Jobs
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <Card 
            elevation={0}
            sx={{ 
              borderRadius: 2,
              bgcolor: '#000', 
              color: 'white',
              border: '1px solid',
              borderColor: '#000',
              height: '100%'
            }}
          >
            <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <Typography variant="h4" fontWeight="500">
                {stats.totalPoints.toLocaleString()}
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.8 }}>
                Total Points in System
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={4}>
          <Card 
            elevation={0}
            sx={{ 
              borderRadius: 2,
              border: '1px solid',
              borderColor: theme.palette.warning.main,
              boxShadow: '0 4px 12px rgba(255, 152, 0, 0.1)'
            }}
          >
            <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ 
                mr: 2, 
                p: 1.5, 
                borderRadius: '50%', 
                bgcolor: 'warning.light',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <PendingIcon sx={{ fontSize: 36, color: 'warning.dark' }} />
              </Box>
              <Box>
                <Typography variant="h5" fontWeight="500">
                  {stats.pendingJobs}
                </Typography>
                <Typography color="warning.main" fontWeight="500">
                  Pending Jobs
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={4}>
          <Card 
            elevation={0}
            sx={{ 
              borderRadius: 2,
              border: '1px solid',
              borderColor: theme.palette.success.main,
              boxShadow: '0 4px 12px rgba(76, 175, 80, 0.1)'
            }}
          >
            <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ 
                mr: 2, 
                p: 1.5, 
                borderRadius: '50%', 
                bgcolor: 'success.light',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <CheckCircleIcon sx={{ fontSize: 36, color: 'success.dark' }} />
              </Box>
              <Box>
                <Typography variant="h5" fontWeight="500">
                  {stats.completedJobs}
                </Typography>
                <Typography color="success.main" fontWeight="500">
                  Completed Jobs
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={4}>
          <Card 
            elevation={0}
            sx={{ 
              borderRadius: 2,
              border: '1px solid',
              borderColor: theme.palette.error.main,
              boxShadow: '0 4px 12px rgba(244, 67, 54, 0.1)'
            }}
          >
            <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ 
                mr: 2, 
                p: 1.5, 
                borderRadius: '50%', 
                bgcolor: 'error.light',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <CancelIcon sx={{ fontSize: 36, color: 'error.dark' }} />
              </Box>
              <Box>
                <Typography variant="h5" fontWeight="500">
                  {stats.cancelledJobs}
                </Typography>
                <Typography color="error.main" fontWeight="500">
                  Cancelled Jobs
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Recent Users and Print Jobs */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper 
            elevation={0}
            sx={{ 
              p: 3, 
              borderRadius: 2, 
              border: '1px solid', 
              borderColor: 'divider',
              height: '100%'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" fontWeight="500">
                Recent Users
              </Typography>
              <Button 
                variant="outlined" 
                size="small"
                endIcon={<ArrowForwardIcon />}
                onClick={() => navigate('/admin/users')}
                sx={{
                  borderColor: '#000',
                  color: '#000',
                  borderRadius: 1,
                  textTransform: 'none',
                  fontWeight: '500',
                  '&:hover': {
                    bgcolor: 'rgba(0,0,0,0.05)',
                    borderColor: '#000'
                  }
                }}
              >
                View All
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />
            
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: '500', color: '#000' }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: '500', color: '#000' }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: '500', color: '#000' }}>Student ID</TableCell>
                    <TableCell sx={{ fontWeight: '500', color: '#000' }}>Joined Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentUsers.length > 0 ? (
                    recentUsers.map((user) => (
                      <TableRow key={user._id} 
                        sx={{ 
                          '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' },
                          cursor: 'pointer'
                        }}
                        onClick={() => navigate(`/admin/users/${user._id}`)}
                      >
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.studentId}</TableCell>
                        <TableCell>{formatDate(user.createdAt)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} align="center">No users found</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
        
        {/* Recent Print Jobs */}
        <Grid item xs={12} md={6}>
          <Paper 
            elevation={0}
            sx={{ 
              p: 3, 
              borderRadius: 2, 
              border: '1px solid', 
              borderColor: 'divider',
              height: '100%'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" fontWeight="500">
                Recent Print Jobs
              </Typography>
              <Button 
                variant="outlined" 
                size="small"
                endIcon={<ArrowForwardIcon />}
                onClick={() => navigate('/admin/print-jobs')}
                sx={{
                  borderColor: '#000',
                  color: '#000',
                  borderRadius: 1,
                  textTransform: 'none',
                  fontWeight: '500',
                  '&:hover': {
                    bgcolor: 'rgba(0,0,0,0.05)',
                    borderColor: '#000'
                  }
                }}
              >
                View All
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />
            
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: '500', color: '#000' }}>File Name</TableCell>
                    <TableCell sx={{ fontWeight: '500', color: '#000' }}>Student</TableCell>
                    <TableCell sx={{ fontWeight: '500', color: '#000' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: '500', color: '#000' }}>Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentPrintJobs.length > 0 ? (
                    recentPrintJobs.map((job) => (
                      <TableRow key={job._id} 
                        sx={{ 
                          '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' },
                          cursor: 'pointer'
                        }}
                        onClick={() => navigate(`/admin/print-jobs/${job._id}`)}
                      >
                        <TableCell sx={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {job.fileName}
                        </TableCell>
                        <TableCell>
                          {job.userId?.name || 'Unknown'}
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={job.status.charAt(0).toUpperCase() + job.status.slice(1)} 
                            color={getStatusColor(job.status)}
                            size="small"
                            sx={{ 
                              fontWeight: '500',
                              fontSize: '0.75rem',
                              height: '22px'
                            }}
                          />
                        </TableCell>
                        <TableCell>{formatDate(job.createdAt)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} align="center">No print jobs found</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default AdminDashboard; 