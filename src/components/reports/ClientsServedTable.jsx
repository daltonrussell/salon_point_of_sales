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
} from '@mui/material';

const ClientsServedTable = ({ data = [], startDate, endDate }) => {
  // Calculate total amount for all transactions
  const totalAmount = data.reduce((sum, transaction) => sum + transaction.total, 0);

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Clients Served Report
      </Typography>
      <Typography variant="subtitle2" gutterBottom color="text.secondary">
        {`${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`}
      </Typography>
      <Typography variant="h6" gutterBottom align="right">
        Total: ${totalAmount.toFixed(2)}
      </Typography>

      {data.map((transaction, index) => (
        <Box key={index} sx={{ mb: 4 }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            {new Date(transaction.date).toLocaleDateString()} {new Date(transaction.date).toLocaleTimeString()}
          </Typography>

          <TableContainer component={Paper} sx={{ mb: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Client</TableCell>
                  <TableCell>Employee</TableCell>
                  <TableCell>Service Description</TableCell>
                  <TableCell align="center">Qty</TableCell>
                  <TableCell align="right">Ext</TableCell>
                  <TableCell align="right">Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transaction.services.map((service, sIndex) => (
                  <TableRow key={sIndex}>
                    {sIndex === 0 && (
                      <TableCell rowSpan={transaction.services.length}>
                        {transaction.client.firstName} {transaction.client.lastName}
                      </TableCell>
                    )}
                    <TableCell>{service.stylist.firstName} {service.stylist.lastName}</TableCell>
                    <TableCell>{service.description}</TableCell>
                    <TableCell align="center">{service.quantity}</TableCell>
                    <TableCell align="right">${service.price.toFixed(2)}</TableCell>
                    {sIndex === 0 && (
                      <TableCell rowSpan={transaction.services.length} align="right">
                        ${transaction.total.toFixed(2)}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Typography variant="body2" color="text.secondary">
            Paid By -
            Cash: ${transaction.payments.cash.toFixed(2)}
            Check: ${transaction.payments.check.toFixed(2)}
            CC: ${transaction.payments.creditCard.toFixed(2)}
            Gift Card: ${transaction.payments.giftCard.toFixed(2)}
            Coupon: ${transaction.payments.coupon.toFixed(2)}
            Points: ${transaction.payments.points.toFixed(2)}
            Tips: ${transaction.payments.tips.toFixed(2)}
            Change: ${transaction.payments.change.toFixed(2)}
          </Typography>
        </Box>
      ))}

      <Typography variant="h6" gutterBottom align="right" sx={{ mt: 2 }}>
        Total Sales: ${totalAmount.toFixed(2)}
      </Typography>
    </Box>
  );
};

// Helper function to generate HTML for PDF export
ClientsServedTable.generatePdfContent = (data = [], startDate, endDate) => {
  const totalAmount = data.reduce((sum, transaction) => sum + transaction.total, 0);

  return `
    <div>
      <h2>Clients Served Report</h2>
      <p class="subtitle">${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}</p>
      <p class="total-header">Total: $${totalAmount.toFixed(2)}</p>

      ${data.map(transaction => `
        <div class="transaction-section">
          <p class="date">${new Date(transaction.date).toLocaleDateString()} ${new Date(transaction.date).toLocaleTimeString()}</p>
          
          <table>
            <thead>
              <tr>
                <th>Client</th>
                <th>Employee</th>
                <th>Service Description</th>
                <th class="center">Qty</th>
                <th class="right">Ext</th>
                <th class="right">Total</th>
              </tr>
            </thead>
            <tbody>
              ${transaction.services.map((service, index) => `
                <tr>
                  ${index === 0 ? `<td rowspan="${transaction.services.length}">${transaction.client.firstName} ${transaction.client.lastName}</td>` : ''}
                  <td>${service.stylist.firstName} ${service.stylist.lastName}</td>
                  <td>${service.description}</td>
                  <td class="center">${service.quantity}</td>
                  <td class="right">$${service.price.toFixed(2)}</td>
                  ${index === 0 ? `<td rowspan="${transaction.services.length}" class="right">$${transaction.total.toFixed(2)}</td>` : ''}
                </tr>
              `).join('')}
            </tbody>
          </table>

          <p class="payment-info">
            Paid By - 
            Cash: $${transaction.payments.cash.toFixed(2)} 
            Check: $${transaction.payments.check.toFixed(2)} 
            CC: $${transaction.payments.creditCard.toFixed(2)} 
            Gift Card: $${transaction.payments.giftCard.toFixed(2)} 
            Coupon: $${transaction.payments.coupon.toFixed(2)} 
            Points: $${transaction.payments.points.toFixed(2)} 
            Tips: $${transaction.payments.tips.toFixed(2)} 
            Change: $${transaction.payments.change.toFixed(2)}
          </p>
        </div>
      `).join('')}

      <p class="total-footer">Total Sales: $${totalAmount.toFixed(2)}</p>
    </div>
  `;
};

export default ClientsServedTable;