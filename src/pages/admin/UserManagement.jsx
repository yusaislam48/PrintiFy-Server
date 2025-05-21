import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  CircularProgress,
  Chip,
  Alert,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  OutlinedInput,
  useTheme,
  Grid
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  AddCircle as AddCircleIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { adminAPI } from '../../utils/api';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalUsers, setTotalUsers] = useState(0);
  const [selectedUser, setSelectedUser] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [pointsDialogOpen, setPointsDialogOpen] = useState(false);
  const [pointsToAdd, setPointsToAdd] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [filters, setFilters] = useState({
    role: 'all',
    verified: 'all'
  });
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    studentId: '',
    rfidCardNumber: '',
    phone: '',
    role: '',
    points: 0,
    isVerified: false,
    isAdmin: false
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userRole, setUserRole] = useState('');
  const theme = useTheme();

  // Fetch current user to determine role
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const userData = await adminAPI.getCurrentUser();
        setUserRole(userData.role);
      } catch (error) {
        console.error('Failed to fetch current user:', error);
      }
    };
    
    fetchCurrentUser();
  }, []);

  // Fetch users on initial load and when page or rowsPerPage changes
  useEffect(() => {
    fetchUsers();
  }, [page, rowsPerPage, searchQuery, filters.role, filters.verified]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Prepare options for API call
      const options = {};
      
      // Add search parameter if there's a search query
      if (searchQuery.trim()) {
        options.search = searchQuery.trim();
      }
      
      // Add role filter if not set to 'all'
      if (filters.role !== 'all') {
        options.role = filters.role;
      }
      
      // Add verified filter if not set to 'all'
      if (filters.verified !== 'all') {
        options.verified = filters.verified === 'verified';
      }
      
      const response = await adminAPI.getAllUsers(page + 1, rowsPerPage, options);
      
      setUsers(response.users);
      setTotalUsers(response.pagination.total);
      setError('');
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setError('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle search functionality
  const handleSearch = () => {
    setPage(0); // Reset to first page
    fetchUsers();
  };

  // Apply search when enter key pressed
  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Clear search and reset users
  const handleClearSearch = () => {
    setSearchQuery('');
    fetchUsers();
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Edit user
  const handleOpenEditDialog = (user) => {
    setSelectedUser(user);
    setEditFormData({
      name: user.name,
      email: user.email,
      studentId: user.studentId,
      rfidCardNumber: user.rfidCardNumber || '',
      phone: user.phone,
      role: user.role,
      points: user.points,
      isVerified: user.isVerified,
      isAdmin: user.isAdmin
    });
    setEditDialogOpen(true);
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    
    // Special handling for RFID Card Number - only allow digits and max 10 characters
    if (name === 'rfidCardNumber') {
      // Only accept digits and limit to 10 characters
      const newValue = value.replace(/[^\d]/g, '').slice(0, 10);
      setEditFormData({
        ...editFormData,
        [name]: newValue
      });
      return;
    }
    
    setEditFormData({
      ...editFormData,
      [name]: value
    });
  };

  const handleSubmitEdit = async () => {
    try {
      setLoading(true);
      
      // Only master admins can edit master admins
      if (selectedUser.role === 'master' && userRole !== 'master') {
        setError('Only master admins can edit other master admins');
        setEditDialogOpen(false);
        setLoading(false);
        return;
      }
      
      // Validate RFID Card Number format if provided
      if (editFormData.rfidCardNumber && !/^0\d{9}$/.test(editFormData.rfidCardNumber)) {
        setError('RFID Card Number must be a 10-digit number starting with 0');
        setLoading(false);
        return;
      }
      
      await adminAPI.updateUser(selectedUser._id, editFormData);
      
      // Update the user in the local state
      setUsers(users.map(user => 
        user._id === selectedUser._id ? { ...user, ...editFormData } : user
      ));
      
      setSuccess('User updated successfully');
      setEditDialogOpen(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Failed to update user:', err);
      setError('Failed to update user: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  // Delete user
  const handleOpenDeleteDialog = (user) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const handleDeleteUser = async () => {
    try {
      setLoading(true);
      
      // Only master admins can delete master admins
      if (selectedUser.role === 'master' && userRole !== 'master') {
        setError('Only master admins can delete master admins');
        setDeleteDialogOpen(false);
        setLoading(false);
        return;
      }
      
      const result = await adminAPI.deleteUser(selectedUser._id);
      console.log('Delete user result:', result);
      
      // Remove the user from the local state
      setUsers(prevUsers => prevUsers.filter(user => user._id !== selectedUser._id));
      setTotalUsers(prevTotal => prevTotal - 1);
      
      setSuccess('User deleted successfully');
      setDeleteDialogOpen(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Failed to delete user:', err);
      setError('Failed to delete user: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
    }
  };

  // Add points to a user
  const handleOpenPointsDialog = (user) => {
    setSelectedUser(user);
    setPointsToAdd(0);
    setPointsDialogOpen(true);
  };

  const handleAddPoints = async () => {
    try {
      setLoading(true);
      
      await adminAPI.addPointsToUser(selectedUser._id, pointsToAdd);
      
      // Update the user in the local state
      setUsers(users.map(user => 
        user._id === selectedUser._id 
          ? { ...user, points: user.points + Number(pointsToAdd) } 
          : user
      ));
      
      setSuccess(`${pointsToAdd} points added to ${selectedUser.name}`);
      setPointsDialogOpen(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Failed to add points:', err);
      setError('Failed to add points: ' + (err.message || 'Unknown error'));
    } finally {
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

  // Get role color
  const getRoleColor = (role) => {
    switch (role) {
      case 'master': return 'secondary';
      case 'admin': return 'primary';
      default: return 'default';
    }
  };

  // Handle filter dialog open
  const handleOpenFilterDialog = () => {
    setFilterDialogOpen(true);
  };

  // Apply filters
  const handleApplyFilters = () => {
    setPage(0); // Reset to first page
    setFilterDialogOpen(false);
    fetchUsers();
  };

  // Reset filters
  const handleResetFilters = () => {
    setFilters({
      role: 'all',
      verified: 'all'
    });
    setPage(0);
    setFilterDialogOpen(false);
    fetchUsers();
  };

  if (loading && users.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress sx={{ color: '#000' }} />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: '500', color: '#000' }}>
          User Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => { /* handle add user */ }}
          sx={{ 
            bgcolor: '#000', 
            '&:hover': { bgcolor: '#333' }, 
            textTransform: 'none',
            borderRadius: 1
          }}
        >
          Add User
        </Button>
      </Box>
      
      {/* Success Message */}
      {success && (
        <Alert 
          severity="success" 
          sx={{ 
            mb: 2, 
            borderRadius: 1,
            '& .MuiAlert-icon': { color: '#000' },
            '& .MuiAlert-message': { fontWeight: '500' }
          }}
        >
          {success}
        </Alert>
      )}
      
      {/* Error Message */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 2, 
            borderRadius: 1,
            '& .MuiAlert-message': { fontWeight: '500' }
          }}
        >
          {error}
          <Button 
            size="small" 
            onClick={fetchUsers} 
            sx={{ ml: 2, color: '#000', fontWeight: '500' }}
          >
            Retry
          </Button>
        </Alert>
      )}
      
      {/* Search and filters */}
      <Paper 
        elevation={0}
        sx={{ 
          p: 2, 
          mb: 3, 
          borderRadius: 2, 
          border: '1px solid', 
          borderColor: 'divider',
          bgcolor: '#fff' 
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth variant="outlined" size="small">
              <OutlinedInput
                placeholder="Search by name, email, student ID, or RFID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleSearchKeyPress}
                startAdornment={
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                }
                endAdornment={
                  searchQuery && (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={handleClearSearch}
                        edge="end"
                        size="small"
                        sx={{ color: 'text.secondary' }}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  )
                }
              />
            </FormControl>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={handleOpenFilterDialog}
              sx={{ 
                color: '#000', 
                borderColor: '#000',
                '&:hover': { borderColor: '#000', bgcolor: 'rgba(0,0,0,0.04)' },
                textTransform: 'none',
                borderRadius: 1,
                height: '40px'
              }}
            >
              Filter
            </Button>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<SearchIcon />}
              onClick={handleSearch}
              sx={{ 
                color: '#000', 
                borderColor: '#000',
                '&:hover': { borderColor: '#000', bgcolor: 'rgba(0,0,0,0.04)' },
                textTransform: 'none',
                borderRadius: 1,
                height: '40px'
              }}
            >
              Search
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Users Table */}
      <Paper 
        elevation={0}
        sx={{ 
          p: 0, 
          borderRadius: 2, 
          border: '1px solid', 
          borderColor: 'divider',
          overflow: 'hidden',
          bgcolor: '#fff'
        }}
      >
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                <TableCell sx={{ fontWeight: '600', color: '#000' }}>Name</TableCell>
                <TableCell sx={{ fontWeight: '600', color: '#000' }}>Email</TableCell>
                <TableCell sx={{ fontWeight: '600', color: '#000' }}>Student ID</TableCell>
                <TableCell sx={{ fontWeight: '600', color: '#000' }}>RFID Card</TableCell>
                <TableCell sx={{ fontWeight: '600', color: '#000' }}>Role</TableCell>
                <TableCell sx={{ fontWeight: '600', color: '#000' }}>Points</TableCell>
                <TableCell sx={{ fontWeight: '600', color: '#000' }}>Joined Date</TableCell>
                <TableCell sx={{ fontWeight: '600', color: '#000' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: '600', color: '#000' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.length > 0 ? (
                users.map((user) => (
                  <TableRow 
                    key={user._id}
                    sx={{ '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' }, position: 'relative' }}
                  >
                    <TableCell sx={{ fontWeight: '500' }}>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.studentId}</TableCell>
                    <TableCell>{user.rfidCardNumber || '-'}</TableCell>
                    <TableCell>
                      <Chip
                        label={user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        size="small"
                        sx={{ 
                          fontWeight: '500',
                          bgcolor: user.role === 'master' ? 'secondary.main' : (user.role === 'admin' ? 'primary.main' : 'rgba(0,0,0,0.08)'),
                          color: user.role === 'user' ? 'text.primary' : 'white'
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {user.points}
                        <Tooltip title="Add Points">
                          <IconButton 
                            size="small" 
                            onClick={() => handleOpenPointsDialog(user)}
                            sx={{ ml: 1, color: '#000' }}
                          >
                            <AddCircleIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                    <TableCell>{formatDate(user.createdAt)}</TableCell>
                    <TableCell>
                      <Chip
                        label={user.isVerified ? "Verified" : "Unverified"}
                        size="small"
                        color={user.isVerified ? "success" : "warning"}
                        variant="outlined"
                        sx={{ fontWeight: '500' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex' }}>
                        <IconButton 
                          aria-label="edit" 
                          size="small" 
                          onClick={() => handleOpenEditDialog(user)}
                          sx={{ color: '#000' }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton 
                          aria-label="delete" 
                          size="small" 
                          onClick={() => handleOpenDeleteDialog(user)}
                          sx={{ color: theme.palette.error.main }}
                          disabled={user.role === 'master' && userRole !== 'master'}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <Typography variant="body1" sx={{ py: 4, color: 'text.secondary' }}>
                      No users found.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={totalUsers}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{
            borderTop: '1px solid',
            borderColor: 'divider',
            '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
              fontWeight: '500'
            }
          }}
        />
      </Paper>
      
      {/* Edit User Dialog */}
      <Dialog 
        open={editDialogOpen} 
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: '500', pb: 1 }}>
          Edit User
        </DialogTitle>
        <DialogContent dividers>
          <TextField
            autoFocus
            fullWidth
            margin="dense"
            label="Name"
            name="name"
            value={editFormData.name}
            onChange={handleEditFormChange}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            margin="dense"
            label="Email"
            name="email"
            type="email"
            value={editFormData.email}
            onChange={handleEditFormChange}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            margin="dense"
            label="Student ID"
            name="studentId"
            value={editFormData.studentId}
            onChange={handleEditFormChange}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            margin="dense"
            label="RFID Card Number"
            name="rfidCardNumber"
            value={editFormData.rfidCardNumber}
            onChange={handleEditFormChange}
            sx={{ mb: 2 }}
            helperText="10-digit number starting with 0 (e.g., 0000056907)"
          />
          <TextField
            fullWidth
            margin="dense"
            label="Phone"
            name="phone"
            value={editFormData.phone}
            onChange={handleEditFormChange}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            margin="dense"
            label="Points"
            name="points"
            type="number"
            value={editFormData.points}
            onChange={handleEditFormChange}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth margin="dense" sx={{ mb: 2 }}>
            <InputLabel>Role</InputLabel>
            <Select
              name="role"
              value={editFormData.role}
              onChange={handleEditFormChange}
              label="Role"
              disabled={selectedUser?.role === 'master' && userRole !== 'master'}
            >
              <MenuItem value="user">User</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
              {userRole === 'master' && (
                <MenuItem value="master">Master Admin</MenuItem>
              )}
            </Select>
          </FormControl>
          
          <FormControl fullWidth margin="dense" sx={{ mb: 2 }}>
            <InputLabel>Verified Status</InputLabel>
            <Select
              name="isVerified"
              value={editFormData.isVerified}
              onChange={handleEditFormChange}
              label="Verified Status"
            >
              <MenuItem value={true}>Verified</MenuItem>
              <MenuItem value={false}>Unverified</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl fullWidth margin="dense">
            <InputLabel>Admin Access</InputLabel>
            <Select
              name="isAdmin"
              value={editFormData.isAdmin}
              onChange={handleEditFormChange}
              label="Admin Access"
            >
              <MenuItem value={true}>Yes</MenuItem>
              <MenuItem value={false}>No</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button 
            onClick={() => setEditDialogOpen(false)}
            sx={{ color: 'text.secondary', fontWeight: '500' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmitEdit} 
            variant="contained" 
            disabled={loading}
            sx={{ 
              bgcolor: '#000', 
              '&:hover': { bgcolor: '#333' }, 
              fontWeight: '500',
              textTransform: 'none',
              borderRadius: 1
            }}
          >
            {loading ? <CircularProgress size={24} /> : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete User Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: '500', color: theme.palette.error.main }}>
          Delete User
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete user <strong>{selectedUser?.name}</strong>? This action cannot be undone and will remove all data associated with this user.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button 
            onClick={() => setDeleteDialogOpen(false)}
            sx={{ color: 'text.secondary', fontWeight: '500' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteUser}
            color="error"
            variant="contained"
            sx={{ fontWeight: '500', textTransform: 'none', borderRadius: 1 }}
          >
            Delete User
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Add Points Dialog */}
      <Dialog
        open={pointsDialogOpen}
        onClose={() => setPointsDialogOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: '500' }}>
          Add Points to {selectedUser?.name}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Current points balance: <strong>{selectedUser?.points}</strong>
          </Typography>
          <TextField
            autoFocus
            fullWidth
            margin="dense"
            label="Points to Add"
            type="number"
            value={pointsToAdd}
            onChange={(e) => setPointsToAdd(e.target.value)}
            InputProps={{
              inputProps: { min: 1 }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button 
            onClick={() => setPointsDialogOpen(false)}
            sx={{ color: 'text.secondary', fontWeight: '500' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleAddPoints} 
            variant="contained" 
            disabled={loading || pointsToAdd <= 0}
            sx={{ 
              bgcolor: '#000', 
              '&:hover': { bgcolor: '#333' }, 
              fontWeight: '500',
              textTransform: 'none',
              borderRadius: 1
            }}
          >
            Add Points
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Filter Dialog */}
      <Dialog 
        open={filterDialogOpen} 
        onClose={() => setFilterDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: '500', pb: 1 }}>
          Filter Users
        </DialogTitle>
        <DialogContent dividers>
          <FormControl fullWidth margin="dense" sx={{ mb: 2 }}>
            <InputLabel>User Role</InputLabel>
            <Select
              value={filters.role}
              onChange={(e) => setFilters({...filters, role: e.target.value})}
              label="User Role"
            >
              <MenuItem value="all">All Roles</MenuItem>
              <MenuItem value="user">User</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
              {userRole === 'master' && (
                <MenuItem value="master">Master Admin</MenuItem>
              )}
            </Select>
          </FormControl>
          
          <FormControl fullWidth margin="dense">
            <InputLabel>Verification Status</InputLabel>
            <Select
              value={filters.verified}
              onChange={(e) => setFilters({...filters, verified: e.target.value})}
              label="Verification Status"
            >
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="verified">Verified</MenuItem>
              <MenuItem value="unverified">Unverified</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button 
            onClick={handleResetFilters}
            sx={{ color: 'text.secondary', fontWeight: '500' }}
          >
            Reset
          </Button>
          <Button 
            onClick={() => setFilterDialogOpen(false)}
            sx={{ color: 'text.secondary', fontWeight: '500' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleApplyFilters} 
            variant="contained" 
            sx={{ 
              bgcolor: '#000', 
              '&:hover': { bgcolor: '#333' }, 
              fontWeight: '500',
              textTransform: 'none',
              borderRadius: 1
            }}
          >
            Apply Filters
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default UserManagement; 