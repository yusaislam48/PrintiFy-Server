import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  Alert,
  Switch,
  FormControlLabel,
  Divider,
  Card,
  CardContent,
  CardActions,
  CircularProgress
} from '@mui/material';
import {
  Save as SaveIcon,
  Security as SecurityIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';

const AdminSettings = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  // System Settings
  const [systemSettings, setSystemSettings] = useState({
    defaultPointsForNewUsers: 10,
    pointsPerPage: 1,
    maxPrintJobsPerDay: 20,
    allowGuestPrinting: false,
    enableEmailNotifications: true,
    autoDeleteCompletedJobs: false,
    autoDeleteDaysThreshold: 30
  });
  
  // Security Settings
  const [securitySettings, setSecuritySettings] = useState({
    requireEmailVerification: true,
    sessionTimeoutMinutes: 60,
    maxLoginAttempts: 5,
    passwordMinLength: 8,
    requireStrongPasswords: true
  });

  // Handle system settings change
  const handleSystemSettingChange = (e) => {
    const { name, value, checked, type } = e.target;
    setSystemSettings({
      ...systemSettings,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? Number(value) : value)
    });
  };

  // Handle security settings change
  const handleSecuritySettingChange = (e) => {
    const { name, value, checked, type } = e.target;
    setSecuritySettings({
      ...securitySettings,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? Number(value) : value)
    });
  };

  // Save system settings
  const saveSystemSettings = () => {
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setSuccess('System settings saved successfully');
      setLoading(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    }, 1000);
  };

  // Save security settings
  const saveSecuritySettings = () => {
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setSuccess('Security settings saved successfully');
      setLoading(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    }, 1000);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Admin Settings
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}
      
      <Grid container spacing={3}>
        {/* System Settings */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <SettingsIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">
                System Settings
              </Typography>
            </Box>
            <Divider sx={{ mb: 3 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Default Points for New Users"
                  name="defaultPointsForNewUsers"
                  type="number"
                  value={systemSettings.defaultPointsForNewUsers}
                  onChange={handleSystemSettingChange}
                  InputProps={{ inputProps: { min: 0 } }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Points Per Page"
                  name="pointsPerPage"
                  type="number"
                  value={systemSettings.pointsPerPage}
                  onChange={handleSystemSettingChange}
                  InputProps={{ inputProps: { min: 1 } }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Max Print Jobs Per Day"
                  name="maxPrintJobsPerDay"
                  type="number"
                  value={systemSettings.maxPrintJobsPerDay}
                  onChange={handleSystemSettingChange}
                  InputProps={{ inputProps: { min: 1 } }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      name="allowGuestPrinting"
                      checked={systemSettings.allowGuestPrinting}
                      onChange={handleSystemSettingChange}
                      color="primary"
                    />
                  }
                  label="Allow Guest Printing"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      name="enableEmailNotifications"
                      checked={systemSettings.enableEmailNotifications}
                      onChange={handleSystemSettingChange}
                      color="primary"
                    />
                  }
                  label="Email Notifications"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      name="autoDeleteCompletedJobs"
                      checked={systemSettings.autoDeleteCompletedJobs}
                      onChange={handleSystemSettingChange}
                      color="primary"
                    />
                  }
                  label="Auto-Delete Completed Jobs"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Auto-Delete Days Threshold"
                  name="autoDeleteDaysThreshold"
                  type="number"
                  value={systemSettings.autoDeleteDaysThreshold}
                  onChange={handleSystemSettingChange}
                  disabled={!systemSettings.autoDeleteCompletedJobs}
                  InputProps={{ inputProps: { min: 1 } }}
                />
              </Grid>
            </Grid>
            
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                onClick={saveSystemSettings}
                disabled={loading}
              >
                Save System Settings
              </Button>
            </Box>
          </Paper>
        </Grid>
        
        {/* Security Settings */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <SecurityIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">
                Security Settings
              </Typography>
            </Box>
            <Divider sx={{ mb: 3 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      name="requireEmailVerification"
                      checked={securitySettings.requireEmailVerification}
                      onChange={handleSecuritySettingChange}
                      color="primary"
                    />
                  }
                  label="Require Email Verification"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Session Timeout (minutes)"
                  name="sessionTimeoutMinutes"
                  type="number"
                  value={securitySettings.sessionTimeoutMinutes}
                  onChange={handleSecuritySettingChange}
                  InputProps={{ inputProps: { min: 5 } }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Max Login Attempts"
                  name="maxLoginAttempts"
                  type="number"
                  value={securitySettings.maxLoginAttempts}
                  onChange={handleSecuritySettingChange}
                  InputProps={{ inputProps: { min: 1 } }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Minimum Password Length"
                  name="passwordMinLength"
                  type="number"
                  value={securitySettings.passwordMinLength}
                  onChange={handleSecuritySettingChange}
                  InputProps={{ inputProps: { min: 6 } }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      name="requireStrongPasswords"
                      checked={securitySettings.requireStrongPasswords}
                      onChange={handleSecuritySettingChange}
                      color="primary"
                    />
                  }
                  label="Require Strong Passwords"
                />
              </Grid>
            </Grid>
            
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                color="secondary"
                startIcon={loading ? <CircularProgress size={20} /> : <SecurityIcon />}
                onClick={saveSecuritySettings}
                disabled={loading}
              >
                Save Security Settings
              </Button>
            </Box>
          </Paper>
        </Grid>
        
        {/* Master Admin Tools */}
        <Grid item xs={12}>
          <Card sx={{ bgcolor: '#f9f9f9' }}>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Master Admin Tools
              </Typography>
              <Typography variant="body2" color="text.secondary">
                These actions can only be performed by Master Admins and affect the entire system.
                Use with caution!
              </Typography>
            </CardContent>
            <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
              <Button 
                variant="outlined" 
                color="error"
                sx={{ mr: 1 }}
              >
                Reset All Points
              </Button>
              <Button 
                variant="outlined" 
                color="warning"
                sx={{ mr: 1 }}
              >
                Clear All Print Jobs
              </Button>
              <Button 
                variant="contained" 
                color="error"
              >
                System Maintenance Mode
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default AdminSettings; 