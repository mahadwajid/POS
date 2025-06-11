import React from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, Table, TableBody, TableCell, TableHead, TableRow, Divider } from '@mui/material';

function formatCurrency(amount) {
  if (typeof amount !== 'number') return 'N/A';
  return `Rs. ${amount.toFixed(2)}`;
}

const BillTemplate = ({ bill, companyInfo }) => {
  // Debug logs
  console.log('BillTemplate bill:', bill);
  console.log('BillTemplate companyInfo:', companyInfo);

  if (!bill || !companyInfo) {
    return (
      <Box p={4} textAlign="center">
        <Typography variant="h5" color="error">No Bill Data Found</Typography>
        <Typography variant="body1">Please try printing again from the billing page.</Typography>
      </Box>
    );
  }

  const {
    billNumber,
    date,
    customer = {},
    items = [],
    subtotal,
    tax,
    total,
    paidAmount,
    dueAmount,
    paymentMethod,
    notes
  } = bill;

  const {
    name: companyName,
    logo
  } = companyInfo;

  // Format address if it's an object
  let formattedAddress = 'N/A';
  if (customer.address) {
    if (typeof customer.address === 'object') {
      formattedAddress = Object.values(customer.address).filter(Boolean).join(', ');
    } else {
      formattedAddress = customer.address;
    }
  }

  return (
    <Box p={6} maxWidth={800} margin="0 auto" bgcolor="#fff" sx={{ boxShadow: '0 0 10px rgba(0,0,0,0.1)' }}>
      {/* Header Section */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={4}>
  <Box display="flex" alignItems="center" gap={1}>
    <img
      src="/Logo1.png"
      alt="Company Logo"
      style={{
        height: 150, // Increased from 120
        width: 150,  // Increased from 120
        objectFit: 'contain',
      }}
    />
    <Box display="flex" flexDirection="column" gap={0}>
      <Typography variant="h4" fontWeight="bold" sx={{ color: '#333' }}>
        {companyName || 'KPK Cables'}
      </Typography>
      <Typography variant="body2" color="textSecondary">TM # 562363</Typography>
    </Box>
  </Box>

  <Typography variant="h3" fontWeight="bold" color="#424242">INVOICE</Typography>
</Box>

<Divider sx={{ mt: -6, mb: 4 }} />

      {/* Invoice Details and Total Due */}
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={4}>
        <Box>
          <Typography variant="h6" sx={{ mb: 1, color: '#424242' }}>Invoice to :</Typography>
          <Typography variant="h5" fontWeight="bold" color="#333" sx={{ mb: 0.5 }}>{customer.name || 'N/A'}</Typography>
      
          <Typography variant="body2" color="textSecondary">{formattedAddress}</Typography>
          <Typography variant="body2" color="textSecondary">{customer.phone || 'N/A'}</Typography>
        </Box>
        <Box textAlign="right">
          <Typography variant="body1"><b>Invoice Date:</b> {date ? new Date(date).toLocaleDateString() : 'N/A'}</Typography>
          <Typography variant="body1"><b>Invoice No:</b> {billNumber || 'N/A'}</Typography>
          <Typography variant="h5" fontWeight="bold" color="error" mt={2}>Total Due : {formatCurrency(dueAmount)}</Typography>
        </Box>
      </Box>

      {/* Items Table */}
      <Table size="small" sx={{ mb: 4, '& .MuiTableCell-head': { backgroundColor: '#424242', color: '#fff', fontWeight: 'bold' } }}>
        <TableHead>
          <TableRow>
            <TableCell>Description</TableCell>
            <TableCell align="right">Qty</TableCell>
            <TableCell align="right">Price</TableCell>
            <TableCell align="right">Total</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.length > 0 ? items.map((item, idx) => (
            <TableRow key={idx} sx={{ '&:nth-of-type(odd)': { backgroundColor: '#f5f5f5' } }}>
              <TableCell>{item.name || 'N/A'}</TableCell>
              <TableCell align="right">{item.quantity || 0}</TableCell>
              <TableCell align="right">{formatCurrency(item.price)}</TableCell>
              <TableCell align="right">{formatCurrency(item.total)}</TableCell>
            </TableRow>
          )) : (
            <TableRow>
              <TableCell colSpan={4} align="center">No items</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Summary and Payment Method */}
      <Box display="flex" justifyContent="space-between" mb={4}>
        <Box flex={1}>
          <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>Payment Method</Typography>
          <Typography variant="body2" color="textSecondary">Method: {paymentMethod || 'N/A'}</Typography>
      
        </Box>
        <Box textAlign="right" flex={1}>
          <Table size="small" sx={{ width: 'auto', marginLeft: 'auto', '& .MuiTableCell-root': { borderBottom: 'none' } }}>
            <TableBody>
              <TableRow>
                <TableCell sx={{ pr: 1, textAlign: 'right' }}><Typography variant="body1">Sub-total :</Typography></TableCell>
                <TableCell><Typography variant="body1">{formatCurrency(subtotal)}</Typography></TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ pr: 1, textAlign: 'right' }}><Typography variant="body1">Tax ({bill.tax}%):</Typography></TableCell>
                <TableCell><Typography variant="body1">{formatCurrency(tax)}</Typography></TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ pr: 1, textAlign: 'right', backgroundColor: '#424242', color: '#fff' }}><Typography variant="h6" fontWeight="bold">Total :</Typography></TableCell>
                <TableCell sx={{ backgroundColor: '#424242', color: '#fff' }}><Typography variant="h6" fontWeight="bold">{formatCurrency(total)}</Typography></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Box>
      </Box>

      {notes && (
        <Box mb={2}>
          <Typography variant="body2"><b>Notes:</b> {notes}</Typography>
        </Box>
      )}

      {/* Terms and Conditions & Administrator */}
      <Box display="flex" justifyContent="space-between" alignItems="flex-end" mt={4}>
       
        <Box textAlign="right" flex={1}>
          <Typography variant="h6" fontWeight="bold">Hajji Waheed Ahmad</Typography>
          <Typography variant="body2" color="textSecondary">Phone No: 0313-9405885</Typography>
        </Box>
      </Box>
    </Box>
  );
};

BillTemplate.propTypes = {
  bill: PropTypes.object.isRequired,
  companyInfo: PropTypes.object.isRequired
};

export default BillTemplate;