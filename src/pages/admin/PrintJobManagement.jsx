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
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { adminAPI } from '../../utils/api';

const PrintJobManagement = () => {
  const [printJobs, setPrintJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalJobs, setTotalJobs] = useState(0);
  const [selectedJob, setSelectedJob] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filters, setFilters] = useState({});

  // Fetch print jobs on initial load and when page, rowsPerPage, or filters change
  useEffect(() => {
    fetchPrintJobs();
  }, [page, rowsPerPage, filters]);

  const fetchPrintJobs = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAllPrintJobs(page + 1, rowsPerPage, filters);
      
      setPrintJobs(response.printJobs);
      setTotalJobs(response.pagination.total);
      setError('');
    } catch (err) {
      console.error('Failed to fetch print jobs:', err);
      setError('Failed to load print jobs. Please try again.');
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

  // Update print job status
  const handleOpenStatusDialog = (job) => {
    setSelectedJob(job);
    setSelectedStatus(job.status);
    setStatusDialogOpen(true);
  };

  const handleUpdateStatus = async () => {
    try {
      setLoading(true);
      
      await adminAPI.updatePrintJobStatus(selectedJob._id, selectedStatus);
      
      // Update the job in the local state
      setPrintJobs(printJobs.map(job => 
        job._id === selectedJob._id ? { ...job, status: selectedStatus } : job
      ));
      
      setSuccess('Print job status updated successfully');
      setStatusDialogOpen(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Failed to update print job status:', err);
      setError('Failed to update status: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  // Delete print job
  const handleOpenDeleteDialog = (job) => {
    setSelectedJob(job);
    setDeleteDialogOpen(true);
  };

  const handleDeleteJob = async () => {
    try {
      setLoading(true);
      
      await adminAPI.deletePrintJob(selectedJob._id);
      
      // Remove the job from the local state
      setPrintJobs(printJobs.filter(job => job._id !== selectedJob._id));
      setTotalJobs(prevTotal => prevTotal - 1);
      
      setSuccess('Print job deleted successfully');
      setDeleteDialogOpen(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Failed to delete print job:', err);
      setError('Failed to delete print job: ' + (err.message || 'Unknown error'));
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

  // Get color for status
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'processing': return 'info';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" component="h1">
            Print Job Management
          </Typography>
          
          <Box>
            <Button 
              startIcon={<RefreshIcon />} 
              onClick={fetchPrintJobs} 
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
                <TableCell>File Name</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Student ID</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Points Used</TableCell>
                <TableCell>Created At</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && page === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <CircularProgress size={24} sx={{ my: 2 }} />
                  </TableCell>
                </TableRow>
              ) : printJobs.length > 0 ? (
                printJobs.map((job) => (
                  <TableRow key={job._id} hover>
                    <TableCell>{job.fileName}</TableCell>
                    <TableCell>{job.userId?.name || 'Unknown'}</TableCell>
                    <TableCell>{job.userId?.studentId || 'N/A'}</TableCell>
                    <TableCell>
                      <Chip 
                        label={job.status}
                        color={getStatusColor(job.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{job.pointsUsed || job.printSettings?.totalPages || 'N/A'}</TableCell>
                    <TableCell>{formatDate(job.createdAt)}</TableCell>
                    <TableCell>
                      <Tooltip title="Update Status">
                        <IconButton 
                          size="small" 
                          color="primary"
                          onClick={() => handleOpenStatusDialog(job)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Delete Job">
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => handleOpenDeleteDialog(job)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="View PDF">
                        <IconButton 
                          size="small" 
                          color="info"
                          // This would open the PDF in a new tab or preview
                          onClick={() => window.open(`/api/print/public/view/${job._id}`, '_blank')}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center">No print jobs found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={totalJobs}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
      
      {/* Update Status Dialog */}
      <Dialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)}>
        <DialogTitle>Update Print Job Status</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Update the status for print job: {selectedJob?.fileName}
          </DialogContentText>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              label="Status"
            >
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="processing">Processing</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleUpdateStatus} variant="contained" color="primary" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Update Status'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Job Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Print Job</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the print job "{selectedJob?.fileName}"? This action cannot be undone.
            The file will also be deleted from storage.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteJob} variant="contained" color="error" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default PrintJobManagement; 