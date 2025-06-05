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
  MenuItem
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Print as PrintIcon,
  Save as SaveIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../Services/api';

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

  const handleAddItem = (product) => {
    const existingItem = items.find(item => item.productId === product._id);
    if (existingItem) {
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
    setItems(items.map(item => {
      if (item.productId === productId) {
        const newQuantity = Math.max(0, item.quantity + change);
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
        paymentMethod: paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1),
        notes
      };

      const response = await api.post('/bills', billData);
      navigate(`/billing/${response.data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save bill');
    }
  };

  const handlePrint = () => {
    window.print();
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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Create New Bill</Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            onClick={handlePrint}
            sx={{ mr: 1 }}
          >
            Print
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
          >
            Save Bill
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, mb: 2 }}>
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
                />
              )}
            />
          </Paper>

          <Paper sx={{ p: 2, mb: 2 }}>
            <Autocomplete
              options={products.filter(p => p.isActive)}
              getOptionLabel={(option) => `${option.name} (₹${option.price})`}
              onChange={(event, newValue) => newValue && handleAddItem(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Add Product"
                  fullWidth
                />
              )}
            />
          </Paper>

          <TableContainer component={Paper}>
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
                  <TableRow key={item.productId}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell align="right">₹{item.price.toFixed(2)}</TableCell>
                    <TableCell align="center">
                      <Box display="flex" alignItems="center" justifyContent="center">
                        <IconButton
                          size="small"
                          onClick={() => handleQuantityChange(item.productId, -1)}
                        >
                          <RemoveIcon />
                        </IconButton>
                        <Typography sx={{ mx: 1 }}>{item.quantity}</Typography>
                        <IconButton
                          size="small"
                          onClick={() => handleQuantityChange(item.productId, 1)}
                        >
                          <AddIcon />
                        </IconButton>
                      </Box>
                    </TableCell>
                    <TableCell align="right">₹{item.total.toFixed(2)}</TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={() => handleQuantityChange(item.productId, -item.quantity)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Bill Summary
            </Typography>
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
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Payment Method</InputLabel>
                  <Select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    label="Payment Method"
                  >
                    <MenuItem value="cash">Cash</MenuItem>
                    <MenuItem value="card">Card</MenuItem>
                    <MenuItem value="upi">UPI</MenuItem>
                    <MenuItem value="bank">Bank Transfer</MenuItem>
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
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  }}
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
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            <Box>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography>Subtotal:</Typography>
                <Typography>₹{subTotal.toFixed(2)}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography>Discount:</Typography>
                <Typography color="error">-₹{discountAmount.toFixed(2)}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography>Tax:</Typography>
                <Typography>₹{taxAmount.toFixed(2)}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="h6">Grand Total:</Typography>
                <Typography variant="h6">₹{grandTotal.toFixed(2)}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography>Amount Paid:</Typography>
                <Typography>₹{paidAmount.toFixed(2)}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="h6">Balance Due:</Typography>
                <Typography
                  variant="h6"
                  color={balanceAmount > 0 ? 'error' : 'success'}
                >
                  ₹{balanceAmount.toFixed(2)}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Billing; 