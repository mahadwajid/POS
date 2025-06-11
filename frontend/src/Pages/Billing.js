import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Grid,
  Autocomplete,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Divider,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme,
  useMediaQuery,
  Stack,
  Card,
  CardContent,
  Fade,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Print as PrintIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
  Receipt as ReceiptIcon,
  Person as PersonIcon,
  ShoppingCart as ShoppingCartIcon,
  Payment as PaymentIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../Services/api';
import BillTemplate from '../Components/BillTemplate';

const Billing = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [items, setItems] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [taxRate, setTaxRate] = useState(18); // Default GST rate
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paidAmount, setPaidAmount] = useState(0);
  const [notes, setNotes] = useState('');
  const [billData, setBillData] = useState({
    billNumber: '',
    date: new Date(),
    customer: null,
    items: [],
    subtotal: 0,
    tax: 0,
    discount: 0,
    total: 0,
    paidAmount: 0,
    dueAmount: 0,
    notes: ''
  });

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [customersRes, productsRes] = await Promise.all([
          api.get('/customers'),
          api.get('/products')
        ]);
        setCustomers(customersRes.data);
        setProducts(productsRes.data);
        
        // If customerId is provided in URL, set the customer
        const params = new URLSearchParams(location.search);
        const customerId = params.get('customerId');
        if (customerId) {
          const customer = customersRes.data.find(c => c._id === customerId);
          if (customer) setSelectedCustomer(customer);
        }
      } catch (err) {
        setError('Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [location.search]);

  useEffect(() => {
    const { subTotal, discountAmount, taxAmount, grandTotal, balanceAmount } = calculateTotals();
    setBillData(prev => ({
      ...prev,
      billNumber: `BILL-${Date.now()}`,
      customer: selectedCustomer,
      items: items.map(item => ({
        product: item.productId,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        total: item.total
      })),
      subtotal: subTotal,
      tax: taxAmount,
      discount: discount,
      total: grandTotal,
      paidAmount: paidAmount,
      dueAmount: balanceAmount,
      notes: notes
    }));
  }, [selectedCustomer, items, discount, taxRate, paidAmount, notes]);

  const handleAddItem = (product) => {
    if (product.quantity <= 0) {
      setError('Product is out of stock');
      return;
    }

    const existingItem = items.find(item => item.productId === product._id);
    if (existingItem) {
      if (existingItem.quantity >= product.quantity) {
        setError('Not enough stock available');
        return;
      }
      setItems(items.map(item =>
        item.productId === product._id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setItems([...items, {
        productId: product._id,
        name: product.name,
        quantity: 1,
        price: product.price,
        total: product.price
      }]);
    }
  };

  const handleQuantityChange = (productId, change) => {
    const product = products.find(p => p._id === productId);
    if (!product) return;

    setItems(items.map(item => {
      if (item.productId === productId) {
        const newQuantity = Math.max(0, item.quantity + change);
        if (newQuantity > product.quantity) {
          setError('Not enough stock available');
          return item;
        }
        return {
          ...item,
          quantity: newQuantity,
          total: newQuantity * item.price
        };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const calculateTotals = () => {
    const subTotal = items.reduce((sum, item) => sum + item.total, 0);
    const discountAmount = (subTotal * discount) / 100;
    const taxableAmount = subTotal - discountAmount;
    const taxAmount = (taxableAmount * taxRate) / 100;
    const grandTotal = taxableAmount + taxAmount;
    const balanceAmount = grandTotal - paidAmount;

    return {
      subTotal,
      discountAmount,
      taxAmount,
      grandTotal,
      balanceAmount
    };
  };

  const handleSave = async () => {
    try {
      if (!selectedCustomer) {
        setError('Please select a customer');
        return;
      }
      if (items.length === 0) {
        setError('Please add at least one item');
        return;
      }

      const { grandTotal, balanceAmount } = calculateTotals();
      const billData = {
        customer: selectedCustomer._id,
        items: items.map(item => ({
          product: item.productId,
          quantity: item.quantity,
          price: item.price,
          total: item.total
        })),
        subtotal: calculateTotals().subTotal,
        discount,
        tax: taxRate,
        total: grandTotal,
        paidAmount,
        dueAmount: balanceAmount,
        paymentMethod: paymentMethod.toLowerCase(),
        status: balanceAmount > 0 ? 'pending' : 'paid',
        notes
      };

      const response = await api.post('/bills', billData);
      navigate(`/billing/${response.data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save bill');
    }
  };

  const handlePrint = () => {
    console.log('Print button clicked');
    if (!selectedCustomer) {
      setError('Please select a customer first');
      return;
    }
    if (items.length === 0) {
      setError('Please add at least one item to the bill');
      return;
    }
  
    // Calculate totals using the existing function
    const { subTotal, discountAmount, taxAmount, grandTotal, balanceAmount } = calculateTotals();
  
    // Prepare bill data with all required fields
    const billData = {
      billNumber: `BILL-${Date.now()}`,
      date: new Date().toISOString(),
      customer: {
        name: selectedCustomer.name,
        phone: selectedCustomer.phone || 'N/A',
        address: selectedCustomer.address || 'N/A'
      },
      items: items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        total: item.price * item.quantity
      })),
      subtotal: subTotal,
      discount: discountAmount,
      tax: taxAmount,
      total: grandTotal,
      paidAmount: paidAmount,
      dueAmount: balanceAmount,
      paymentMethod: paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1),
      notes: notes
    };
  
    // Prepare company info (you should customize this)
    const companyInfo = {
      name: user.companyName || 'KPK Cables®',
      address: user.companyAddress || 'Your Company Address',
      phone: user.companyPhone || 'Your Company Phone',
      email: user.companyEmail || 'Your Company Email',
      gstin: user.companyGSTIN || 'Your GSTIN Number',
      logo: user.companyLogo || '/logo.png'
    };
  
    // Store data in localStorage
    localStorage.setItem('printBillData', JSON.stringify({ 
      billData, 
      companyInfo 
    }));
    
    console.log('Saved printBillData:', { billData, companyInfo });
    
    // Navigate to print page
    navigate('/print-bill');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  const { subTotal, discountAmount, taxAmount, grandTotal, balanceAmount } = calculateTotals();

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ 
          fontWeight: 'bold',
          background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          color: 'transparent'
        }}>
          Create New Bill
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            onClick={handlePrint}
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
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
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
            Save Bill
          </Button>
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

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
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
            <Autocomplete
              options={customers}
              getOptionLabel={(option) => `${option.name} (${option.phone})`}
              value={selectedCustomer}
              onChange={(event, newValue) => setSelectedCustomer(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Customer"
                  required
                  fullWidth
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              )}
            />
          </Paper>

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
              <ShoppingCartIcon color="primary" />
              <Typography variant="h6">Add Products</Typography>
            </Stack>
            <Autocomplete
              options={products.filter(p => p.isActive)}
              getOptionLabel={(option) => `${option.name} (Rs. ${option.price})`}
              onChange={(event, newValue) => newValue && handleAddItem(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Add Product"
                  fullWidth
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              )}
            />
          </Paper>

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
                  <TableCell sx={{ fontWeight: 'bold' }}>Product</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>Price</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>Quantity</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>Total</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item) => (
                  <TableRow 
                    key={item.productId}
                    sx={{
                      '&:hover': {
                        backgroundColor: theme.palette.action.hover
                      }
                    }}
                  >
                    <TableCell>{item.name}</TableCell>
                    <TableCell align="right">Rs. {item.price.toFixed(2)}</TableCell>
                    <TableCell align="center">
                      <Box display="flex" alignItems="center" justifyContent="center">
                        <IconButton
                          size="small"
                          onClick={() => handleQuantityChange(item.productId, -1)}
                          sx={{ 
                            color: theme.palette.error.main,
                            '&:hover': { backgroundColor: `${theme.palette.error.main}15` }
                          }}
                        >
                          <RemoveIcon fontSize="small" />
                        </IconButton>
                        <Typography sx={{ mx: 1, minWidth: '30px', textAlign: 'center' }}>
                          {item.quantity}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => handleQuantityChange(item.productId, 1)}
                          sx={{ 
                            color: theme.palette.success.main,
                            '&:hover': { backgroundColor: `${theme.palette.success.main}15` }
                          }}
                        >
                          <AddIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                    <TableCell align="right">Rs. {item.total.toFixed(2)}</TableCell>
                    <TableCell align="center">
                      <Tooltip title="Remove Item" TransitionComponent={Fade}>
                        <IconButton
                          size="small"
                          onClick={() => handleQuantityChange(item.productId, -item.quantity)}
                          sx={{ 
                            color: theme.palette.error.main,
                            '&:hover': { backgroundColor: `${theme.palette.error.main}15` }
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper 
            elevation={0}
            sx={{ 
              p: 3,
              borderRadius: 2,
              background: `linear-gradient(45deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
              border: `1px solid ${theme.palette.divider}`
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
              <ReceiptIcon color="primary" />
              <Typography variant="h6">Bill Summary</Typography>
            </Stack>

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Discount (%)"
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(Math.max(0, Math.min(100, Number(e.target.value))))}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Tax Rate (%)"
                  type="number"
                  value={taxRate}
                  onChange={(e) => setTaxRate(Math.max(0, Number(e.target.value)))}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>
              <Grid item xs={12}>
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
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Amount Paid"
                  type="number"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(Math.max(0, Number(e.target.value)))}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">Rs.</InputAdornment>,
                  }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  multiline
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ 
              p: 2, 
              borderRadius: 2,
              backgroundColor: theme.palette.background.default
            }}>
              <Stack spacing={1.5}>
                <Box display="flex" justifyContent="space-between">
                  <Typography color="text.secondary">Subtotal:</Typography>
                  <Typography>Rs. {subTotal.toFixed(2)}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography color="text.secondary">Discount:</Typography>
                  <Typography color="error">-Rs. {discountAmount.toFixed(2)}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography color="text.secondary">Tax:</Typography>
                  <Typography>Rs. {taxAmount.toFixed(2)}</Typography>
                </Box>
                <Divider />
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="h6">Grand Total:</Typography>
                  <Typography variant="h6">Rs. {grandTotal.toFixed(2)}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography color="text.secondary">Amount Paid:</Typography>
                  <Typography>Rs. {paidAmount.toFixed(2)}</Typography>
                </Box>
                <Divider />
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="h6">Balance Due:</Typography>
                  <Typography
                    variant="h6"
                    color={balanceAmount > 0 ? 'error' : 'success'}
                  >
                    Rs. {balanceAmount.toFixed(2)}
                  </Typography>
                </Box>
              </Stack>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Billing; 