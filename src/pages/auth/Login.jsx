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
      
      // Redirect to dashboard instead of home page
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error details:', err);
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 4, height: '100vh', display: 'flex', alignItems: 'center' }}>
      <Paper
        elevation={1}
        sx={{
          width: '100%',
          p: { xs: 3, sm: 4 },
          borderRadius: 2,
          border: '1px solid #eaeaea',
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
          <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
            Sign in
          </Typography>
          
          <Typography variant="body1" color="text.secondary" gutterBottom>
            Enter your email and password to sign in
          </Typography>
          
          {error && <Alert severity="error">{error}</Alert>}
          
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<GitHubIcon />}
              sx={{ py: 1.5, textTransform: 'none', borderColor: '#e0e0e0', color: 'text.primary' }}
            >
              GitHub
            </Button>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<GoogleIcon />}
              sx={{ py: 1.5, textTransform: 'none', borderColor: '#e0e0e0', color: 'text.primary' }}
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
              bgcolor: '#111',
              color: '#fff',
              textTransform: 'none',
              fontWeight: 'medium',
              borderRadius: '8px',
              '&:hover': {
                bgcolor: '#333',
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
  );
};

export default Login; 