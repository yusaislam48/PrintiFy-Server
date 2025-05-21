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
  CircularProgress,
  Chip,
  Alert,
  FormControl,
  InputAdornment,
  OutlinedInput,
  useTheme,
  Grid,
  Divider,
  MenuItem,
  Select,
  InputLabel
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import { adminAPI } from '../../utils/api';

const AdminHistory = () => {
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const theme = useTheme();

  useEffect(() => {
    fetchHistory();
  }, [page, rowsPerPage, filterType]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      // This is a placeholder - you would need to implement this API endpoint
      const response = await adminAPI.getSystemHistory(page + 1, rowsPerPage, filterType);
      
      setHistory(response.history);
      setTotalItems(response.pagination.total);
      setError('');
    } catch (err) {
      console.error('Failed to fetch history:', err);
      setError('Failed to load history data. Please try again.');
      // For demo purposes, set some mock data
      setHistory([
        {
          _id: '1',
          type: 'user',
          action: 'created',
          details: 'New user registered: John Doe',
          performedBy: 'system',
          timestamp: new Date().toISOString()
        },
        {
          _id: '2',
          type: 'printjob',
          action: 'completed',
          details: 'Print job completed: Assignment.pdf',
          performedBy: 'admin@printify.com',
          timestamp: new Date(Date.now() - 3600000).toISOString()
        },
        {
          _id: '3',
          type: 'points',
          action: 'added',
          details: '100 points added to user: Jane Smith',
          performedBy: 'admin@printify.com',
          timestamp: new Date(Date.now() - 7200000).toISOString()
        },
        {
          _id: '4',
          type: 'system',
          action: 'maintenance',
          details: 'System maintenance performed',
          performedBy: 'master@printify.com',
          timestamp: new Date(Date.now() - 86400000).toISOString()
        },
        {
          _id: '5',
          type: 'printjob',
          action: 'cancelled',
          details: 'Print job cancelled: Report.docx',
          performedBy: 'user@example.com',
          timestamp: new Date(Date.now() - 172800000).toISOString()
        }
      ]);
      setTotalItems(5);
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

  const handleFilterChange = (event) => {
    setFilterType(event.target.value);
    setPage(0);
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

  // Get color for action type
  const getActionColor = (action) => {
    switch (action) {
      case 'created': return 'success';
      case 'completed': return 'success';
      case 'added': return 'success';
      case 'cancelled': return 'error';
      case 'deleted': return 'error';
      case 'maintenance': return 'info';
      default: return 'default';
    }
  };

  // Get color for history type
  const getTypeColor = (type) => {
    switch (type) {
      case 'user': return '#4caf50';
      case 'printjob': return '#2196f3';
      case 'points': return '#ff9800';
      case 'system': return '#9c27b0';
      default: return '#757575';
    }
  };

  if (loading && history.length === 0) {
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
          System History
        </Typography>
        <IconButton 
          onClick={fetchHistory} 
          sx={{ 
            bgcolor: '#000', 
            color: 'white',
            '&:hover': { bgcolor: '#333' }
          }}
        >
          <RefreshIcon />
        </IconButton>
      </Box>
      
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
            onClick={fetchHistory} 
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
                placeholder="Search in history..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                startAdornment={
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                }
              />
            </FormControl>
          </Grid>
          <Grid item xs={6} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Filter Type</InputLabel>
              <Select
                value={filterType}
                onChange={handleFilterChange}
                label="Filter Type"
              >
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value="user">User</MenuItem>
                <MenuItem value="printjob">Print Jobs</MenuItem>
                <MenuItem value="points">Points</MenuItem>
                <MenuItem value="system">System</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchHistory}
              sx={{ 
                color: '#000', 
                borderColor: '#000',
                '&:hover': { borderColor: '#000', bgcolor: 'rgba(0,0,0,0.04)' },
                textTransform: 'none',
                borderRadius: 1,
                height: '40px'
              }}
            >
              Refresh
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      {/* History Table */}
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
                <TableCell sx={{ fontWeight: '600', color: '#000' }}>Type</TableCell>
                <TableCell sx={{ fontWeight: '600', color: '#000' }}>Action</TableCell>
                <TableCell sx={{ fontWeight: '600', color: '#000' }}>Details</TableCell>
                <TableCell sx={{ fontWeight: '600', color: '#000' }}>Performed By</TableCell>
                <TableCell sx={{ fontWeight: '600', color: '#000' }}>Timestamp</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {history.length > 0 ? (
                history.map((item) => (
                  <TableRow 
                    key={item._id}
                    sx={{ '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' } }}
                  >
                    <TableCell>
                      <Chip
                        label={item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                        size="small"
                        sx={{ 
                          fontWeight: '500',
                          bgcolor: getTypeColor(item.type),
                          color: 'white'
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={item.action.charAt(0).toUpperCase() + item.action.slice(1)}
                        size="small"
                        color={getActionColor(item.action)}
                        variant="outlined"
                        sx={{ fontWeight: '500' }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontWeight: '500' }}>{item.details}</TableCell>
                    <TableCell>{item.performedBy}</TableCell>
                    <TableCell>{formatDate(item.timestamp)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Box sx={{ py: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                      <HistoryIcon sx={{ fontSize: 40, color: 'text.secondary', opacity: 0.5 }} />
                      <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                        No history records found.
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={totalItems}
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
      
      {/* Info Section */}
      <Paper 
        elevation={0}
        sx={{ 
          p: 3, 
          mt: 3,
          borderRadius: 2, 
          border: '1px solid', 
          borderColor: 'divider',
          bgcolor: '#fff'
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: '500', mb: 2 }}>
          About System History
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Typography variant="body2" color="text.secondary" paragraph>
          The system history tracks all important actions and events within the PrintiFy platform. This includes user registrations, print job status changes, point transactions, and system maintenance events.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          History records are retained for 90 days. Use the search and filter options above to find specific events.
        </Typography>
      </Paper>
    </Container>
  );
};

export default AdminHistory; 