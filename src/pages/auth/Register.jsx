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

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name || !formData.email || !formData.password) {
      setError('Please fill in all required fields');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      console.log('Registration attempt with:', { email: formData.email, name: formData.name });
      
      // Log the full request URL for debugging
      console.log('Request URL:', 'http://localhost:8080/api/auth/register');
      
      const data = await authAPI.register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });
      console.log('Registration response:', data);
      
      // Store token in localStorage
      localStorage.setItem('token', data.token);
      
      // Redirect to dashboard instead of home page
      navigate('/dashboard');
    } catch (err) {
      console.error('Registration error details:', err);
      
      // More detailed error information
      if (err.response) {
        // The server responded with an error
        console.error('Server response:', err.response.data);
        setError(err.response.data.message || 'Registration failed. Server returned an error.');
      } else if (err.request) {
        // The request was made but no response was received
        console.error('No response received:', err.request);
        setError('Server did not respond. Please check your network connection.');
      } else {
        // Something else happened in setting up the request
        setError(err.message || 'Registration failed. Please try again.');
      }
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
            Create an account
          </Typography>
          
          <Typography variant="body1" color="text.secondary" gutterBottom>
            Enter your email below to create your account
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
            Name
          </Typography>
          <TextField
            fullWidth
            name="name"
            placeholder="John Doe"
            variant="outlined"
            size="medium"
            value={formData.name}
            onChange={handleChange}
            sx={{ 
              mt: -1,
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
              }
            }}
          />
          
          <Typography variant="subtitle1" fontWeight="medium">
            Email
          </Typography>
          <TextField
            fullWidth
            name="email"
            placeholder="m@example.com"
            variant="outlined"
            size="medium"
            value={formData.email}
            onChange={handleChange}
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
            name="password"
            type="password"
            variant="outlined"
            size="medium"
            value={formData.password}
            onChange={handleChange}
            sx={{ 
              mt: -1,
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
              }
            }}
          />
          
          <Typography variant="subtitle1" fontWeight="medium">
            Confirm Password
          </Typography>
          <TextField
            fullWidth
            name="confirmPassword"
            type="password"
            variant="outlined"
            size="medium"
            value={formData.confirmPassword}
            onChange={handleChange}
            sx={{ 
              mt: -1,
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
              }
            }}
          />
          
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
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Create account'}
          </Button>
          
          <Typography variant="body2" color="text.secondary" align="center">
            Already have an account?{' '}
            <Link 
              component="button" 
              onClick={() => navigate('/login')}
              underline="hover" 
              color="primary" 
              fontWeight="medium"
            >
              Sign in
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default Register; 