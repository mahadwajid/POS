import React, { useEffect, useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, Typography, Button } from '@mui/material';
import BillTemplate from './BillTemplate';
import { useNavigate } from 'react-router-dom';
import '../styles/print.css';

const PrintBill = () => {
  const [printData, setPrintData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadPrintData = () => {
      try {
        const storedData = localStorage.getItem('printBillData');
        console.log('Loaded printBillData from localStorage:', storedData);
        
        if (!storedData) {
          setError('No bill data found. Please try printing again from the billing page.');
          setLoading(false);
          return;
        }
  
        const parsedData = JSON.parse(storedData);
        console.log('Parsed print data:', parsedData);
        
        // Validate required data
        if (!parsedData || !parsedData.billData || !parsedData.companyInfo) {
          setError('Invalid bill data format. Please try printing again.');
          setLoading(false);
          return;
        }
  
        // Validate minimum required bill data
        if (!parsedData.billData.customer || !parsedData.billData.items) {
          setError('Bill data is incomplete. Please try printing again.');
          setLoading(false);
          return;
        }
  
        setPrintData(parsedData);
        setLoading(false);
      } catch (err) {
        console.error('Error loading bill data:', err);
        setError('Error loading bill data. Please try printing again.');
        setLoading(false);
      }
    };
  
    loadPrintData();
  
    // Clean up localStorage when component unmounts
    return () => {
      localStorage.removeItem('printBillData');
    };
  }, []);

  const handlePrint = () => {
    if (printData) {
      // Use requestAnimationFrame to ensure the DOM is painted before printing
      requestAnimationFrame(() => {
        window.print();
      });
      window.onafterprint = () => {
        localStorage.removeItem('printBillData');
        navigate('/billing');
      };
    }
  };

  const handleBack = () => {
    localStorage.removeItem('printBillData');
    navigate('/billing');
  };

  const theme = createTheme({
    typography: {
      fontFamily: 'Roboto, Arial, sans-serif',
    },
    components: {
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderColor: '#000',
          },
        },
      },
    },
  });

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Typography variant="h6">Loading bill data...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="100vh" p={3}>
        <Typography variant="h5" color="error" gutterBottom>
          {error}
        </Typography>
        <Button variant="contained" onClick={handleBack} sx={{ mt: 2 }}>
          Back to Billing
        </Button>
      </Box>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box className="bill-template">
        <BillTemplate
          bill={printData?.billData}
          companyInfo={printData?.companyInfo}
        />
        <Box display="flex" justifyContent="center" mt={2} className="print-button">
          <Button variant="contained" onClick={handlePrint}>
            Print Bill
          </Button>
          <Button variant="outlined" onClick={handleBack} sx={{ ml: 2 }}>
            Back to Billing
          </Button>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default PrintBill; 