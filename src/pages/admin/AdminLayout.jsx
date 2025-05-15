import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  useMediaQuery,
  useTheme,
  Button,
  Chip
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Print as PrintIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  PointOfSale as PointsIcon,
  ChevronLeft as ChevronLeftIcon,
  Person as PersonIcon,
  SupervisorAccount as AdminIcon
} from '@mui/icons-material';
import { authAPI } from '../../utils/api';

const drawerWidth = 240;

const AdminLayout = () => {
  const [open, setOpen] = useState(true);
  const [user, setUser] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Auto-close drawer on mobile
  useEffect(() => {
    if (isMobile) {
      setOpen(false);
    } else {
      setOpen(true);
    }
  }, [isMobile]);

  // Fetch current user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userData = await authAPI.getCurrentUser();
        
        // Check if user is admin
        if (!(userData.role === 'admin' || userData.role === 'master' || userData.isAdmin === true)) {
          // Redirect to dashboard if not admin
          navigate('/dashboard');
          return;
        }
        
        setUser(userData);
      } catch (error) {
        console.error('Failed to fetch user data:', error);
        // Redirect to login if authentication fails
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    authAPI.logout();
    navigate('/login');
  };

  // Navigation links
  const navItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/admin' },
    { text: 'Users', icon: <PeopleIcon />, path: '/admin/users' },
    { text: 'Print Jobs', icon: <PrintIcon />, path: '/admin/print-jobs' },
    { text: 'Points Management', icon: <PointsIcon />, path: '/admin/points' },
    { text: 'Settings', icon: <SettingsIcon />, path: '/admin/settings' },
  ];

  // If master admin, add admin management
  if (user?.role === 'master') {
    navItems.push({ text: 'Admin Management', icon: <AdminIcon />, path: '/admin/admins' });
  }

  // Check if path is active
  const isActivePath = (path) => {
    if (path === '/admin' && location.pathname === '/admin') {
      return true;
    }
    if (path !== '/admin' && location.pathname.startsWith(path)) {
      return true;
    }
    return false;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: '#111',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            PrintiFy Admin
          </Typography>
          
          {/* User Dashboard Button */}
          <Button 
            variant="outlined" 
            color="inherit" 
            size="small"
            onClick={() => navigate('/dashboard')}
            sx={{ mr: 2, borderRadius: 2, textTransform: 'none' }}
            startIcon={<PersonIcon />}
          >
            User Dashboard
          </Button>
          
          {/* Admin Badge */}
          <Chip
            label={user?.role === 'master' ? 'Master Admin' : 'Admin'}
            color={user?.role === 'master' ? 'secondary' : 'primary'}
            size="small"
            sx={{ mr: 2 }}
          />
          
          {/* Avatar and Profile Menu */}
          <IconButton
            size="large"
            edge="end"
            aria-label="account of current user"
            aria-haspopup="true"
            onClick={handleProfileMenuOpen}
            color="inherit"
          >
            <Avatar
              alt={user?.name || 'Admin'}
              src=""
              sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}
            >
              {user?.name?.charAt(0) || 'A'}
            </Avatar>
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleProfileMenuClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem onClick={() => navigate('/profile')}>
              <ListItemIcon>
                <PersonIcon fontSize="small" />
              </ListItemIcon>
              Profile
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Drawer
        variant={isMobile ? 'temporary' : 'persistent'}
        open={open}
        onClose={isMobile ? handleDrawerToggle : undefined}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          {!isMobile && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1 }}>
              <IconButton onClick={handleDrawerToggle}>
                <ChevronLeftIcon />
              </IconButton>
            </Box>
          )}
          
          <Divider />
          <List>
            {navItems.map((item) => (
              <ListItem
                button
                key={item.text}
                onClick={() => navigate(item.path)}
                selected={isActivePath(item.path)}
                sx={{
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(0, 120, 212, 0.1)',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 120, 212, 0.2)',
                    },
                  },
                }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItem>
            ))}
          </List>
          <Divider />
          <List>
            <ListItem button onClick={() => navigate('/dashboard')}>
              <ListItemIcon>
                <PersonIcon />
              </ListItemIcon>
              <ListItemText primary="User Dashboard" />
            </ListItem>
            <ListItem button onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItem>
          </List>
        </Box>
      </Drawer>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${open ? drawerWidth : 0}px)` },
          ml: { sm: `${open ? drawerWidth : 0}px` },
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
};

export default AdminLayout; 