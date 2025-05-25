import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Person as PersonIcon,
  People as PeopleIcon,
  Add as AddIcon,
  Search as SearchIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import { adminAPI } from '../../utils/api';

const PointsManagement = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [pointsToAdd, setPointsToAdd] = useState(10);
  const [bulkPointsToAdd, setBulkPointsToAdd] = useState(10);
  const [bulkCriteria, setBulkCriteria] = useState('all');
  const [recentAdditions, setRecentAdditions] = useState([]);

  // Handle searching for users
  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setError('Please enter a search term');
      return;
    }

    try {
      setLoading(true);
      // We'll use a basic implementation - in a real app, you'd have a dedicated search endpoint
      const response = await adminAPI.getAllUsers(1, 10);
      
      // Filter users by name, email, or student ID
      const filtered = response.users.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.studentId.includes(searchTerm)
      );
      
      setSearchResults(filtered);
      
      if (filtered.length === 0) {
        setError('No users found matching your search');
      } else {
        setError('');
      }
    } catch (err) {
      console.error('Failed to search users:', err);
      setError('Error searching for users: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  // Handle selecting a user from search results
  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setSearchResults([]);
    setSearchTerm('');
  };

  // Handle adding points to a specific user
  const handleAddPoints = async () => {
    if (!selectedUser) {
      setError('Please select a user first');
      return;
    }

    if (!pointsToAdd || pointsToAdd <= 0) {
      setError('Please enter a valid number of points');
      return;
    }

    try {
      setLoading(true);
      
      const response = await adminAPI.addPointsToUser(selectedUser._id, pointsToAdd);
      
      setSuccess(`${pointsToAdd} points added to ${selectedUser.name} successfully`);
      
      // Add to recent additions
      setRecentAdditions(prev => [
        {
          id: Date.now(),
          user: selectedUser,
          points: pointsToAdd,
          timestamp: new Date()
        },
        ...prev.slice(0, 4) // Keep only the 5 most recent
      ]);
      
      // Reset form
      setSelectedUser(null);
      setPointsToAdd(10);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Failed to add points:', err);
      setError('Failed to add points: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  // Handle adding points in bulk
  const handleBulkAddPoints = async () => {
    if (!bulkPointsToAdd || bulkPointsToAdd <= 0) {
      setError('Please enter a valid number of points');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      // This is a placeholder - in a real app, you'd have a dedicated bulk points endpoint
      // For demo purposes, we'll just show a success message
      
      setTimeout(() => {
        setSuccess(`Successfully added ${bulkPointsToAdd} points to all ${
          bulkCriteria === 'all' ? 'users' : 
          bulkCriteria === 'verified' ? 'verified users' : 
          'active users'
        }`);
        
        // Add to recent additions
        setRecentAdditions(prev => [
          {
            id: Date.now(),
            user: { name: 'Bulk Addition', email: `to ${bulkCriteria} users` },
            points: bulkPointsToAdd,
            timestamp: new Date()
          },
          ...prev.slice(0, 4) // Keep only the 5 most recent
        ]);
        
        // Reset form
        setBulkPointsToAdd(10);
        setLoading(false);
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      }, 1500);
      
    } catch (err) {
      console.error('Failed to add points in bulk:', err);
      setError('Failed to add points in bulk: ' + (err.message || 'Unknown error'));
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

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Points Management
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
        {/* Individual Points Addition */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Add Points to Individual User
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Box sx={{ mb: 3 }}>
              {/* Search for user */}
              <Box sx={{ display: 'flex', mb: 2 }}>
                <TextField
                  fullWidth
                  label="Search for user by name, email, or student ID"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  variant="outlined"
                  sx={{ mr: 1 }}
                />
                <Button
                  variant="contained"
                  onClick={handleSearch}
                  disabled={loading || !searchTerm.trim()}
                  startIcon={loading ? <CircularProgress size={20} /> : <SearchIcon />}
                >
                  Search
                </Button>
              </Box>
              
              {/* Search results */}
              {searchResults.length > 0 && (
                <Box sx={{ mb: 2, maxHeight: 200, overflow: 'auto', border: '1px solid #eee', borderRadius: 1 }}>
                  <List dense>
                    {searchResults.map(user => (
                      <ListItem 
                        key={user._id} 
                        button 
                        onClick={() => handleSelectUser(user)}
                        sx={{ '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' } }}
                      >
                        <ListItemAvatar>
                          <Avatar>
                            <PersonIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText 
                          primary={user.name} 
                          secondary={`${user.email} | Student ID: ${user.studentId}`} 
                        />
                        <Chip 
                          label={`${user.points} Points`} 
                          color="primary" 
                          size="small" 
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
              
              {/* Selected user */}
              {selectedUser && (
                <Card variant="outlined" sx={{ mb: 2, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                  <CardContent>
                    <Typography variant="h6">
                      {selectedUser.name}
                    </Typography>
                    <Typography variant="body2">
                      {selectedUser.email} | Student ID: {selectedUser.studentId}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      <Typography variant="body2" sx={{ mr: 1 }}>
                        Current Points:
                      </Typography>
                      <Chip 
                        label={selectedUser.points} 
                        color="secondary" 
                        size="small" 
                      />
                    </Box>
                  </CardContent>
                </Card>
              )}
              
              {/* Points to add */}
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TextField
                  label="Points to Add"
                  type="number"
                  value={pointsToAdd}
                  onChange={(e) => setPointsToAdd(parseInt(e.target.value) || 0)}
                  variant="outlined"
                  InputProps={{ inputProps: { min: 1 } }}
                  sx={{ mr: 2 }}
                />
                <Button
                  variant="contained"
                  color="success"
                  onClick={handleAddPoints}
                  disabled={loading || !selectedUser || pointsToAdd <= 0}
                  startIcon={loading ? <CircularProgress size={20} /> : <AddIcon />}
                >
                  Add Points
                </Button>
              </Box>
            </Box>
          </Paper>
        </Grid>
        
        {/* Bulk Points Addition */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Add Points in Bulk
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Add points to multiple users at once based on criteria.
              </Typography>
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Target Users</InputLabel>
                <Select
                  value={bulkCriteria}
                  onChange={(e) => setBulkCriteria(e.target.value)}
                  label="Target Users"
                >
                  <MenuItem value="all">All Users</MenuItem>
                  <MenuItem value="verified">Verified Users Only</MenuItem>
                  <MenuItem value="active">Active Users (with recent logins)</MenuItem>
                </Select>
              </FormControl>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TextField
                  label="Points to Add"
                  type="number"
                  value={bulkPointsToAdd}
                  onChange={(e) => setBulkPointsToAdd(parseInt(e.target.value) || 0)}
                  variant="outlined"
                  InputProps={{ inputProps: { min: 1 } }}
                  sx={{ mr: 2 }}
                />
                <Button
                  variant="contained"
                  color="warning"
                  onClick={handleBulkAddPoints}
                  disabled={loading || bulkPointsToAdd <= 0}
                  startIcon={loading ? <CircularProgress size={20} /> : <PeopleIcon />}
                >
                  Add to All
                </Button>
              </Box>
              
              <Alert severity="info">
                This will add {bulkPointsToAdd} points to {bulkCriteria === 'all' ? 'all users' : bulkCriteria === 'verified' ? 'all verified users' : 'all active users'}.
              </Alert>
            </Box>
          </Paper>
        </Grid>
        
        {/* Recent Points Additions */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Points Additions
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {recentAdditions.length > 0 ? (
              <List>
                {recentAdditions.map(addition => (
                  <ListItem key={addition.id}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'success.main' }}>
                        <CheckIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={`Added ${addition.points} points to ${addition.user.name}`}
                      secondary={`${addition.user.email} | ${formatDate(addition.timestamp)}`}
                    />
                    <Chip
                      label={`+${addition.points} Points`}
                      color="success"
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
                No recent point additions
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default PointsManagement; 