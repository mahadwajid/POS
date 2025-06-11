import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    fontFamily: 'Helvetica',
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  companyInfoBlock: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8, // Approx 1 MUI unit, from BillTemplate's gap={1}
  },
  logo: {
    width: 120,
    height: 120,
    objectFit: 'contain',
  },
  companyTextBlock: {
    flexDirection: 'column',
    gap: 0, // Tight vertical spacing
  },
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  tmText: {
    fontSize: 10,
    color: '#666',
  },
  invoiceTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#424242',
  },
  divider: {
    borderBottom: '1px solid #ccc',
    marginTop: -6,
    marginBottom: 20,
  },
  // Customer and Invoice Details Section
  detailsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  invoiceToBlock: {
    flexDirection: 'column',
  },
  invoiceToTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#424242',
    marginBottom: 8,
  },
  customerName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  customerDetail: {
    fontSize: 10,
    color: '#666',
  },
  invoiceMeta: {
    textAlign: 'right',
  },
  invoiceMetaText: {
    fontSize: 10,
    marginBottom: 4,
  },
  totalDueAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f44336',
    marginTop: 12,
  },
  // Items Table
  table: {
    display: 'table',
    width: 'auto',
    marginVertical: 10,
    borderStyle: 'solid',
    borderColor: '#424242',
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableColHeader: {
    width: '25%',
    backgroundColor: '#424242',
    color: '#fff',
    fontWeight: 'bold',
    padding: 8,
    borderStyle: 'solid',
    borderColor: '#424242',
    borderBottomWidth: 1,
    borderRightWidth: 1,
  },
  tableCol: {
    width: '25%',
    padding: 8,
    borderStyle: 'solid',
    borderColor: '#eee',
    borderBottomWidth: 1,
    borderRightWidth: 1,
  },
  tableRowOdd: {
    backgroundColor: '#f5f5f5',
  },
  // Summary and Payment Method
  summarySection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  paymentMethodBlock: {
    flex: 1,
  },
  paymentMethodTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  paymentMethodText: {
    fontSize: 10,
    color: '#666',
    marginBottom: 4,
  },
  summaryTable: {
    width: 'auto',
    marginLeft: 'auto',
  },
  summaryTableRow: {
    flexDirection: 'row',
  },
  summaryTableCell: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    textAlign: 'right',
  },
  summaryTotalCell: {
    backgroundColor: '#424242',
    color: '#fff',
    fontWeight: 'bold',
  },
  // Notes Section
  notesSection: {
    marginBottom: 20,
  },
  notesTitle: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  notesText: {
    fontSize: 10,
    color: '#666',
  },
  // Administrator Section (Terms and Conditions removed)
  adminSection: {
    flexDirection: 'row',
    justifyContent: 'flex-end', 
    alignItems: 'flex-end',
    marginTop: 30,
  },
  adminBlock: {
    textAlign: 'right',
  },
  adminName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  adminPhone: {
    fontSize: 10,
    color: '#666',
  },
});

const InvoicePDF = ({ bill, companyInfo }) => {
  const formattedAddress = typeof bill.customer?.address === 'object' 
    ? Object.values(bill.customer.address).filter(Boolean).join(', ') 
    : bill.customer?.address || 'N/A';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.companyInfoBlock}>
            <Image src="/Logo1.png" style={styles.logo} />
            <View style={styles.companyTextBlock}>
              <Text style={styles.companyName}>{companyInfo.name || 'KPK Cables'}</Text>
              <Text style={styles.tmText}>TM # 562363</Text>
            </View>
          </View>
          <Text style={styles.invoiceTitle}>INVOICE</Text>
        </View>

        <View style={styles.divider} />

        {/* Invoice Details and Total Due */}
        <View style={styles.detailsSection}>
          <View style={styles.invoiceToBlock}>
            <Text style={styles.invoiceToTitle}>Invoice to :</Text>
            <Text style={styles.customerName}>{bill.customer?.name || 'N/A'}</Text>
            {/* Email removed as per BillTemplate.js changes */}
            <Text style={styles.customerDetail}>{formattedAddress}</Text>
            <Text style={styles.customerDetail}>Phone: {bill.customer?.phone || 'N/A'}</Text>
          </View>
          <View style={styles.invoiceMeta}>
            <Text style={styles.invoiceMetaText}>Invoice Date: {bill.date ? new Date(bill.date).toLocaleDateString() : 'N/A'}</Text>
            <Text style={styles.invoiceMetaText}>Invoice No: {bill.billNumber || 'N/A'}</Text>
            <Text style={styles.totalDueAmount}>Total Due : Rs. {bill.dueAmount?.toFixed(2) || '0.00'}</Text>
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableRow} fixed>
            <Text style={styles.tableColHeader}>Description</Text>
            <Text style={styles.tableColHeader}>Qty</Text>
            <Text style={styles.tableColHeader}>Price</Text>
            <Text style={styles.tableColHeader}>Total</Text>
          </View>
          {bill.items.length > 0 ? bill.items.map((item, idx) => (
            <View style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowOdd : {}]} key={idx}>
              <Text style={styles.tableCol}>{item.name || 'N/A'}</Text>
              <Text style={styles.tableCol}>{item.quantity || 0}</Text>
              <Text style={styles.tableCol}>Rs. {item.price?.toFixed(2) || '0.00'}</Text>
              <Text style={styles.tableCol}>Rs. {item.total?.toFixed(2) || '0.00'}</Text>
            </View>
          )) : (
            <View style={styles.tableRow} key="no-items">
              <Text style={[styles.tableCol, { width: '100%', textAlign: 'center' }]}>No items</Text>
            </View>
          )}
        </View>

        {/* Summary and Payment Method */}
        <View style={styles.summarySection}>
          <View style={styles.paymentMethodBlock}>
            <Text style={styles.paymentMethodTitle}>Payment Method</Text>
            <Text style={styles.paymentMethodText}>Method: {bill.paymentMethod || 'N/A'}</Text>
            {/* Bank details removed as per BillTemplate.js changes */}
          </View>
          <View style={styles.summaryTable}>
            <View style={styles.summaryTableRow}>
              <Text style={styles.summaryTableCell}>Sub-total :</Text>
              <Text style={styles.summaryTableCell}>Rs. {bill.subtotal?.toFixed(2) || '0.00'}</Text>
            </View>
            <View style={styles.summaryTableRow}>
              <Text style={styles.summaryTableCell}>Tax ({bill.tax}%):</Text>
              <Text style={styles.summaryTableCell}>Rs. {bill.tax?.toFixed(2) || '0.00'}</Text>
            </View>
            <View style={[styles.summaryTableRow, styles.summaryTotalCell]}>
              <Text style={[styles.summaryTableCell, styles.summaryTotalCell]}>Total :</Text>
              <Text style={[styles.summaryTableCell, styles.summaryTotalCell]}>Rs. {bill.total?.toFixed(2) || '0.00'}</Text>
            </View>
          </View>
        </View>

        {bill.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.notesTitle}>Notes:</Text>
            <Text style={styles.notesText}>{bill.notes}</Text>
          </View>
        )}

        {/* Administrator Section */}
        <View style={styles.adminSection}>
          <View style={styles.adminBlock}>
            <Text style={styles.adminName}>Hajji Waheed Ahmad</Text>
            <Text style={styles.adminPhone}>Phone No: 0313-9405885</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default InvoicePDF; 