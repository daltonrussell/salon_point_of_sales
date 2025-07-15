import React from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
} from '@mui/material';

const LuxurySalesTable = ({ data = [], startDate, endDate }) => {
  // Calculate grand totals across all stylists
  const grandTotalSubtotal = data.reduce((sum, stylist) => sum + stylist.totalSubtotal, 0);
  const grandTotalTax = data.reduce((sum, stylist) => sum + stylist.totalTax, 0);
  const grandTotalAmount = data.reduce((sum, stylist) => sum + stylist.totalAmount, 0);
  const grandTotalItems = data.reduce((sum, stylist) => sum + stylist.itemCount, 0);

  // Return early if no data
  if (!data || data.length === 0) {
    return (
      <Box>
        <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
          Luxury Sales Report
        </Typography>
        <Typography variant="subtitle2" gutterBottom color="text.secondary">
          {`${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          No luxury sales found for the selected period.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
        Luxury Sales Report
      </Typography>
      <Typography variant="subtitle2" gutterBottom color="text.secondary">
        {`${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`}
      </Typography>

      {/* Summary Section */}
      <Paper sx={{ p: 2, mb: 3, backgroundColor: '#f5f5f5' }}>
        <Typography variant="h6" gutterBottom>
          Report Summary
        </Typography>
        <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          <Box>
            <Typography variant="body2" color="text.secondary">Total Items</Typography>
            <Typography variant="h6">{grandTotalItems}</Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">Total Subtotal</Typography>
            <Typography variant="h6">${grandTotalSubtotal.toFixed(2)}</Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">Total Tax</Typography>
            <Typography variant="h6">${grandTotalTax.toFixed(2)}</Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">Total Amount</Typography>
            <Typography variant="h6" color="primary">${grandTotalAmount.toFixed(2)}</Typography>
          </Box>
        </Box>
      </Paper>

      {/* Detailed breakdown by stylist */}
      {data.map((stylistData, index) => (
        <Box key={stylistData.stylistId} sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
            {stylistData.stylistName}
          </Typography>
          
          {/* Stylist summary */}
          <Box sx={{ display: 'flex', gap: 3, mb: 2, fontSize: '0.9rem' }}>
            <Typography variant="body2">
              Items: <strong>{stylistData.itemCount}</strong>
            </Typography>
            <Typography variant="body2">
              Subtotal: <strong>${stylistData.totalSubtotal.toFixed(2)}</strong>
            </Typography>
            <Typography variant="body2">
              Tax: <strong>${stylistData.totalTax.toFixed(2)}</strong>
            </Typography>
            <Typography variant="body2" color="primary">
              Total: <strong>${stylistData.totalAmount.toFixed(2)}</strong>
            </Typography>
          </Box>

          <TableContainer component={Paper} sx={{ mb: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Client</TableCell>
                  <TableCell>Service</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell align="center">Qty</TableCell>
                  <TableCell align="right">Price</TableCell>
                  <TableCell align="right">Subtotal</TableCell>
                  <TableCell align="right">Tax</TableCell>
                  <TableCell align="right">Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {stylistData.luxuryItems.map((item, itemIndex) => (
                  <TableRow key={itemIndex}>
                    <TableCell>{new Date(item.saleDate).toLocaleDateString()}</TableCell>
                    <TableCell>{item.clientName}</TableCell>
                    <TableCell>{item.serviceName}</TableCell>
                    <TableCell>{item.serviceDescription}</TableCell>
                    <TableCell align="center">{item.quantity}</TableCell>
                    <TableCell align="right">${item.price.toFixed(2)}</TableCell>
                    <TableCell align="right">${item.subtotal.toFixed(2)}</TableCell>
                    <TableCell align="right">${item.tax.toFixed(2)}</TableCell>
                    <TableCell align="right">${item.total.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableHead>
                <TableRow>
                  <TableCell colSpan={6}><strong>Stylist Totals</strong></TableCell>
                  <TableCell align="right"><strong>${stylistData.totalSubtotal.toFixed(2)}</strong></TableCell>
                  <TableCell align="right"><strong>${stylistData.totalTax.toFixed(2)}</strong></TableCell>
                  <TableCell align="right"><strong>${stylistData.totalAmount.toFixed(2)}</strong></TableCell>
                </TableRow>
              </TableHead>
            </Table>
          </TableContainer>

          {index < data.length - 1 && <Divider sx={{ my: 3 }} />}
        </Box>
      ))}

      {/* Grand totals */}
      {data.length > 1 && (
        <Paper sx={{ p: 2, backgroundColor: '#e3f2fd' }}>
          <Typography variant="h6" gutterBottom>
            Grand Totals
          </Typography>
          <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            <Box>
              <Typography variant="body2" color="text.secondary">Total Items</Typography>
              <Typography variant="h6">{grandTotalItems}</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">Total Subtotal</Typography>
              <Typography variant="h6">${grandTotalSubtotal.toFixed(2)}</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">Total Tax</Typography>
              <Typography variant="h6">${grandTotalTax.toFixed(2)}</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">Total Amount</Typography>
              <Typography variant="h6" color="primary">${grandTotalAmount.toFixed(2)}</Typography>
            </Box>
          </Box>
        </Paper>
      )}
    </Box>
  );
};

// Helper function to generate HTML for PDF export
LuxurySalesTable.generatePdfContent = (data, startDate, endDate) => {
  const grandTotalSubtotal = data.reduce((sum, stylist) => sum + stylist.totalSubtotal, 0);
  const grandTotalTax = data.reduce((sum, stylist) => sum + stylist.totalTax, 0);
  const grandTotalAmount = data.reduce((sum, stylist) => sum + stylist.totalAmount, 0);
  const grandTotalItems = data.reduce((sum, stylist) => sum + stylist.itemCount, 0);

  return `
    <div>
      <h2>Luxury Sales Report</h2>
      <p><strong>Period:</strong> ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}</p>
      
      <div style="background-color: #f5f5f5; padding: 15px; margin-bottom: 20px; border-radius: 5px;">
        <h3>Report Summary</h3>
        <div style="display: flex; gap: 30px;">
          <div><strong>Total Items:</strong> ${grandTotalItems}</div>
          <div><strong>Total Subtotal:</strong> $${grandTotalSubtotal.toFixed(2)}</div>
          <div><strong>Total Tax:</strong> $${grandTotalTax.toFixed(2)}</div>
          <div><strong>Total Amount:</strong> $${grandTotalAmount.toFixed(2)}</div>
        </div>
      </div>

      ${data.map(stylistData => `
        <div style="margin-bottom: 30px;">
          <h3 style="color: #1976d2; margin-bottom: 10px;">${stylistData.stylistName}</h3>
          <div style="margin-bottom: 15px; font-size: 0.9em;">
            <strong>Items:</strong> ${stylistData.itemCount} | 
            <strong>Subtotal:</strong> $${stylistData.totalSubtotal.toFixed(2)} | 
            <strong>Tax:</strong> $${stylistData.totalTax.toFixed(2)} | 
            <strong>Total:</strong> $${stylistData.totalAmount.toFixed(2)}
          </div>
          
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
            <thead>
              <tr style="background-color: #f5f5f5;">
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Date</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Client</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Service</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Description</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Qty</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Price</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Subtotal</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Tax</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${stylistData.luxuryItems.map(item => `
                <tr>
                  <td style="border: 1px solid #ddd; padding: 8px;">${new Date(item.saleDate).toLocaleDateString()}</td>
                  <td style="border: 1px solid #ddd; padding: 8px;">${item.clientName}</td>
                  <td style="border: 1px solid #ddd; padding: 8px;">${item.serviceName}</td>
                  <td style="border: 1px solid #ddd; padding: 8px;">${item.serviceDescription}</td>
                  <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item.quantity}</td>
                  <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">$${item.price.toFixed(2)}</td>
                  <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">$${item.subtotal.toFixed(2)}</td>
                  <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">$${item.tax.toFixed(2)}</td>
                  <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">$${item.total.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr style="background-color: #e3f2fd; font-weight: bold;">
                <td colspan="6" style="border: 1px solid #ddd; padding: 8px;">Stylist Totals</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">$${stylistData.totalSubtotal.toFixed(2)}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">$${stylistData.totalTax.toFixed(2)}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">$${stylistData.totalAmount.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      `).join('')}

      ${data.length > 1 ? `
        <div style="background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin-top: 20px;">
          <h3>Grand Totals</h3>
          <div style="display: flex; gap: 30px;">
            <div><strong>Total Items:</strong> ${grandTotalItems}</div>
            <div><strong>Total Subtotal:</strong> $${grandTotalSubtotal.toFixed(2)}</div>
            <div><strong>Total Tax:</strong> $${grandTotalTax.toFixed(2)}</div>
            <div><strong>Total Amount:</strong> $${grandTotalAmount.toFixed(2)}</div>
          </div>
        </div>
      ` : ''}
    </div>
  `;
};

export default LuxurySalesTable;
