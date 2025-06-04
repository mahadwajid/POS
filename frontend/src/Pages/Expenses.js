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
  MenuItem,
  Alert,
  CircularProgress,
  Chip,
  FormControlLabel,
  Switch
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  DateRange as DateRangeIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { useAuth } from '../context/AuthContext';
import api from '../Services/api';

const validationSchema = yup.object({
  title: yup.string().required('Title is required'),
  amount: yup.number().required('Amount is required').min(0, 'Amount must be positive'),
  category: yup.string().required('Category is required'),
  date: yup.date().required('Date is required'),
  paymentMethod: yup.string().required('Payment method is required')
});

const categories = [
  'Rent',
  'Utilities',
  'Salaries',
  'Inventory',
  'Maintenance',
  'Marketing',
  'Other'
];

const paymentMethods = [
  'Cash',
  'Card',
  'UPI',
  'Bank Transfer'
];

const Expenses = () => {
  const { isSuperAdmin } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [showRecurring, setShowRecurring] = useState(false);

  const formik = useFormik({
    initialValues: {
      title: '',
      amount: '',
      category: '',
      date: new Date(),
      description: '',
      paymentMethod: '',
      receipt: '',
      isRecurring: false,
      recurringDetails: {
        frequency: 'monthly',
        startDate: new Date(),
        endDate: null
      }
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        if (selectedExpense) {
          await api.put(`/expenses/${selectedExpense._id}`, values);
        } else {
          await api.post('/expenses', values);
        }
        handleClose();
        fetchExpenses();
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to save expense');
      }
    }
  });

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const response = await api.get('/expenses', {
        params: {
          search,
          startDate: startDate?.toISOString(),
          endDate: endDate?.toISOString(),
          isRecurring: showRecurring
        }
      });
      setExpenses(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch expenses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [search, startDate, endDate, showRecurring]);

  const handleOpen = (expense = null) => {
    if (expense) {
      setSelectedExpense(expense);
      formik.setValues(expense);
    } else {
      setSelectedExpense(null);
      formik.resetForm();
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedExpense(null);
    formik.resetForm();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await api.delete(`/expenses/${id}`);
        fetchExpenses();
      } catch (err) {
        setError('Failed to delete expense');
      }
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
        Expenses
      </Typography>
      {/* Expenses list will go here */}
    </Box>
  );
};

export default Expenses; 