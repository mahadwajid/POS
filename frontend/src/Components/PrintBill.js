import React, { useEffect, useState, useRef } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, Typography, Button } from '@mui/material';
import BillTemplate from './BillTemplate';
import { useNavigate } from 'react-router-dom';
import '../styles/print.css';
import { PDFDownloadLink } from '@react-pdf/renderer';
import InvoicePDF from './InvoicePDF';

const PrintBill = () => {
  const [printData, setPrintData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const printRef = useRef(null);

  useEffect(() => {
    const loadPrintData = () => {
      try {
        const storedData = localStorage.getItem('printBillData');
        console.log('Raw stored data:', storedData);
        
        if (!storedData) {
          console.error('No data found in localStorage');
          setError('No bill data found. Please try printing again from the billing page.');
          setLoading(false);
          return;
        }

        const parsedData = JSON.parse(storedData);
        console.log('Parsed print data:', parsedData);

        if (!parsedData) {
          console.error('Failed to parse stored data');
          setError('Invalid bill data format. Please try printing again.');
          setLoading(false);
          return;
        }

        if (!parsedData.billData) {
          console.error('Missing billData in parsed data:', parsedData);
          setError('Bill data is missing. Please try printing again.');
          setLoading(false);
          return;
        }

        if (!parsedData.companyInfo) {
          console.error('Missing companyInfo in parsed data:', parsedData);
          setError('Company information is missing. Please try printing again.');
          setLoading(false);
          return;
        }

        // Validate required bill data fields
        const requiredFields = ['customer', 'items', 'total', 'subtotal', 'paidAmount'];
        const missingFields = requiredFields.filter(field => !parsedData.billData[field]);
        
        if (missingFields.length > 0) {
          console.error('Missing required fields:', missingFields);
          setError(`Missing required bill data: ${missingFields.join(', ')}`);
          setLoading(false);
          return;
        }

        // Ensure tax is set to 0 if not provided
        if (!parsedData.billData.tax) {
          parsedData.billData.tax = 0;
          parsedData.billData.taxAmount = 0;
        }

        // Ensure dueAmount is set (can be 0)
        if (parsedData.billData.dueAmount === undefined || parsedData.billData.dueAmount === null) {
          parsedData.billData.dueAmount = 0;
        }

        // Log the final data being set
        console.log('Setting print data:', parsedData);
        setPrintData(parsedData);
        setLoading(false);
      } catch (err) {
        console.error('Error loading print data:', err);
        setError('Error loading bill data. Please try printing again.');
        setLoading(false);
      }
    };

    loadPrintData();
  }, []);

  const handleBack = () => {
    localStorage.removeItem('printBillData');
    navigate('/billing');
  };

  const handlePrint = () => {
    if (printRef.current) {
      window.print();
    }
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
      <Box className="bill-template" ref={printRef}>
        <BillTemplate
          bill={printData?.billData}
          companyInfo={printData?.companyInfo}
        />
        <Box display="flex" justifyContent="center" mt={2} className="print-button">
          {printData && (
            <>
              {/* <Button variant="contained" onClick={handlePrint} sx={{ mr: 2 }}>
                Print Bill
              </Button> */}
              <PDFDownloadLink
                document={<InvoicePDF bill={printData.billData} companyInfo={printData.companyInfo} />}
                fileName={`Invoice-${printData.billData.billNumber}.pdf`}
                style={{ textDecoration: 'none' }}
              >
                {({ loading }) =>
                  loading ? (
                    <Button variant="contained" disabled>Generating PDF...</Button>
                  ) : (
                    <Button variant="contained">Download PDF</Button>
                  )
                }
              </PDFDownloadLink>
            </>
          )}
          <Button variant="outlined" onClick={handleBack} sx={{ ml: 2 }}>
            Back to Billing
          </Button>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default PrintBill; 