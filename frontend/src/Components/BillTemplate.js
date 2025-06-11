import React from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, Table, TableBody, TableCell, TableHead, TableRow, Divider } from '@mui/material';

const DefaultLogo = () => (
  <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="80" height="80" rx="16" fill="#1976d2"/>
    <text x="40" y="48" textAnchor="middle" fontSize="32" fill="#fff" fontFamily="Arial, sans-serif">LOGO</text>
  </svg>
);

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
    paymentMethod,
    notes
  } = bill;

  const {
    name: companyName,
    address: companyAddress,
    phone: companyPhone,
    email: companyEmail,
    gstin: companyGSTIN,
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
    <Box p={4} maxWidth={600} margin="0 auto" bgcolor="#fff">
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Box>
          {logo ? (
            <img src={logo} alt="Company Logo" style={{ height: 64, objectFit: 'contain' }} />
          ) : (
            <DefaultLogo />
          )}
        </Box>
        <Box textAlign="right">
          <Typography variant="h6" fontWeight="bold">{companyName || 'N/A'}</Typography>
          <Typography variant="body2">{companyAddress || 'N/A'}</Typography>
          <Typography variant="body2">Phone: {companyPhone || 'N/A'}</Typography>
          <Typography variant="body2">Email: {companyEmail || 'N/A'}</Typography>
          <Typography variant="body2">GSTIN: {companyGSTIN || 'N/A'}</Typography>
        </Box>
      </Box>
      <Divider sx={{ my: 2 }} />
      <Box mb={2}>
        <Typography variant="subtitle1"><b>Bill No:</b> {billNumber || 'N/A'}</Typography>
        <Typography variant="subtitle1"><b>Date:</b> {date ? new Date(date).toLocaleString() : 'N/A'}</Typography>
        <Typography variant="subtitle1"><b>Customer:</b> {customer.name || 'N/A'}</Typography>
        <Typography variant="subtitle1"><b>Phone:</b> {customer.phone || 'N/A'}</Typography>
        <Typography variant="subtitle1"><b>Address:</b> {formattedAddress}</Typography>
      </Box>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell><b>Item</b></TableCell>
            <TableCell align="right"><b>Qty</b></TableCell>
            <TableCell align="right"><b>Price</b></TableCell>
            <TableCell align="right"><b>Total</b></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.length > 0 ? items.map((item, idx) => (
            <TableRow key={idx}>
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
      <Divider sx={{ my: 2 }} />
      <Box display="flex" flexDirection="column" alignItems="flex-end" mb={2}>
        <Typography variant="body1"><b>Subtotal:</b> {formatCurrency(subtotal)}</Typography>
        <Typography variant="body1"><b>Tax (18%):</b> {formatCurrency(tax)}</Typography>
        <Typography variant="h6"><b>Total:</b> {formatCurrency(total)}</Typography>
        <Typography variant="body2"><b>Payment Method:</b> {paymentMethod || 'N/A'}</Typography>
      </Box>
      {notes && (
        <Box mb={2}>
          <Typography variant="body2"><b>Notes:</b> {notes}</Typography>
        </Box>
      )}
      <Divider sx={{ my: 2 }} />
      <Box textAlign="center" mt={2}>
        <Typography variant="body2" color="textSecondary">Thank you for your business!</Typography>
      </Box>
    </Box>
  );
};

BillTemplate.propTypes = {
  bill: PropTypes.object.isRequired,
  companyInfo: PropTypes.object.isRequired
};

export default BillTemplate;