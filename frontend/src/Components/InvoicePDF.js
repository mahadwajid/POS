import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';

const formatCurrency = (amount) => {
  if (typeof amount !== 'number') return 'N/A';
  return `Rs. ${amount.toFixed(2)}`;
};

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    backgroundColor: '#fff',
  },
  // ✅ Watermark style
  watermark: {
    position: 'absolute',
    top: '33%',
    left: '20%',
    width: 300,
    height: 300,
    opacity: 0.09,
    zIndex: -1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  logoBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
    marginTop: -50,
    marginLeft: -40,
  },
  logo: {
    width: 150,
    height: 150,
    objectFit: 'contain',
  },
  companyTextBlock: {
    flexDirection: 'column',
    gap: 0,
  },
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: -30,
  },
  tmText: {
    fontSize: 10,
    color: '#666',
  },
  invoiceTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#424242',
    marginTop: -50,
  },
  divider: {
    borderBottom: '1px solid #ccc',
    marginTop: -45,
    marginBottom: 32,
  },
  detailsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 32,
  },
  invoiceToBlock: {},
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
    alignItems: 'flex-end',
  },
  invoiceMetaText: {
    fontSize: 10,
    marginBottom: 4,
  },
  totalDueAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f44336',
    marginTop: 12,
  },
  table: {
    display: 'table',
    width: 'auto',
    marginBottom: 32,
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
    textAlign: 'right',
  },
  tableColHeaderLeft: {
    width: '25%',
    backgroundColor: '#424242',
    color: '#fff',
    fontWeight: 'bold',
    padding: 8,
    borderStyle: 'solid',
    borderColor: '#424242',
    borderBottomWidth: 1,
    borderRightWidth: 1,
    textAlign: 'left',
  },
  tableCol: {
    width: '25%',
    padding: 8,
    borderStyle: 'solid',
    borderColor: '#eee',
    borderBottomWidth: 1,
    borderRightWidth: 1,
    textAlign: 'right',
  },
  tableColLeft: {
    width: '25%',
    padding: 8,
    borderStyle: 'solid',
    borderColor: '#eee',
    borderBottomWidth: 1,
    borderRightWidth: 1,
    textAlign: 'left',
  },
  tableRowOdd: {
    backgroundColor: '#f5f5f5',
  },
  summarySection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
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
    flex: 1,
    textAlign: 'right',
    alignItems: 'flex-end',
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
  notesSection: {
    marginBottom: 20,
  },
  notesTitle: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  notesText: {
    fontSize: 10,
    color: '#666',
  },
  adminSection: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    marginTop: 32,
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
  const formattedAddress = bill.customer?.address
    ? (typeof bill.customer.address === 'object'
        ? Object.values(bill.customer.address).filter(Boolean).join(', ')
        : bill.customer.address)
    : 'N/A';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* ✅ Watermark logo */}
        <Image src="/Logo1.png" style={styles.watermark} />

        {/* Header Section */}
        <View style={styles.headerRow}>
          <View style={styles.logoBlock}>
            <Image src="/Logo1.png" style={styles.logo} />
            <View style={styles.companyTextBlock}>
              <Text style={styles.companyName}>{companyInfo.name || 'KPK Cables'}</Text>
              <Text style={styles.tmText}>TM # 562363</Text>
            </View>
          </View>
          <Text style={styles.invoiceTitle}>INVOICE</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailsSection}>
          <View style={styles.invoiceToBlock}>
            <Text style={styles.invoiceToTitle}>Invoice to :</Text>
            <Text style={styles.customerName}>{bill.customer?.name || 'N/A'}</Text>
            <Text style={styles.customerDetail}>{formattedAddress}</Text>
            <Text style={styles.customerDetail}>{bill.customer?.phone || 'N/A'}</Text>
          </View>
          <View style={styles.invoiceMeta}>
            <Text style={styles.invoiceMetaText}><Text style={{ fontWeight: 'bold' }}>Invoice Date:</Text> {bill.date ? new Date(bill.date).toLocaleDateString() : 'N/A'}</Text>
            <Text style={styles.invoiceMetaText}><Text style={{ fontWeight: 'bold' }}>Invoice No:</Text> {bill.billNumber || 'N/A'}</Text>
            <Text style={styles.totalDueAmount}>Total Due : {formatCurrency(bill.dueAmount)}</Text>
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableRow} fixed>
            <Text style={styles.tableColHeaderLeft}>Product Name</Text>
            <Text style={styles.tableColHeader}>Qty</Text>
            <Text style={styles.tableColHeader}>Price</Text>
            <Text style={styles.tableColHeader}>Total</Text>
          </View>
          {bill.items.length > 0 ? bill.items.map((item, idx) => (
            <View style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowOdd : {}]} key={idx}>
              <Text style={styles.tableColLeft}>{item.name || 'N/A'}</Text>
              <Text style={styles.tableCol}>{item.quantity || 0}</Text>
              <Text style={styles.tableCol}>{formatCurrency(item.price)}</Text>
              <Text style={styles.tableCol}>{formatCurrency(item.total)}</Text>
            </View>
          )) : (
            <View style={styles.tableRow} key="no-items">
              <Text style={[styles.tableColLeft, { width: '100%', textAlign: 'center' }]}>No items</Text>
            </View>
          )}
        </View>

        {/* Summary and Payment Method */}
        <View style={styles.summarySection}>
          <View style={styles.paymentMethodBlock}>
            <Text style={styles.paymentMethodTitle}>Payment Method</Text>
            <Text style={styles.paymentMethodText}>Method: {bill.paymentMethod || 'N/A'}</Text>
          </View>
          <View style={styles.summaryTable}>
            <View style={styles.summaryTableRow}>
              <Text style={styles.summaryTableCell}>Sub-total :</Text>
              <Text style={styles.summaryTableCell}>{formatCurrency(bill.subtotal)}</Text>
            </View>
            <View style={styles.summaryTableRow}>
              <Text style={styles.summaryTableCell}>Tax ({bill.tax}%):</Text>
              <Text style={styles.summaryTableCell}>{formatCurrency(bill.tax)}</Text>
            </View>
            <View style={[styles.summaryTableRow, styles.summaryTotalCell]}>
              <Text style={[styles.summaryTableCell, styles.summaryTotalCell]}>Total :</Text>
              <Text style={[styles.summaryTableCell, styles.summaryTotalCell]}>{formatCurrency(bill.total)}</Text>
            </View>
          </View>
        </View>

        {bill.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.notesTitle}>Notes:</Text>
            <Text style={styles.notesText}>{bill.notes}</Text>
          </View>
        )}

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
