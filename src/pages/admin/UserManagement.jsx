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
  MenuItem
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  AddCircle as AddCircleIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon
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
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    studentId: '',
    phone: '',
    role: '',
    points: 0,
    isVerified: false,
    isAdmin: false
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userRole, setUserRole] = useState('');

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
  }, [page, rowsPerPage]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAllUsers(page + 1, rowsPerPage);
      
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
      
      await adminAPI.deleteUser(selectedUser._id);
      
      // Remove the user from the local state
      setUsers(users.filter(user => user._id !== selectedUser._id));
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
    }
  };

  // Add points to user
  const handleOpenPointsDialog = (user) => {
    setSelectedUser(user);
    setPointsToAdd(0);
    setPointsDialogOpen(true);
  };

  const handleAddPoints = async () => {
    try {
      setLoading(true);
      
      if (!pointsToAdd || isNaN(pointsToAdd) || pointsToAdd <= 0) {
        setError('Please enter a valid number of points');
        setLoading(false);
        return;
      }
      
      const response = await adminAPI.addPointsToUser(selectedUser._id, pointsToAdd);
      
      // Update the user in the local state
      setUsers(users.map(user => 
        user._id === selectedUser._id ? { ...user, points: response.user.points } : user
      ));
      
      setSuccess(`${pointsToAdd} points added to ${selectedUser.name} successfully`);
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

  // Get color for role
  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'primary';
      case 'master': return 'secondary';
      default: return 'default';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" component="h1">
            User Management
          </Typography>
          
          <Box>
            <Button 
              startIcon={<RefreshIcon />} 
              onClick={fetchUsers} 
              sx={{ ml: 1 }}
            >
              Refresh
            </Button>
          </Box>
        </Box>
        
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
        
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Student ID</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Points</TableCell>
                <TableCell>Verified</TableCell>
                <TableCell>Joined</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && page === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <CircularProgress size={24} sx={{ my: 2 }} />
                  </TableCell>
                </TableRow>
              ) : users.length > 0 ? (
                users.map((user) => (
                  <TableRow key={user._id} hover>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.studentId}</TableCell>
                    <TableCell>
                      <Chip 
                        label={user.role}
                        color={getRoleColor(user.role)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{user.points}</TableCell>
                    <TableCell>
                      <Chip 
                        label={user.isVerified ? 'Verified' : 'Unverified'}
                        color={user.isVerified ? 'success' : 'warning'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{formatDate(user.createdAt)}</TableCell>
                    <TableCell>
                      <Tooltip title="Edit User">
                        <IconButton 
                          size="small" 
                          color="primary"
                          onClick={() => handleOpenEditDialog(user)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Delete User">
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => handleOpenDeleteDialog(user)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Add Points">
                        <IconButton 
                          size="small" 
                          color="success"
                          onClick={() => handleOpenPointsDialog(user)}
                        >
                          <AddCircleIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} align="center">No users found</TableCell>
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
        />
      </Paper>
      
      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Name"
            name="name"
            value={editFormData.name}
            onChange={handleEditFormChange}
            fullWidth
            variant="outlined"
          />
          <TextField
            margin="dense"
            label="Email"
            name="email"
            type="email"
            value={editFormData.email}
            onChange={handleEditFormChange}
            fullWidth
            variant="outlined"
          />
          <TextField
            margin="dense"
            label="Student ID"
            name="studentId"
            value={editFormData.studentId}
            onChange={handleEditFormChange}
            fullWidth
            variant="outlined"
          />
          <TextField
            margin="dense"
            label="Phone"
            name="phone"
            value={editFormData.phone}
            onChange={handleEditFormChange}
            fullWidth
            variant="outlined"
          />
          <TextField
            margin="dense"
            label="Points"
            name="points"
            type="number"
            value={editFormData.points}
            onChange={handleEditFormChange}
            fullWidth
            variant="outlined"
          />
          
          <FormControl fullWidth margin="dense">
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
          
          <FormControl fullWidth margin="dense">
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
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmitEdit} variant="contained" color="primary" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete User Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the user "{selectedUser?.name}"? This action cannot be undone.
            All of their print jobs will also be deleted.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteUser} variant="contained" color="error" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Add Points Dialog */}
      <Dialog open={pointsDialogOpen} onClose={() => setPointsDialogOpen(false)}>
        <DialogTitle>Add Points to User</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Add points to {selectedUser?.name}'s account. Current points: {selectedUser?.points}
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Points to Add"
            type="number"
            fullWidth
            variant="outlined"
            value={pointsToAdd}
            onChange={(e) => setPointsToAdd(parseInt(e.target.value) || 0)}
            InputProps={{ inputProps: { min: 1 } }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPointsDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddPoints} variant="contained" color="success" disabled={loading || pointsToAdd <= 0}>
            {loading ? <CircularProgress size={24} /> : 'Add Points'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default UserManagement; 