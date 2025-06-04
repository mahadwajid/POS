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
  Chip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Payment as PaymentIcon
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { useAuth } from '../context/AuthContext';
import api from '../Services/api';

const validationSchema = yup.object({
  name: yup.string().required('Name is required'),
  phone: yup.string().required('Phone number is required'),
  email: yup.string().email('Invalid email'),
  creditLimit: yup.number().min(0, 'Credit limit must be positive')
});

const Customers = () => {
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

  const formik = useFormik({
    initialValues: {
      name: '',
      phone: '',
      email: '',
      address: '',
      creditLimit: '',
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
        setError('Failed to delete customer');
      }
    }
  };

  const handlePaymentOpen = (customer) => {
    setSelectedCustomer(customer);
    setPaymentOpen(true);
  };

  const handlePaymentClose = () => {
    setPaymentOpen(false);
    setSelectedCustomer(null);
    setSelectedBill(null);
  };

  const handlePaymentSubmit = async (values) => {
    try {
      await api.put(`/bills/${selectedBill._id}/payment`, values);
      handlePaymentClose();
      fetchCustomers();
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

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Customers
      </Typography>
      {/* Customer list will go here */}
    </Box>
  );
};

export default Customers; 