import React, { useState, useEffect } from 'react';
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
  InputAdornment,
} from '@mui/material';
import { GitHub as GitHubIcon, Google as GoogleIcon } from '@mui/icons-material';
import { authAPI } from '../../utils/api';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    studentId: '',
    email: '',
    phone: '',
    rfidCardNumber: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Update email when student ID changes
  useEffect(() => {
    if (formData.studentId) {
      setFormData(prevData => ({
        ...prevData,
        email: `${formData.studentId}@iub.edu.bd`
      }));
    }
  }, [formData.studentId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name || !formData.studentId || !formData.password || !formData.phone || !formData.rfidCardNumber) {
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

    // Phone validation (simple check for numeric and length)
    if (!/^\d{11}$/.test(formData.phone)) {
      setError('Phone number must be 11 digits');
      return;
    }

    // RFID Card Number validation (must be valid hexadecimal)
    if (!/^0\d{9}$/.test(formData.rfidCardNumber)) {
      setError('RFID Card Number must be a 10-digit number starting with 0');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      console.log('Registration attempt with:', { 
        email: formData.email, 
        name: formData.name,
        studentId: formData.studentId,
        phone: formData.phone,
        rfidCardNumber: formData.rfidCardNumber
      });
      
      const data = await authAPI.register({
        name: formData.name,
        email: formData.email,
        studentId: formData.studentId,
        phone: formData.phone,
        rfidCardNumber: formData.rfidCardNumber,
        password: formData.password,
      });
      
      // Navigate to verification page with email in state
      navigate('/verify-email', { state: { email: formData.email } });
      
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
            Create an account
          </Typography>
          
              <Typography variant="body1" color="text.secondary">
                Join PrintiFy to start sending your print jobs
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
            Full Name
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
            Student ID
          </Typography>
          <TextField
            fullWidth
            name="studentId"
              placeholder="1234567"
            variant="outlined"
            size="medium"
            value={formData.studentId}
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
              disabled
            variant="outlined"
            size="medium"
            value={formData.email}
            InputProps={{
              readOnly: true,
            }}
            sx={{ 
              mt: -1,
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
              }
            }}
          />
          
          <Typography variant="subtitle1" fontWeight="medium">
            Phone Number
          </Typography>
          <TextField
            fullWidth
            name="phone"
            placeholder="01711223344"
            variant="outlined"
            size="medium"
            value={formData.phone}
            onChange={handleChange}
            sx={{ 
              mt: -1,
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
              }
            }}
          />
          
          <Typography variant="subtitle1" fontWeight="medium">
            RFID Card Number
          </Typography>
          <TextField
            fullWidth
            name="rfidCardNumber"
            placeholder="0000012345"
            variant="outlined"
            size="medium"
            value={formData.rfidCardNumber}
            onChange={handleChange}
            helperText="10-digit number starting with 0"
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
    </Box>
  );
};

export default Register; 