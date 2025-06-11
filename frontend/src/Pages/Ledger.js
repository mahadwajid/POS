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
  InputAdornment,
  useTheme,
  useMediaQuery,
  Stack,
  Card,
  CardContent,
  Fade,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  Search as SearchIcon,
  Payment as PaymentIcon,
  Receipt as ReceiptIcon,
  FilterList as FilterListIcon,
  Print as PrintIcon,
  AccountBalance as AccountBalanceIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon
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

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

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
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ 
          fontWeight: 'bold',
          background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          color: 'transparent'
        }}>
          Customer Ledger
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            onClick={handlePrint}
            disabled={!selectedCustomer}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              px: 3,
              borderColor: theme.palette.primary.main,
              color: theme.palette.primary.main,
              '&:hover': {
                borderColor: theme.palette.primary.dark,
                backgroundColor: `${theme.palette.primary.main}15`
              }
            }}
          >
            Print
          </Button>
          {selectedCustomer && selectedCustomer.totalDue > 0 && user?.role === 'super_admin' && (
            <Button
              variant="contained"
              startIcon={<PaymentIcon />}
              onClick={() => setPaymentDialogOpen(true)}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                px: 3,
                background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                '&:hover': {
                  background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
                }
              }}
            >
              Record Payment
            </Button>
          )}
        </Stack>
      </Stack>

      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 2,
            borderRadius: 2,
            '& .MuiAlert-icon': {
              color: theme.palette.error.main
            }
          }}
        >
          {error}
        </Alert>
      )}

      <Paper 
        elevation={0}
        sx={{ 
          p: 3, 
          mb: 3,
          borderRadius: 2,
          background: `linear-gradient(45deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
          border: `1px solid ${theme.palette.divider}`
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
          <PersonIcon color="primary" />
          <Typography variant="h6">Customer Information</Typography>
        </Stack>
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
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
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
                    sx={{ borderRadius: 2 }}
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
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
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
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>
            </>
          )}
        </Grid>
      </Paper>

      {selectedCustomer && (
        <>
          <Paper 
            elevation={0}
            sx={{ 
              p: 3, 
              mb: 3,
              borderRadius: 2,
              background: `linear-gradient(45deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
              border: `1px solid ${theme.palette.divider}`
            }}
          >
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <PersonIcon color="primary" />
                  <Box>
                    <Typography variant="h6">
                      {selectedCustomer.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedCustomer.phone}
                    </Typography>
                  </Box>
                </Stack>
              </Grid>
              <Grid item xs={12} md={6}>
                <Stack direction="row" alignItems="center" spacing={1} justifyContent={{ xs: 'flex-start', md: 'flex-end' }}>
                  <MoneyIcon color="primary" />
                  <Typography variant="h6" color={selectedCustomer.totalDue > 0 ? 'error' : 'success'}>
                    Balance: Rs. {selectedCustomer.totalDue.toFixed(2)}
                  </Typography>
                </Stack>
              </Grid>
            </Grid>
          </Paper>

          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer 
              component={Paper}
              elevation={0}
              sx={{ 
                borderRadius: 2,
                border: `1px solid ${theme.palette.divider}`,
                overflow: 'hidden'
              }}
            >
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: theme.palette.background.default }}>
                    <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Reference</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Description</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>Amount</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>Balance</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {transactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Typography color="text.secondary" sx={{ py: 2 }}>
                          No transactions found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    transactions
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((transaction) => (
                        <TableRow 
                          key={transaction._id}
                          sx={{
                            '&:hover': {
                              backgroundColor: theme.palette.action.hover
                            }
                          }}
                        >
                          <TableCell>
                            {new Date(transaction.date).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={transaction.type}
                              color={getTransactionTypeColor(transaction.type)}
                              size="small"
                              sx={{ 
                                borderRadius: 1,
                                textTransform: 'capitalize',
                                fontWeight: 'medium'
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            {transaction.reference}
                          </TableCell>
                          <TableCell>
                            {transaction.description}
                          </TableCell>
                          <TableCell align="right">
                            <Typography 
                              color={transaction.type === 'payment' ? 'success.main' : 'text.primary'}
                              fontWeight="medium"
                            >
                              Rs. {transaction.amount?.toFixed(2) || '0.00'}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography 
                              color={transaction.balance > 0 ? 'error.main' : 'success.main'}
                              fontWeight="medium"
                            >
                              Rs. {transaction.balance?.toFixed(2) || '0.00'}
                            </Typography>
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
                  sx={{
                    borderTop: `1px solid ${theme.palette.divider}`,
                    '.MuiTablePagination-select': {
                      borderRadius: 1
                    }
                  }}
                />
              )}
            </TableContainer>
          )}
        </>
      )}

      {/* Payment Dialog */}
      <Dialog 
        open={paymentDialogOpen} 
        onClose={() => setPaymentDialogOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: 2,
            minWidth: { xs: '90%', sm: 400 }
          }
        }}
      >
        <DialogTitle sx={{ 
          background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
          color: 'white',
          py: 2
        }}>
          Record Payment
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Stack spacing={2}>
            <TextField
              fullWidth
              label="Amount"
              type="number"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start">Rs.</InputAdornment>,
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <FormControl fullWidth>
              <InputLabel>Payment Method</InputLabel>
              <Select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                label="Payment Method"
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="cash">Cash</MenuItem>
                <MenuItem value="card">Card</MenuItem>
                <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                <MenuItem value="upi">UPI</MenuItem>
                <MenuItem value="wallet">Wallet</MenuItem>
                <MenuItem value="cheque">Cheque</MenuItem>
                <MenuItem value="credit">Credit</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Notes"
              multiline
              rows={3}
              value={paymentNotes}
              onChange={(e) => setPaymentNotes(e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button 
            onClick={() => setPaymentDialogOpen(false)}
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              px: 3
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handlePaymentSubmit}
            disabled={!paymentAmount || parseFloat(paymentAmount) <= 0}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              px: 3,
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              '&:hover': {
                background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
              }
            }}
          >
            Record Payment
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Ledger; 