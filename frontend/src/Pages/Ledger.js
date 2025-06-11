import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Autocomplete,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Chip,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment
} from '@mui/material';
import {
  Search as SearchIcon,
  Payment as PaymentIcon,
  Receipt as ReceiptIcon,
  FilterList as FilterListIcon,
  Print as PrintIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../Services/api';

const Ledger = () => {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [dateRange, setDateRange] = useState({
    start: null,
    end: null
  });

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoading(true);
        const response = await api.get('/customers');
        setCustomers(response.data);
        if (customerId) {
          const customer = response.data.find(c => c._id === customerId);
          if (customer) {
            setSelectedCustomer(customer);
            fetchTransactions(customer._id);
          } else {
            setError('Customer not found');
          }
        }
      } catch (err) {
        setError('Failed to fetch customers');
      } finally {
        setLoading(false);
      }
    };
    fetchCustomers();
  }, [customerId]);

  const fetchTransactions = async (customerId) => {
    try {
      setLoading(true);
      const response = await api.get(`/customers/${customerId}/ledger`, {
        params: {
          type: filterType !== 'all' ? filterType : undefined,
          startDate: dateRange.start?.toISOString(),
          endDate: dateRange.end?.toISOString()
        }
      });
      setTransactions(response.data.transactions || []);
      setError(null);
    } catch (err) {
      setError('Failed to fetch transactions');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerChange = (event, newValue) => {
    setSelectedCustomer(newValue);
    if (newValue) {
      fetchTransactions(newValue._id);
    } else {
      setTransactions([]);
    }
  };

  const handlePaymentSubmit = async () => {
    try {
      await api.post(`/customers/${selectedCustomer._id}/payment`, {
        amount: parseFloat(paymentAmount),
        paymentMethod,
        notes: paymentNotes,
        recordedBy: user.id || user._id
      });
      setPaymentDialogOpen(false);
      setPaymentAmount('');
      setPaymentMethod('cash');
      setPaymentNotes('');
      fetchTransactions(selectedCustomer._id);
    } catch (err) {
      setError('Failed to process payment');
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handlePrint = () => {
    window.print();
  };

  const getTransactionTypeColor = (type) => {
    switch (type) {
      case 'sale':
        return 'primary';
      case 'payment':
        return 'success';
      case 'adjustment':
        return 'warning';
      default:
        return 'default';
    }
  };

  if (loading && !selectedCustomer) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Customer Ledger</Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            onClick={handlePrint}
            sx={{ mr: 1 }}
            disabled={!selectedCustomer}
          >
            Print
          </Button>
          {selectedCustomer && selectedCustomer.totalDue > 0 && user?.role === 'super_admin' && (
            <Button
              variant="contained"
              startIcon={<PaymentIcon />}
              onClick={() => setPaymentDialogOpen(true)}
            >
              Record Payment
            </Button>
          )}
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <Autocomplete
              options={customers}
              getOptionLabel={(option) => `${option.name} (${option.phone})`}
              value={selectedCustomer}
              onChange={handleCustomerChange}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Customer"
                  variant="outlined"
                  fullWidth
                />
              )}
            />
          </Grid>
          {selectedCustomer && (
            <>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Transaction Type</InputLabel>
                  <Select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    label="Transaction Type"
                  >
                    <MenuItem value="all">All Transactions</MenuItem>
                    <MenuItem value="sale">Sales</MenuItem>
                    <MenuItem value="payment">Payments</MenuItem>
                    <MenuItem value="adjustment">Adjustments</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField
                  fullWidth
                  label="Start Date"
                  type="date"
                  value={dateRange.start?.toISOString().split('T')[0] || ''}
                  onChange={(e) => setDateRange(prev => ({
                    ...prev,
                    start: e.target.value ? new Date(e.target.value) : null
                  }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField
                  fullWidth
                  label="End Date"
                  type="date"
                  value={dateRange.end?.toISOString().split('T')[0] || ''}
                  onChange={(e) => setDateRange(prev => ({
                    ...prev,
                    end: e.target.value ? new Date(e.target.value) : null
                  }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </>
          )}
        </Grid>
      </Paper>

      {selectedCustomer && (
        <>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="h6">
                  {selectedCustomer.name}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {selectedCustomer.phone}
                </Typography>
              </Box>
              <Box>
                <Typography variant="h6" color={selectedCustomer.totalDue > 0 ? 'error' : 'success'}>
                  Balance: Rs. {selectedCustomer.totalDue.toFixed(2)}
                </Typography>
              </Box>
            </Box>
          </Paper>

          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Reference</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell align="right">Balance</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {transactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        No transactions found
                      </TableCell>
                    </TableRow>
                  ) : (
                    transactions
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((transaction) => (
                        <TableRow key={transaction._id}>
                          <TableCell>
                            {new Date(transaction.date).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={transaction.type}
                              color={getTransactionTypeColor(transaction.type)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {transaction.reference}
                          </TableCell>
                          <TableCell>
                            {transaction.description}
                          </TableCell>
                          <TableCell align="right">
                            Rs. {transaction.amount?.toFixed(2) || '0.00'}
                          </TableCell>
                          <TableCell align="right">
                            Rs. {transaction.balance?.toFixed(2) || '0.00'}
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
              {transactions.length > 0 && (
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25]}
                  component="div"
                  count={transactions.length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                />
              )}
            </TableContainer>
          )}
        </>
      )}

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onClose={() => setPaymentDialogOpen(false)}>
        <DialogTitle>Record Payment</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Amount"
              type="number"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              sx={{ mb: 2 }}
              InputProps={{
                startAdornment: <InputAdornment position="start">Rs.</InputAdornment>,
              }}
            />
            <TextField
              fullWidth
              select
              label="Payment Method"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              SelectProps={{
                native: true
              }}
              sx={{ mb: 2 }}
            >
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="upi">UPI</option>
              <option value="wallet">Wallet</option>
              <option value="cheque">Cheque</option>
              <option value="credit">Credit</option>
            </TextField>
            <TextField
              fullWidth
              label="Notes"
              multiline
              rows={3}
              value={paymentNotes}
              onChange={(e) => setPaymentNotes(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handlePaymentSubmit}
            disabled={!paymentAmount || parseFloat(paymentAmount) <= 0}
          >
            Record Payment
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Ledger; 