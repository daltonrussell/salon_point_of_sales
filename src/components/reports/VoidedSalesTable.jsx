import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Paper,
  Box
} from '@mui/material';

const VoidedSalesTable = ({ data, startDate, endDate }) => {
  // Format currency values
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Format date values
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Calculate total voided amount
  const totalVoided = data.reduce((sum, item) => sum + item.total, 0);

  return (
    <>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Voided Sales Report
        </Typography>
        <Typography variant="subtitle1" gutterBottom>
          {formatDate(startDate)} to {formatDate(endDate)}
        </Typography>
        <Typography variant="h6" color="error" gutterBottom>
          Total Voided Amount: {formatCurrency(totalVoided)}
        </Typography>
      </Box>

      <TableContainer component={Paper} sx={{ mb: 3 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Sale Date</TableCell>
              <TableCell>Voided Date</TableCell>
              <TableCell>Client</TableCell>
              <TableCell>Stylist</TableCell>
              <TableCell>Services</TableCell>
              <TableCell>Products</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell>Reason</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  No voided sales in this period
                </TableCell>
              </TableRow>
            ) : (
              data.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell>{formatDate(sale.saleDate)}</TableCell>
                  <TableCell>{formatDate(sale.voidedAt)}</TableCell>
                  <TableCell>{sale.client}</TableCell>
                  <TableCell>{sale.stylist}</TableCell>
                  <TableCell>{sale.serviceCount}</TableCell>
                  <TableCell>{sale.productCount}</TableCell>
                  <TableCell align="right">{formatCurrency(sale.total)}</TableCell>
                  <TableCell>{sale.voidReason}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
};

export default VoidedSalesTable;