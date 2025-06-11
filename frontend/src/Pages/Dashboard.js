import React, { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Card,
  CardContent,
  useTheme,
  useMediaQuery,
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
  Cell,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  Inventory,
  People,
  AccountBalance,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import api from '../Services/api';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const StatCard = ({ title, value, subtitle, icon, color }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  return (
    <Card
      elevation={0}
      sx={{
        height: '100%',
        bgcolor: 'background.paper',
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 2,
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: isMobile ? 'none' : 'translateY(-4px)',
          boxShadow: isMobile ? 'none' : theme.shadows[4],
        },
      }}
    >
      <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: { xs: 1, sm: 2 } }}>
          <Box
            sx={{
              bgcolor: `${color}15`,
              p: { xs: 0.75, sm: 1 },
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {React.cloneElement(icon, { 
              sx: { 
                color: color,
                fontSize: { xs: '1.25rem', sm: '1.5rem' }
              } 
            })}
          </Box>
        </Box>
        <Typography 
          variant="h4" 
          component="div" 
          sx={{ 
            mb: { xs: 0.5, sm: 1 }, 
            fontWeight: 600,
            fontSize: { xs: '1.5rem', sm: '2rem' }
          }}
        >
          {value}
        </Typography>
        <Typography 
          variant="subtitle2" 
          color="text.secondary" 
          sx={{ 
            mb: { xs: 0.25, sm: 0.5 },
            fontSize: { xs: '0.75rem', sm: '0.875rem' }
          }}
        >
          {title}
        </Typography>
        <Typography 
          variant="body2" 
          color="text.secondary"
          sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
        >
          {subtitle}
        </Typography>
      </CardContent>
    </Card>
  );
};

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

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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
    <Box>
      <Typography
        variant="h4"
        sx={{
          mb: { xs: 2, sm: 3 },
          fontWeight: 600,
          color: 'text.primary',
          fontSize: { xs: '1.5rem', sm: '2rem' }
        }}
      >
        Dashboard
      </Typography>

      <Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Today's Sales"
            value={`Rs. ${salesData.today.totalSales.toFixed(2)}`}
            subtitle={`${salesData.today.count} transactions`}
            icon={<TrendingUp />}
            color={theme.palette.primary.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Products"
            value={inventoryData.totalProducts}
            subtitle={`Rs. ${inventoryData.totalValue.toFixed(2)} total value`}
            icon={<Inventory />}
            color={theme.palette.success.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Customers"
            value={customerData.totalCustomers}
            subtitle={`${customerData.customersWithDues} with dues`}
            icon={<People />}
            color={theme.palette.info.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Dues"
            value={`Rs. ${customerData.totalDues.toFixed(2)}`}
            subtitle="Outstanding amount"
            icon={<AccountBalance />}
            color={theme.palette.warning.main}
          />
        </Grid>

        <Grid item xs={12} md={8}>
          <Card
            elevation={0}
            sx={{
              height: '100%',
              bgcolor: 'background.paper',
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 2,
            }}
          >
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  mb: { xs: 2, sm: 3 }, 
                  fontWeight: 600,
                  fontSize: { xs: '1rem', sm: '1.25rem' }
                }}
              >
                Weekly Sales
              </Typography>
              <Box sx={{ height: { xs: 250, sm: 300 } }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={salesData.weekly}>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                    <XAxis
                      dataKey="_id"
                      stroke={theme.palette.text.secondary}
                      tick={{ 
                        fill: theme.palette.text.secondary,
                        fontSize: { xs: 10, sm: 12 }
                      }}
                    />
                    <YAxis
                      stroke={theme.palette.text.secondary}
                      tick={{ 
                        fill: theme.palette.text.secondary,
                        fontSize: { xs: 10, sm: 12 }
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: theme.palette.background.paper,
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 8,
                        fontSize: { xs: 12, sm: 14 }
                      }}
                    />
                    <Legend 
                      wrapperStyle={{
                        fontSize: { xs: 12, sm: 14 }
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="amount"
                      stroke={theme.palette.primary.main}
                      strokeWidth={2}
                      dot={{ fill: theme.palette.primary.main }}
                      name="Sales"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card
            elevation={0}
            sx={{
              height: '100%',
              bgcolor: 'background.paper',
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 2,
            }}
          >
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  mb: { xs: 2, sm: 3 }, 
                  fontWeight: 600,
                  fontSize: { xs: '1rem', sm: '1.25rem' }
                }}
              >
                Sales by Category
              </Typography>
              <Box sx={{ height: { xs: 250, sm: 300 } }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={salesData.categoryWise}
                      dataKey="amount"
                      nameKey="_id"
                      cx="50%"
                      cy="50%"
                      outerRadius={isMobile ? 60 : 80}
                      label
                    >
                      {salesData.categoryWise.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: theme.palette.background.paper,
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 8,
                        fontSize: { xs: 12, sm: 14 }
                      }}
                    />
                    <Legend 
                      wrapperStyle={{
                        fontSize: { xs: 12, sm: 14 }
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card
            elevation={0}
            sx={{
              bgcolor: 'background.paper',
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 2,
            }}
          >
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  mb: { xs: 2, sm: 3 }, 
                  fontWeight: 600,
                  fontSize: { xs: '1rem', sm: '1.25rem' }
                }}
              >
                Monthly Sales
              </Typography>
              <Box sx={{ height: { xs: 250, sm: 300 } }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salesData.monthly}>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                    <XAxis
                      dataKey="_id"
                      stroke={theme.palette.text.secondary}
                      tick={{ 
                        fill: theme.palette.text.secondary,
                        fontSize: { xs: 10, sm: 12 }
                      }}
                    />
                    <YAxis
                      stroke={theme.palette.text.secondary}
                      tick={{ 
                        fill: theme.palette.text.secondary,
                        fontSize: { xs: 10, sm: 12 }
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: theme.palette.background.paper,
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 8,
                        fontSize: { xs: 12, sm: 14 }
                      }}
                    />
                    <Legend 
                      wrapperStyle={{
                        fontSize: { xs: 12, sm: 14 }
                      }}
                    />
                    <Bar
                      dataKey="amount"
                      fill={theme.palette.primary.main}
                      radius={[4, 4, 0, 0]}
                      name="Sales"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 