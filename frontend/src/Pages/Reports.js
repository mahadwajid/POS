import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Tabs,
  Tab,
  Grid,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  IconButton,
  MenuItem,
  CircularProgress,
  Alert
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  FileDownload as FileDownloadIcon,
  Print as PrintIcon,
  Send as SendIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import api from '../Services/api';
import dayjs from 'dayjs';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const Reports = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState(dayjs().startOf('month'));
  const [endDate, setEndDate] = useState(dayjs().endOf('day'));
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [customers, setCustomers] = useState([]);
  const [reportData, setReportData] = useState(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    console.log('Active tab changed:', activeTab);
    console.log('Date range changed:', { startDate, endDate });
    console.log('Selected customer changed:', selectedCustomer);
    fetchReportData();
  }, [activeTab, startDate, endDate, selectedCustomer]);

  const fetchCustomers = async () => {
    try {
      const response = await api.get('/customers');
      setCustomers(response.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
      setError('Failed to fetch customers');
    }
  };

  const fetchReportData = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        startDate: startDate.format('YYYY-MM-DD'),
        endDate: endDate.format('YYYY-MM-DD')
      });

      if (selectedCustomer) {
        params.append('customer', selectedCustomer);
      }

      let endpoint = '';
      switch (activeTab) {
        case 0:
          endpoint = '/reports/sales';
          break;
        case 1:
          endpoint = '/reports/expenses';
          break;
        case 2:
          endpoint = '/reports/profit-loss';
          break;
        case 3:
          endpoint = '/reports/customer-ledgers';
          break;
        case 4:
          endpoint = '/reports/outstanding-balances';
          break;
        case 5:
          endpoint = '/reports/top-products';
          break;
        default:
          endpoint = '/reports/sales';
      }

      console.log('Fetching report data from:', endpoint);
      console.log('With params:', params.toString());

      const response = await api.get(`${endpoint}?${params.toString()}`);
      console.log('Report data received:', response.data);
      
      if (!response.data) {
        throw new Error('No data received from server');
      }
      
      setReportData(response.data);
    } catch (error) {
      console.error('Report fetch error:', error);
      setError(error.response?.data?.message || error.message || 'Failed to fetch report data');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format) => {
    try {
      const params = new URLSearchParams({
        startDate: startDate.format('YYYY-MM-DD'),
        endDate: endDate.format('YYYY-MM-DD'),
        format
      });

      if (selectedCustomer) {
        params.append('customer', selectedCustomer);
      }

      const response = await api.get(`/reports/export/${activeTab}?${params.toString()}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSendReminder = async (customerId) => {
    try {
      await api.post(`/customers/${customerId}/reminder`);
      // Show success message
    } catch (error) {
      console.error('Reminder error:', error);
    }
  };

  const renderSalesReport = () => {
    if (!reportData) return null;

    return (
      <Box>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6">Total Sales</Typography>
                <Typography variant="h4">Rs. {reportData.totals?.total?.toFixed(2) || '0.00'}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6">Total Paid</Typography>
                <Typography variant="h4">Rs. {reportData.totals?.paid?.toFixed(2) || '0.00'}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6">Total Due</Typography>
                <Typography variant="h4">Rs. {reportData.totals?.due?.toFixed(2) || '0.00'}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Box sx={{ mt: 3, height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={reportData.dailySales || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="amount" stroke="#8884d8" name="Sales" />
            </LineChart>
          </ResponsiveContainer>
        </Box>

        <TableContainer component={Paper} sx={{ mt: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Invoice ID</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Date</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell align="right">Paid</TableCell>
                <TableCell align="right">Due</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(reportData.sales || []).map((sale) => (
                <TableRow key={sale._id}>
                  <TableCell>{sale.billNumber}</TableCell>
                  <TableCell>{sale.customer?.name || 'N/A'}</TableCell>
                  <TableCell>{new Date(sale.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell align="right">Rs. {sale.total?.toFixed(2) || '0.00'}</TableCell>
                  <TableCell align="right">Rs. {sale.paidAmount?.toFixed(2) || '0.00'}</TableCell>
                  <TableCell align="right">Rs. {sale.dueAmount?.toFixed(2) || '0.00'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  };

  const renderExpenseReport = () => {
    if (!reportData) return null;

    return (
      <Box>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6">Total Expenses</Typography>
                <Typography variant="h4">Rs. {reportData.total?.toFixed(2) || '0.00'}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={reportData.categoryExpenses || []}
                    dataKey="amount"
                    nameKey="_id"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {(reportData.categoryExpenses || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Grid>
        </Grid>

        <Box sx={{ mt: 3, height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={reportData.monthlyExpenses || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="amount" stroke="#82ca9d" name="Expenses" />
            </LineChart>
          </ResponsiveContainer>
        </Box>

        <TableContainer component={Paper} sx={{ mt: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Description</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell>Payment Method</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(reportData.expenses || []).map((expense) => (
                <TableRow key={expense._id}>
                  <TableCell>{new Date(expense.date).toLocaleDateString()}</TableCell>
                  <TableCell>{expense.category}</TableCell>
                  <TableCell>{expense.description}</TableCell>
                  <TableCell align="right">Rs. {expense.amount?.toFixed(2) || '0.00'}</TableCell>
                  <TableCell>{expense.paymentMethod}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  };

  const renderProfitLossReport = () => {
    if (!reportData) return null;

    return (
      <Box>
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6">Total Sales</Typography>
                <Typography variant="h4">Rs. {reportData.totalSales?.toFixed(2) || '0.00'}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6">Total Cost</Typography>
                <Typography variant="h4">Rs. {reportData.totalCost?.toFixed(2) || '0.00'}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6">Total Expenses</Typography>
                <Typography variant="h4">Rs. {reportData.totalExpenses?.toFixed(2) || '0.00'}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6">Net Profit</Typography>
                <Typography
                  variant="h4"
                  color={reportData.netProfit >= 0 ? 'success.main' : 'error.main'}
                >
                  Rs. {reportData.netProfit?.toFixed(2) || '0.00'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Box sx={{ mt: 3, height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={reportData.monthlyProfit || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="sales" stroke="#8884d8" name="Sales" />
              <Line type="monotone" dataKey="cost" stroke="#82ca9d" name="Cost" />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </Box>
    );
  };

  const renderCustomerLedgerReport = () => {
    if (!reportData) return null;

    return (
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Customer</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell align="right">Total Billed</TableCell>
              <TableCell align="right">Total Paid</TableCell>
              <TableCell align="right">Total Due</TableCell>
              <TableCell>Last Transaction</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.isArray(reportData) ? reportData.map((ledger) => (
              <TableRow key={ledger.customer?._id}>
                <TableCell>{ledger.customer?.name || 'N/A'}</TableCell>
                <TableCell>{ledger.customer?.phone || 'N/A'}</TableCell>
                <TableCell align="right">Rs. {ledger.totalBilled?.toFixed(2) || '0.00'}</TableCell>
                <TableCell align="right">Rs. {ledger.totalPaid?.toFixed(2) || '0.00'}</TableCell>
                <TableCell align="right">Rs. {ledger.totalDue?.toFixed(2) || '0.00'}</TableCell>
                <TableCell>
                  {ledger.lastTransaction
                    ? new Date(ledger.lastTransaction).toLocaleDateString()
                    : 'No transactions'}
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={6} align="center">No data available</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  const renderOutstandingBalancesReport = () => {
    if (!reportData) return null;

    return (
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Customer</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell align="right">Total Due</TableCell>
              <TableCell>Last Invoice</TableCell>
              <TableCell>Last Payment</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.isArray(reportData) ? reportData.map((balance) => (
              <TableRow key={balance.customer?._id}>
                <TableCell>{balance.customer?.name || 'N/A'}</TableCell>
                <TableCell>{balance.customer?.phone || 'N/A'}</TableCell>
                <TableCell align="right">Rs. {balance.totalDue?.toFixed(2) || '0.00'}</TableCell>
                <TableCell>
                  {balance.lastInvoice
                    ? `${balance.lastInvoice.number} (${new Date(
                        balance.lastInvoice.date
                      ).toLocaleDateString()})`
                    : 'No invoices'}
                </TableCell>
                <TableCell>
                  {balance.lastPayment
                    ? `${new Date(balance.lastPayment.date).toLocaleDateString()} (Rs. ${balance.lastPayment.amount?.toFixed(2)})`
                    : 'No payments'}
                </TableCell>
                <TableCell>
                  <IconButton
                    onClick={() => handleSendReminder(balance.customer?._id)}
                    color="primary"
                  >
                    <SendIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={6} align="center">No data available</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  const renderTopProductsReport = () => {
    if (!reportData) return null;

    return (
      <Box>
        <Box sx={{ height: 400 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={Array.isArray(reportData) ? reportData : []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="product.name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="totalRevenue" fill="#8884d8" name="Revenue" />
              <Bar dataKey="totalQuantity" fill="#82ca9d" name="Quantity" />
            </BarChart>
          </ResponsiveContainer>
        </Box>

        <TableContainer component={Paper} sx={{ mt: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Product</TableCell>
                <TableCell>SKU</TableCell>
                <TableCell align="right">Quantity Sold</TableCell>
                <TableCell align="right">Total Revenue</TableCell>
                <TableCell align="right">Average Price</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Array.isArray(reportData) ? reportData.map((product) => (
                <TableRow key={product.product?._id}>
                  <TableCell>{product.product?.name || 'N/A'}</TableCell>
                  <TableCell>{product.product?.sku || 'N/A'}</TableCell>
                  <TableCell align="right">{product.totalQuantity || 0}</TableCell>
                  <TableCell align="right">Rs. {product.totalRevenue?.toFixed(2) || '0.00'}</TableCell>
                  <TableCell align="right">Rs. {product.averagePrice?.toFixed(2) || '0.00'}</TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={5} align="center">No data available</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  };

  const renderReportContent = () => {
    if (loading) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      );
    }

    if (error) {
      return (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      );
    }

    switch (activeTab) {
      case 0:
        return renderSalesReport();
      case 1:
        return renderExpenseReport();
      case 2:
        return renderProfitLossReport();
      case 3:
        return renderCustomerLedgerReport();
      case 4:
        return renderOutstandingBalancesReport();
      case 5:
        return renderTopProductsReport();
      default:
        return null;
    }
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Reports
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <DatePicker
                    label="Start Date"
                    value={startDate}
                    onChange={(newValue) => setStartDate(newValue)}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </Grid>
                <Grid item xs={6}>
                  <DatePicker
                    label="End Date"
                    value={endDate}
                    onChange={(newValue) => setEndDate(newValue)}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </Grid>
              </Grid>
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              select
              fullWidth
              label="Customer"
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
            >
              <MenuItem value="">All Customers</MenuItem>
              {customers.map((customer) => (
                <MenuItem key={customer._id} value={customer._id}>
                  {customer.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<FileDownloadIcon />}
                onClick={() => handleExport('pdf')}
                disabled={loading || !reportData}
              >
                Export PDF
              </Button>
              <Button
                variant="outlined"
                startIcon={<FileDownloadIcon />}
                onClick={() => handleExport('excel')}
                disabled={loading || !reportData}
              >
                Export Excel
              </Button>
              <Button
                variant="outlined"
                startIcon={<PrintIcon />}
                onClick={handlePrint}
                disabled={loading || !reportData}
              >
                Print
              </Button>
            </Box>
          </Grid>
        </Grid>

        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="Sales Report" />
            <Tab label="Expense Report" />
            <Tab label="Profit & Loss" />
            <Tab label="Customer Ledger" />
            <Tab label="Outstanding Balances" />
            <Tab label="Top Products" />
          </Tabs>
        </Paper>

        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <CircularProgress />
          </Box>
        ) : (
          renderReportContent()
        )}
      </Box>
    </Container>
  );
};

export default Reports; 