import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Container,
  Paper,
  Alert,
  CircularProgress,
} from '@mui/material';
import { authAPI } from '../../utils/api';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Generate a temporary password
      const newPassword = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
      
      // Call the reset-password endpoint using authAPI
      await authAPI.resetPassword({
        email,
        newPassword
      });
      
      // Show success message
      setSuccess(true);
      
    } catch (err) {
      console.error('Reset password error:', err);
      setError(err.message || 'Failed to reset password');
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
            Reset Password
          </Typography>
          
          {!success ? (
            <>
              <Typography variant="body1" color="text.secondary" gutterBottom>
                Enter your email address to reset your password
              </Typography>
              
              {error && <Alert severity="error">{error}</Alert>}
              
              <Typography variant="subtitle1" fontWeight="medium">
                Email
              </Typography>
              <TextField
                fullWidth
                placeholder="your@email.com"
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
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Reset Password'}
              </Button>
            </>
          ) : (
            <>
              <Alert severity="success" sx={{ mb: 2 }}>
                Password reset successful!
              </Alert>
              
              <Typography variant="body1">
                A temporary password has been sent to your email address. Please check your inbox and spam folder.
              </Typography>
              
              <Typography variant="body2" color="text.secondary" mt={2}>
                Use the temporary password to log in, then change it from your account settings.
              </Typography>
              
              <Button
                variant="contained"
                fullWidth
                disableElevation
                onClick={() => navigate('/login')}
                sx={{
                  py: 1.5,
                  mt: 2,
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
                Return to Login
              </Button>
            </>
          )}
          
          <Typography variant="body2" color="text.secondary" align="center">
            Remember your password?{' '}
            <Button
              variant="text"
              onClick={() => navigate('/login')}
              sx={{ fontWeight: 'medium', p: 0, minWidth: 'auto' }}
            >
              Sign in
            </Button>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default ForgotPassword; 