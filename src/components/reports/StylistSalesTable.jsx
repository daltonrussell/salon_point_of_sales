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
} from '@mui/material';

const StylistSalesTable = ({ data = [], startDate, endDate }) => {
  // Return early if no data
  if (!data || data.length === 0) {
    return (
      <Box>
        <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
          Stylist Sales Report
        </Typography>
        <Typography variant="subtitle2" gutterBottom color="text.secondary">
          {`${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`}
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Client</TableCell>
                <TableCell>Items</TableCell>
                <TableCell align="right">Subtotal</TableCell>
                <TableCell align="right">Tax</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell>Payment Method</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell colSpan={7} align="center">No data available</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  }

  const totalSubtotal = data.reduce((sum, sale) => sum + sale.subtotal, 0);
  const totalTax = data.reduce((sum, sale) => sum + sale.tax, 0);
  const totalAmount = data.reduce((sum, sale) => sum + sale.total, 0);

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
        Stylist Sales Report
      </Typography>
      <Typography variant="subtitle2" gutterBottom color="text.secondary">
        {`${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`}
      </Typography>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Client</TableCell>
              <TableCell>Items</TableCell>
              <TableCell align="right">Subtotal</TableCell>
              <TableCell align="right">Tax</TableCell>
              <TableCell align="right">Total</TableCell>
              <TableCell>Payment Method</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((sale) => (
              <TableRow key={sale.id || Math.random()}>
                <TableCell>{new Date(sale.saleDate).toLocaleDateString()}</TableCell>
                <TableCell>{sale.client}</TableCell>
                <TableCell>
                  {(sale.items || []).map((item, index) => (
                    <div key={index}>
                      {item.name} ({item.type})
                      - ${item.price.toFixed(2)}
                      {item.quantity > 1 && ` x${item.quantity}`}
                    </div>
                  ))}
                </TableCell>
                <TableCell align="right">${sale.subtotal.toFixed(2)}</TableCell>
                <TableCell align="right">${sale.tax.toFixed(2)}</TableCell>
                <TableCell align="right">${sale.total.toFixed(2)}</TableCell>
                <TableCell>{sale.paymentMethod}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableHead>
            <TableRow>
              <TableCell colSpan={3}>Totals</TableCell>
              <TableCell align="right">${totalSubtotal.toFixed(2)}</TableCell>
              <TableCell align="right">${totalTax.toFixed(2)}</TableCell>
              <TableCell align="right">${totalAmount.toFixed(2)}</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
        </Table>
      </TableContainer>
    </Box>
  );
};

// Helper function to generate HTML for PDF export
StylistSalesTable.generatePdfContent = (data = [], startDate, endDate) => {
  if (!data || data.length === 0) {
    return `
      <div>
        <h2>Stylist Sales Report</h2>
        <p class="subtitle">${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}</p>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Client</th>
              <th>Items</th>
              <th class="text-right">Subtotal</th>
              <th class="text-right">Tax</th>
              <th class="text-right">Total</th>
              <th>Payment Method</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colspan="7" style="text-align: center">No data available</td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  }

  const totalSubtotal = data.reduce((sum, sale) => sum + sale.subtotal, 0);
  const totalTax = data.reduce((sum, sale) => sum + sale.tax, 0);
  const totalAmount = data.reduce((sum, sale) => sum + sale.total, 0);

  return `
    <div>
      <h2>Stylist Sales Report</h2>
      <p class="subtitle">${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}</p>
      
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Client</th>
            <th>Items</th>
            <th class="text-right">Subtotal</th>
            <th class="text-right">Tax</th>
            <th class="text-right">Total</th>
            <th>Payment Method</th>
          </tr>
        </thead>
        <tbody>
          ${data.map(sale => `
            <tr>
              <td>${new Date(sale.saleDate).toLocaleDateString()}</td>
              <td>${sale.client}</td>
              <td>${(sale.items || []).map(item => 
                `${item.name} (${item.type}) - $${item.price.toFixed(2)}${item.quantity > 1 ? ` x${item.quantity}` : ''}`
              ).join('<br>')}</td>
              <td class="text-right">$${sale.subtotal.toFixed(2)}</td>
              <td class="text-right">$${sale.tax.toFixed(2)}</td>
              <td class="text-right">$${sale.total.toFixed(2)}</td>
              <td>${sale.paymentMethod}</td>
            </tr>
          `).join('')}
        </tbody>
        <tfoot>
          <tr>
            <th colspan="3">Totals</th>
            <th class="text-right">$${totalSubtotal.toFixed(2)}</th>
            <th class="text-right">$${totalTax.toFixed(2)}</th>
            <th class="text-right">$${totalAmount.toFixed(2)}</th>
            <th></th>
          </tr>
        </tfoot>
      </table>
    </div>
  `;
};

export default StylistSalesTable;