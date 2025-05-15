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
  Chip
} from '@mui/material';
import { 
  People as PeopleIcon, 
  Print as PrintIcon, 
  Pending as PendingIcon, 
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  LocalPrintshop as LocalPrintshopIcon
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
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>
      
      {error && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'error.light' }}>
          <Typography color="error">{error}</Typography>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={fetchDashboardData} 
            sx={{ mt: 1 }}
          >
            Retry
          </Button>
        </Paper>
      )}
      
      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
              <PeopleIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
              <Box>
                <Typography variant="h5" component="div">
                  {stats.totalUsers}
                </Typography>
                <Typography color="text.secondary">
                  Total Users
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
              <LocalPrintshopIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
              <Box>
                <Typography variant="h5" component="div">
                  {stats.totalPrintJobs}
                </Typography>
                <Typography color="text.secondary">
                  Total Print Jobs
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center', bgcolor: 'primary.light', color: 'white' }}>
              <Typography variant="h5" component="div">
                {stats.totalPoints.toLocaleString()}
              </Typography>
              <Typography>
                Total Points in System
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center', bgcolor: 'warning.light' }}>
              <PendingIcon sx={{ fontSize: 36, color: 'warning.dark', mr: 2 }} />
              <Box>
                <Typography variant="h5" component="div">
                  {stats.pendingJobs}
                </Typography>
                <Typography color="warning.dark">
                  Pending Jobs
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center', bgcolor: 'success.light' }}>
              <CheckCircleIcon sx={{ fontSize: 36, color: 'success.dark', mr: 2 }} />
              <Box>
                <Typography variant="h5" component="div">
                  {stats.completedJobs}
                </Typography>
                <Typography color="success.dark">
                  Completed Jobs
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center', bgcolor: 'error.light' }}>
              <CancelIcon sx={{ fontSize: 36, color: 'error.dark', mr: 2 }} />
              <Box>
                <Typography variant="h5" component="div">
                  {stats.cancelledJobs}
                </Typography>
                <Typography color="error.dark">
                  Cancelled Jobs
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Recent Users */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" gutterBottom component="div">
                Recent Users
              </Typography>
              <Button 
                variant="contained" 
                size="small"
                onClick={() => navigate('/admin/users')}
              >
                View All
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />
            
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Student ID</TableCell>
                    <TableCell>Joined Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentUsers.length > 0 ? (
                    recentUsers.map((user) => (
                      <TableRow key={user._id}>
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
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" gutterBottom component="div">
                Recent Print Jobs
              </Typography>
              <Button 
                variant="contained" 
                size="small"
                onClick={() => navigate('/admin/print-jobs')}
              >
                View All
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />
            
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>File Name</TableCell>
                    <TableCell>Student</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentPrintJobs.length > 0 ? (
                    recentPrintJobs.map((job) => (
                      <TableRow key={job._id}>
                        <TableCell>{job.fileName}</TableCell>
                        <TableCell>
                          {job.userId?.name || 'Unknown'}
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={job.status} 
                            color={getStatusColor(job.status)}
                            size="small"
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