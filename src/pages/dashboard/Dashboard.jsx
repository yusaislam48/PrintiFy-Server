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
} from '@mui/icons-material';
import { authAPI } from '../../utils/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
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
            <ListItem button selected>
              <ListItemIcon>
                <DashboardIcon />
              </ListItemIcon>
              <ListItemText primary="Dashboard" />
            </ListItem>
            <ListItem button>
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
                    12
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    4 in progress, 8 completed
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
                    27
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Last print: 3 hours ago
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
                  <ListItem divider>
                    <ListItemIcon>
                      <PrintIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Invoice #1234 Printed"
                      secondary="Today, 11:30 AM"
                    />
                  </ListItem>
                  <ListItem divider>
                    <ListItemIcon>
                      <DescriptionIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="New Template Created"
                      secondary="Yesterday, 4:20 PM"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <PrintIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Business Card Batch Printed"
                      secondary="May 12, 2023"
                    />
                  </ListItem>
                </List>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard; 