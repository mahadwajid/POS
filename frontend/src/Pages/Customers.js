import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Alert,
  CircularProgress,
  Chip,
  InputAdornment,
  Tooltip,
  MenuItem,
  Snackbar
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Payment as PaymentIcon,
  History as HistoryIcon,
  Receipt as ReceiptIcon
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../Services/api';

const validationSchema = yup.object({
  name: yup.string().required('Name is required'),
  phone: yup.string().required('Phone number is required'),
  email: yup.string().email('Invalid email'),
});

const Customers = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const { user } = useAuth();
  const [paymentData, setPaymentData] = useState({
    amount: '',
    paymentMethod: 'cash',
    notes: ''
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const formik = useFormik({
    initialValues: {
      name: '',
      phone: '',
      email: '',
      address: {
        street: '',
        city: '',
        state: '',
        pincode: ''
      },
      notes: ''
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        if (selectedCustomer) {
          await api.put(`/customers/${selectedCustomer._id}`, values);
        } else {
          await api.post('/customers', values);
        }
        handleClose();
        fetchCustomers();
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to save customer');
      }
    }
  });

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/customers', {
        params: { search }
      });
      console.log('Fetched customers:', response.data);
      setCustomers(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [search]);

  useEffect(() => {
    if (location.state && location.state.showBillSuccess) {
      setSnackbar({ open: true, message: 'Bill created successfully!', severity: 'success' });
      setTimeout(() => {
        fetchCustomers();
      }, 400);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const handleOpen = (customer = null) => {
    if (customer) {
      setSelectedCustomer(customer);
      formik.setValues(customer);
    } else {
      setSelectedCustomer(null);
      formik.resetForm();
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedCustomer(null);
    formik.resetForm();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await api.delete(`/customers/${id}`);
        fetchCustomers();
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete customer');
      }
    }
  };

  const handlePaymentOpen = (customer) => {
    setSelectedCustomer(customer);
    setPaymentData({
      amount: '',
      paymentMethod: 'cash',
      notes: ''
    });
    setPaymentOpen(true);
  };

  const handlePaymentClose = () => {
    setPaymentOpen(false);
    setSelectedCustomer(null);
    setPaymentData({
      amount: '',
      paymentMethod: 'cash',
      notes: ''
    });
  };

  const handlePaymentSubmit = async () => {
    try {
      if (!paymentData.amount || parseFloat(paymentData.amount) <= 0) {
        setError('Please enter a valid payment amount');
        return;
      }

      await api.post(`/customers/${selectedCustomer._id}/payment`, {
        ...paymentData,
        amount: parseFloat(paymentData.amount),
        recordedBy: user.id || user._id
      });
      handlePaymentClose();
      fetchCustomers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to process payment');
    }
  };

  const handleViewLedger = (customerId) => {
    navigate(`/ledger/${customerId}`);
  };

  const handleCreateBill = (customerId) => {
    navigate(`/billing/new?customerId=${customerId}`, { state: { showBillSuccess: true } });
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Customers</Typography>
        {user?.role === 'super_admin' && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleOpen()}
          >
            Add Customer
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ mb: 2 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search customers by name, phone, or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ p: 2 }}
        />
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Total Due</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {customers
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((customer) => (
                <TableRow key={customer._id}>
                  <TableCell>{customer.name}</TableCell>
                  <TableCell>{customer.phone}</TableCell>
                  <TableCell>{customer.email}</TableCell>
                  <TableCell>
                    <Typography
                      color={customer.totalDue > 0 ? 'error' : 'success'}
                      fontWeight="bold"
                    >
                      Rs. {(customer.totalDue ?? 0).toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={customer.isActive ? 'Active' : 'Inactive'}
                      color={customer.isActive ? 'success' : 'error'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box display="flex" gap={1}>
                      <Tooltip title="Edit Customer">
                        <IconButton
                          size="small"
                          onClick={() => handleOpen(customer)}
                          disabled={user?.role !== 'super_admin'}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Customer">
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(customer._id)}
                          disabled={user?.role !== 'super_admin'}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Record Payment">
                        <IconButton
                          size="small"
                          onClick={() => handlePaymentOpen(customer)}
                          disabled={user?.role !== 'super_admin'}
                        >
                          <PaymentIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="View Ledger">
                        <IconButton
                          size="small"
                          onClick={() => handleViewLedger(customer._id)}
                        >
                          <HistoryIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Create Bill">
                        <IconButton
                          size="small"
                          onClick={() => handleCreateBill(customer._id)}
                          disabled={user?.role !== 'super_admin'}
                        >
                          <ReceiptIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={customers.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      {/* Add/Edit Customer Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedCustomer ? 'Edit Customer' : 'Add New Customer'}
        </DialogTitle>
        <form onSubmit={formik.handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="name"
                  label="Name"
                  value={formik.values.name}
                  onChange={formik.handleChange}
                  error={formik.touched.name && Boolean(formik.errors.name)}
                  helperText={formik.touched.name && formik.errors.name}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="phone"
                  label="Phone"
                  value={formik.values.phone}
                  onChange={formik.handleChange}
                  error={formik.touched.phone && Boolean(formik.errors.phone)}
                  helperText={formik.touched.phone && formik.errors.phone}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="email"
                  label="Email"
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  error={formik.touched.email && Boolean(formik.errors.email)}
                  helperText={formik.touched.email && formik.errors.email}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="address.street"
                  label="Street Address"
                  value={formik.values.address.street}
                  onChange={formik.handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  name="address.city"
                  label="City"
                  value={formik.values.address.city}
                  onChange={formik.handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  name="address.state"
                  label="State"
                  value={formik.values.address.state}
                  onChange={formik.handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  name="address.pincode"
                  label="Pincode"
                  value={formik.values.address.pincode}
                  onChange={formik.handleChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="notes"
                  label="Notes"
                  multiline
                  rows={3}
                  value={formik.values.notes}
                  onChange={formik.handleChange}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary">
              {selectedCustomer ? 'Update' : 'Add'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={paymentOpen} onClose={handlePaymentClose} maxWidth="sm" fullWidth>
        <DialogTitle>Record Payment</DialogTitle>
        <DialogContent>
          {selectedCustomer && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Customer: {selectedCustomer.name}
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                Current Due: Rs. {selectedCustomer.totalDue.toFixed(2)}
              </Typography>
              <TextField
                fullWidth
                label="Payment Amount"
                type="number"
                margin="normal"
                value={paymentData.amount}
                onChange={(e) => setPaymentData(prev => ({ ...prev, amount: e.target.value }))}
                InputProps={{
                  startAdornment: <InputAdornment position="start">Rs.</InputAdornment>,
                }}
              />
              <TextField
                fullWidth
                label="Payment Method"
                select
                margin="normal"
                value={paymentData.paymentMethod}
                onChange={(e) => setPaymentData(prev => ({ ...prev, paymentMethod: e.target.value }))}
              >
                <MenuItem value="cash">Cash</MenuItem>
                <MenuItem value="card">Card</MenuItem>
                <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                <MenuItem value="upi">UPI</MenuItem>
                <MenuItem value="wallet">Wallet</MenuItem>
                <MenuItem value="cheque">Cheque</MenuItem>
                <MenuItem value="credit">Credit</MenuItem>
              </TextField>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={3}
                margin="normal"
                value={paymentData.notes}
                onChange={(e) => setPaymentData(prev => ({ ...prev, notes: e.target.value }))}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handlePaymentClose}>Cancel</Button>
          <Button
            onClick={handlePaymentSubmit}
            variant="contained"
            color="primary"
            disabled={!paymentData.amount || parseFloat(paymentData.amount) <= 0}
          >
            Record Payment
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for success/error messages */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Customers; 