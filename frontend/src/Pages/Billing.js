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
  Card,
  CardContent,
  Stack
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Print as PrintIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  ShoppingCart as ShoppingCartIcon,
  Receipt as ReceiptIcon
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../Services/api';
import BillTemplate from '../Components/BillTemplate';

const Billing = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [items, setItems] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [taxRate, setTaxRate] = useState(18); // Default GST rate
  const [paymentMethod, setPaymentMethod] = useState('Cash');
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
        paymentMethod: paymentMethod,
        status: balanceAmount > 0 ? 'Partially Paid' : 'Paid',
        notes
      };

      const response = await api.post('/bills', billData);
      
      // Prepare bill data for printing
      const printBillData = {
        billNumber: response.data.billNumber,
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
        subtotal: calculateTotals().subTotal,
        discount: discountAmount,
        tax: taxAmount,
        total: grandTotal,
        paidAmount: paidAmount,
        dueAmount: balanceAmount,
        paymentMethod: paymentMethod,
        notes: notes
      };

      // Prepare company info
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
        billData: printBillData, 
        companyInfo 
      }));

      // Navigate to print page
      navigate(`/print-bill?billId=${response.data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save bill');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress size={60} thickness={4} />
      </Box>
    );
  }

  const { subTotal, discountAmount, taxAmount, grandTotal, balanceAmount } = calculateTotals();

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: '1400px', margin: '0 auto' }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} spacing={2} mb={3}>
        <Typography variant="h4" sx={{ 
          fontWeight: 'bold',
          color: theme.palette.primary.main,
          fontSize: { xs: '1.5rem', md: '2rem' }
        }}>
          Create New Bill
        </Typography>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            px: 4,
            py: 1.5,
            fontSize: '1.1rem',
            background: theme.palette.primary.main,
            '&:hover': {
              background: theme.palette.primary.dark,
            }
          }}
        >
          Save & Print Bill
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card elevation={2} sx={{ mb: 2, borderRadius: 2 }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                <PersonIcon color="primary" />
                <Typography variant="h6">Customer Details</Typography>
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
            </CardContent>
          </Card>

          <Card elevation={2} sx={{ mb: 2, borderRadius: 2 }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} mb={2}>
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
            </CardContent>
          </Card>

          <Card elevation={2} sx={{ borderRadius: 2 }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                <ReceiptIcon color="primary" />
                <Typography variant="h6">Bill Items</Typography>
              </Stack>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Product</TableCell>
                      <TableCell align="right">Price</TableCell>
                      <TableCell align="center">Quantity</TableCell>
                      <TableCell align="right">Total</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.productId} hover>
                        <TableCell>{item.name}</TableCell>
                        <TableCell align="right">Rs. {item.price.toFixed(2)}</TableCell>
                        <TableCell align="center">
                          <Box display="flex" alignItems="center" justifyContent="center">
                            <IconButton
                              size="small"
                              onClick={() => handleQuantityChange(item.productId, -1)}
                              sx={{ color: theme.palette.primary.main }}
                            >
                              <RemoveIcon />
                            </IconButton>
                            <Typography sx={{ mx: 1, minWidth: '30px', textAlign: 'center' }}>
                              {item.quantity}
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={() => handleQuantityChange(item.productId, 1)}
                              sx={{ color: theme.palette.primary.main }}
                            >
                              <AddIcon />
                            </IconButton>
                          </Box>
                        </TableCell>
                        <TableCell align="right">Rs. {item.total.toFixed(2)}</TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            onClick={() => handleQuantityChange(item.productId, -item.quantity)}
                            sx={{ color: theme.palette.error.main }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card elevation={2} sx={{ borderRadius: 2, position: { md: 'sticky' }, top: { md: 20 } }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: theme.palette.primary.main }}>
                Bill Summary
              </Typography>
              <Stack spacing={2}>
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
                <FormControl fullWidth>
                  <InputLabel>Payment Method</InputLabel>
                  <Select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    label="Payment Method"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  >
                    <MenuItem value="Cash">Cash</MenuItem>
                    <MenuItem value="Card">Card</MenuItem>
                    <MenuItem value="Bank Transfer">Bank Transfer</MenuItem>
                    <MenuItem value="UPI">UPI</MenuItem>
                    <MenuItem value="Credit">Credit</MenuItem>
                  </Select>
                </FormControl>
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
                <TextField
                  fullWidth
                  label="Notes"
                  multiline
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Stack>

              <Divider sx={{ my: 3 }} />

              <Stack spacing={1.5}>
                <Box display="flex" justifyContent="space-between">
                  <Typography>Subtotal:</Typography>
                  <Typography>Rs. {subTotal.toFixed(2)}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography>Discount:</Typography>
                  <Typography color="error">-Rs. {discountAmount.toFixed(2)}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography>Tax:</Typography>
                  <Typography>Rs. {taxAmount.toFixed(2)}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" sx={{ mt: 1 }}>
                  <Typography variant="h6">Grand Total:</Typography>
                  <Typography variant="h6" color="primary">Rs. {grandTotal.toFixed(2)}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography>Amount Paid:</Typography>
                  <Typography>Rs. {paidAmount.toFixed(2)}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" sx={{ mt: 1 }}>
                  <Typography variant="h6">Balance Due:</Typography>
                  <Typography
                    variant="h6"
                    color={balanceAmount > 0 ? 'error' : 'success'}
                  >
                    Rs. {balanceAmount.toFixed(2)}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Billing; 