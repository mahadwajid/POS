import React, { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Card,
  CardContent
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import api from '../Services/api';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [salesData, setSalesData] = useState({
    today: {
      totalSales: 0,
      totalPaid: 0,
      totalDue: 0,
      count: 0
    },
    weekly: [],
    monthly: [],
    categoryWise: []
  });
  const [inventoryData, setInventoryData] = useState({
    lowStock: [],
    totalProducts: 0,
    totalValue: 0
  });
  const [customerData, setCustomerData] = useState({
    totalCustomers: 0,
    customersWithDues: 0,
    totalDues: 0
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [
          todaySales,
          weeklySales,
          monthlySales,
          categorySales,
          lowStock,
          customerStats
        ] = await Promise.all([
          api.get('/bills/summary/today'),
          api.get('/bills/summary/weekly'),
          api.get('/bills/summary/monthly'),
          api.get('/bills/summary/category'),
          api.get('/products/inventory/low-stock'),
          api.get('/customers/stats')
        ]);

        setSalesData({
          today: todaySales.data,
          weekly: weeklySales.data,
          monthly: monthlySales.data,
          categoryWise: categorySales.data
        });

        setInventoryData({
          lowStock: lowStock.data,
          totalProducts: lowStock.data.length,
          totalValue: lowStock.data.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0)
        });

        setCustomerData(customerStats.data);
        setError(null);
      } catch (err) {
        setError('Failed to fetch dashboard data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6} lg={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Total Sales</Typography>
            <Typography variant="h4">$0.00</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Total Products</Typography>
            <Typography variant="h4">0</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Total Customers</Typography>
            <Typography variant="h4">0</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Total Expenses</Typography>
            <Typography variant="h4">$0.00</Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 