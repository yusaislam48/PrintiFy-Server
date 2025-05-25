import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Container,
  Link,
  Paper,
  Divider,
  Stack,
  Alert,
  CircularProgress,
} from '@mui/material';
import { GitHub as GitHubIcon, Google as GoogleIcon } from '@mui/icons-material';
import { authAPI } from '../../utils/api';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      console.log('Login attempt with:', { email });
      
      // Direct API call instead of using authAPI.login
      const response = await fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // Check if the error is due to unverified email
        if (response.status === 403 && 
            data.message === 'Email not verified' && 
            data.email) {
          // Redirect to verification page
          navigate('/verify-email', { 
            state: { email: data.email } 
          });
          return;
        }
        
        throw new Error(data.message || 'Login failed. Please check your credentials.');
      }
      
      console.log('Login response:', data);
      
      // Store tokens in localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('refreshToken', data.refreshToken);
      
      // Check user role and redirect accordingly
      try {
        // Fetch user data to determine role
        const userData = await authAPI.getCurrentUser();
        
        // Store user data in localStorage
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Redirect based on role
        if (userData.role === 'admin' || userData.role === 'master' || userData.isAdmin === true) {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      } catch (userError) {
        console.error('Error fetching user data:', userError);
        // If we can't determine role, default to dashboard
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Login error details:', err);
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      minHeight: '100vh', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: '#f5f7fa'
    }}>
      <Container maxWidth="sm" sx={{ py: 4 }}>
      <Paper
          elevation={2}
        sx={{
          width: '100%',
          p: { xs: 3, sm: 4 },
            borderRadius: 3,
            boxShadow: '0 6px 20px rgba(0,0,0,0.08)'
        }}
      >
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
          }}
        >
            <Box sx={{ textAlign: 'center', mb: 2 }}>
          <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
                PrintiFy Login
          </Typography>
          
              <Typography variant="body1" color="text.secondary">
                Enter your credentials to access the printing dashboard
          </Typography>
            </Box>
          
            {error && <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>}
          
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<GitHubIcon />}
                sx={{ 
                  py: 1.5, 
                  textTransform: 'none', 
                  borderColor: '#e0e0e0', 
                  color: 'text.primary',
                  borderRadius: 2
                }}
            >
              GitHub
            </Button>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<GoogleIcon />}
                sx={{ 
                  py: 1.5, 
                  textTransform: 'none', 
                  borderColor: '#e0e0e0', 
                  color: 'text.primary',
                  borderRadius: 2
                }}
            >
              Google
            </Button>
          </Stack>
          
          <Box sx={{ display: 'flex', alignItems: 'center', my: 1 }}>
            <Divider sx={{ flexGrow: 1 }} />
            <Typography variant="body2" color="text.secondary" sx={{ px: 2 }}>
              OR CONTINUE WITH
            </Typography>
            <Divider sx={{ flexGrow: 1 }} />
          </Box>
          
          <Typography variant="subtitle1" fontWeight="medium">
            Email
          </Typography>
          <TextField
            fullWidth
            placeholder="m@example.com"
            variant="outlined"
            size="medium"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            sx={{ 
              mt: -1,
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
              }
            }}
          />
          
          <Typography variant="subtitle1" fontWeight="medium">
            Password
          </Typography>
          <TextField
            fullWidth
            type="password"
            variant="outlined"
            size="medium"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            sx={{ 
              mt: -1,
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
              }
            }}
          />
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: -2 }}>
            <Link
              component="button"
              type="button"
              variant="body2"
              onClick={() => navigate('/forgot-password')}
              underline="hover"
              sx={{ fontSize: '0.875rem' }}
            >
              Forgot password?
            </Link>
          </Box>
          
          <Button
            type="submit"
            variant="contained"
            fullWidth
            disableElevation
            disabled={loading}
            sx={{
              py: 1.5,
              mt: 1,
                bgcolor: '#1a237e',
              color: '#fff',
              textTransform: 'none',
              fontWeight: 'medium',
              borderRadius: '8px',
              '&:hover': {
                  bgcolor: '#303f9f',
              },
            }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign in'}
          </Button>
          
          <Typography variant="body2" color="text.secondary" align="center">
            Don't have an account?{' '}
            <Link 
              component="button" 
              onClick={() => navigate('/register')}
              underline="hover" 
              color="primary" 
              fontWeight="medium"
            >
              Create an account
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Container>
    </Box>
  );
};

export default Login; 