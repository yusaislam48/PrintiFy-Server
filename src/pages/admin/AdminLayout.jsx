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
  Chip,
  ListItemButton
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
  SupervisorAccount as AdminIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import { authAPI } from '../../utils/api';

const drawerWidth = 240;
const collapsedDrawerWidth = 70;

const AdminLayout = () => {
  const [open, setOpen] = useState(true);
  const [user, setUser] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));

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
    { text: 'History', icon: <HistoryIcon />, path: '/admin/history' },
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
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: '#fafafa' }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', bgcolor: '#fafafa', minHeight: '100vh' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: '#000',
          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
          width: { sm: `calc(100% - ${open ? drawerWidth : collapsedDrawerWidth}px)` },
          ml: { sm: `${open ? drawerWidth : collapsedDrawerWidth}px` },
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontWeight: 500 }}>
            PrintiFy Admin
          </Typography>
          
          {/* User Dashboard Button */}
          <Button 
            variant="outlined" 
            color="inherit" 
            size="small"
            onClick={() => navigate('/dashboard')}
            sx={{ 
              mr: 2, 
              borderRadius: 1, 
              textTransform: 'none',
              borderColor: 'rgba(255,255,255,0.5)',
              '&:hover': {
                borderColor: 'white',
                backgroundColor: 'rgba(255,255,255,0.08)'
              },
              display: { xs: 'none', sm: 'flex' }
            }}
            startIcon={<PersonIcon />}
          >
            User Dashboard
          </Button>
          
          {/* Admin Badge */}
          <Chip
            label={user?.role === 'master' ? 'Master Admin' : 'Admin'}
            color="default"
            size="small"
            sx={{ 
              mr: 2, 
              fontWeight: 'bold',
              bgcolor: user?.role === 'master' ? 'secondary.main' : 'primary.main',
              color: 'white'
            }}
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
              sx={{ 
                width: 32, 
                height: 32, 
                bgcolor: 'white',
                color: '#000',
                fontWeight: 'bold'
              }}
            >
              {user?.name?.charAt(0)?.toUpperCase() || 'A'}
            </Avatar>
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleProfileMenuClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            PaperProps={{
              sx: {
                mt: 1,
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                minWidth: 180
              }
            }}
          >
            <MenuItem onClick={() => navigate('/profile')}>
              <ListItemIcon>
                <PersonIcon fontSize="small" />
              </ListItemIcon>
              Profile
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" sx={{ color: 'error.main' }} />
              </ListItemIcon>
              <Typography color="error">Logout</Typography>
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={isMobile ? open : true}
        onClose={isMobile ? handleDrawerToggle : undefined}
        sx={{
          width: open ? drawerWidth : collapsedDrawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: open ? drawerWidth : collapsedDrawerWidth,
            boxSizing: 'border-box',
            bgcolor: '#000',
            color: 'white',
            overflowX: 'hidden',
            transition: theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          },
        }}
      >
        <Box sx={{ 
          height: 64, 
          display: 'flex', 
          alignItems: 'center', 
          px: 2,
          justifyContent: open ? 'space-between' : 'center'
        }}>
          {open && (
            <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold' }}>
              PrintiFy
            </Typography>
          )}
          
          {!isMobile && (
            <IconButton onClick={handleDrawerToggle} sx={{ color: 'white' }}>
              <ChevronLeftIcon />
            </IconButton>
          )}
        </Box>
        
        <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
        
        <Box sx={{ 
          mt: 2, 
          mb: 2, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: open ? 'flex-start' : 'center',
          px: open ? 2 : 0
        }}>
          <Avatar
            alt={user?.name || 'Admin'}
            src=""
            sx={{ 
              width: open ? 80 : 40, 
              height: open ? 80 : 40, 
              bgcolor: 'white',
              color: '#000',
              fontWeight: 'bold',
              mb: 1
            }}
          >
            {user?.name?.charAt(0)?.toUpperCase() || 'A'}
          </Avatar>
          
          {open && (
            <>
              <Typography variant="h6" sx={{ fontWeight: '500', color: 'white', mt: 1 }}>
                {user?.name || 'Admin User'}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 1 }}>
                {user?.email || 'admin@printify.com'}
              </Typography>
              <Chip
                label={user?.role === 'master' ? 'Master Admin' : 'Admin'}
                size="small"
                sx={{ 
                  fontWeight: 'bold',
                  bgcolor: user?.role === 'master' ? 'secondary.main' : 'primary.main',
                  color: 'white'
                }}
              />
            </>
          )}
        </Box>
        
        <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
        
        <List sx={{ px: open ? 1 : 0 }}>
          {navItems.map((item) => (
            <ListItem key={item.text} disablePadding sx={{ 
              display: 'block',
              mb: 0.5
            }}>
              <ListItemButton
                onClick={() => navigate(item.path)}
                selected={isActivePath(item.path)}
                sx={{
                  minHeight: 48,
                  justifyContent: open ? 'initial' : 'center',
                  px: 2.5,
                  borderRadius: 1,
                  '&.Mui-selected': {
                    bgcolor: 'rgba(255,255,255,0.15)',
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.25)',
                    },
                  },
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.1)',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: open ? 2 : 'auto',
                    justifyContent: 'center',
                    color: 'white'
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                {open && <ListItemText primary={item.text} />}
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        
        <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)', mt: 'auto' }} />
        
        <List sx={{ px: open ? 1 : 0 }}>
          <ListItem disablePadding sx={{ display: 'block' }}>
            <ListItemButton
              onClick={() => navigate('/dashboard')}
              sx={{
                minHeight: 48,
                justifyContent: open ? 'initial' : 'center',
                px: 2.5,
                borderRadius: 1,
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.1)',
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: open ? 2 : 'auto',
                  justifyContent: 'center',
                  color: 'white'
                }}
              >
                <PersonIcon />
              </ListItemIcon>
              {open && <ListItemText primary="User Dashboard" />}
            </ListItemButton>
          </ListItem>
          
          <ListItem disablePadding sx={{ display: 'block' }}>
            <ListItemButton
              onClick={handleLogout}
              sx={{
                minHeight: 48,
                justifyContent: open ? 'initial' : 'center',
                px: 2.5,
                borderRadius: 1,
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.1)',
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: open ? 2 : 'auto',
                  justifyContent: 'center',
                  color: 'white'
                }}
              >
                <LogoutIcon />
              </ListItemIcon>
              {open && <ListItemText primary={<Typography color="error.light">Logout</Typography>} />}
            </ListItemButton>
          </ListItem>
        </List>
      </Drawer>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${open ? drawerWidth : collapsedDrawerWidth}px)` },
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          ml: { xs: 0, sm: `${collapsedDrawerWidth}px` },
          bgcolor: '#fafafa',
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
};

export default AdminLayout; 