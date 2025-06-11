import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 24,
    fontSize: 12,
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  companyInfo: {
    textAlign: 'right',
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 8,
  },
  section: {
    marginBottom: 12,
  },
  table: {
    display: 'table',
    width: 'auto',
    marginVertical: 8,
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableColHeader: {
    width: '25%',
    borderBottom: '1 solid #000',
    fontWeight: 'bold',
    padding: 4,
  },
  tableCol: {
    width: '25%',
    padding: 4,
    borderBottom: '1 solid #eee',
  },
  total: {
    textAlign: 'right',
    marginTop: 8,
    fontSize: 14,
    fontWeight: 'bold',
  },
});

const InvoicePDF = ({ bill, companyInfo }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <View>
          {companyInfo.logo && (
            <Image src={companyInfo.logo} style={styles.logo} />
          )}
        </View>
        <View style={styles.companyInfo}>
          <Text>{companyInfo.name}</Text>
          <Text>{companyInfo.address}</Text>
          <Text>Phone: {companyInfo.phone}</Text>
          <Text>Email: {companyInfo.email}</Text>
          <Text>GSTIN: {companyInfo.gstin}</Text>
        </View>
      </View>
      <View style={styles.section}>
        <Text>Bill No: {bill.billNumber}</Text>
        <Text>Date: {bill.date ? new Date(bill.date).toLocaleString() : ''}</Text>
        <Text>Customer: {bill.customer?.name}</Text>
        <Text>Phone: {bill.customer?.phone}</Text>
        <Text>Address: {typeof bill.customer?.address === 'object' ? Object.values(bill.customer.address).join(', ') : bill.customer?.address}</Text>
      </View>
      <View style={styles.table}>
        <View style={styles.tableRow}>
          <Text style={styles.tableColHeader}>Item</Text>
          <Text style={styles.tableColHeader}>Qty</Text>
          <Text style={styles.tableColHeader}>Price</Text>
          <Text style={styles.tableColHeader}>Total</Text>
        </View>
        {bill.items.map((item, idx) => (
          <View style={styles.tableRow} key={idx}>
            <Text style={styles.tableCol}>{item.name}</Text>
            <Text style={styles.tableCol}>{item.quantity}</Text>
            <Text style={styles.tableCol}>₹{item.price.toFixed(2)}</Text>
            <Text style={styles.tableCol}>₹{item.total.toFixed(2)}</Text>
          </View>
        ))}
      </View>
      <View style={styles.section}>
        <Text>Subtotal: ₹{bill.subtotal.toFixed(2)}</Text>
        <Text>Tax: ₹{bill.tax.toFixed(2)}</Text>
        <Text style={styles.total}>Total: ₹{bill.total.toFixed(2)}</Text>
        <Text>Payment Method: {bill.paymentMethod}</Text>
        {bill.notes && <Text>Notes: {bill.notes}</Text>}
      </View>
      <Text style={{ marginTop: 16, textAlign: 'center' }}>Thank you for your business!</Text>
    </Page>
  </Document>
);

export default InvoicePDF; 