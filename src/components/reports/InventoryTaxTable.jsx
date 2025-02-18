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

const InventoryTaxTable = ({ data, startDate, endDate }) => {
  const totalSold = data.reduce((sum, item) => sum + item.totalSold, 0);
  const totalCharged = data.reduce((sum, item) => sum + item.totalCharged, 0);
  const totalTaxCollected = data.reduce((sum, item) => sum + item.taxCollected, 0);

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
        Inventory Sold Tax Report
      </Typography>
      <Typography variant="subtitle2" gutterBottom color="text.secondary">
        {`${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`}
      </Typography>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Item</TableCell>
              <TableCell>Description</TableCell>
              <TableCell align="right">Total Sold</TableCell>
              <TableCell align="right">Total Charged</TableCell>
              <TableCell align="right">Total Tax Collected</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.id}</TableCell>
                <TableCell>{item.description}</TableCell>
                <TableCell align="right">{item.totalSold}</TableCell>
                <TableCell align="right">${item.totalCharged.toFixed(2)}</TableCell>
                <TableCell align="right">${item.taxCollected.toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableHead>
            <TableRow>
              <TableCell colSpan={2}>Totals</TableCell>
              <TableCell align="right">{totalSold}</TableCell>
              <TableCell align="right">${totalCharged.toFixed(2)}</TableCell>
              <TableCell align="right">${totalTaxCollected.toFixed(2)}</TableCell>
            </TableRow>
          </TableHead>
        </Table>
      </TableContainer>
    </Box>
  );
};

// Helper function to generate HTML for PDF export
InventoryTaxTable.generatePdfContent = (data, startDate, endDate) => {
  const totalSold = data.reduce((sum, item) => sum + item.totalSold, 0);
  const totalCharged = data.reduce((sum, item) => sum + item.totalCharged, 0);
  const totalTaxCollected = data.reduce((sum, item) => sum + item.taxCollected, 0);

  return `
    <div>
      <h2>Inventory Sold Tax Report</h2>
      <p class="subtitle">${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}</p>
      
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th>Description</th>
            <th class="text-right">Total Sold</th>
            <th class="text-right">Total Charged</th>
            <th class="text-right">Total Tax Collected</th>
          </tr>
        </thead>
        <tbody>
          ${data.map(item => `
            <tr>
              <td>${item.id}</td>
              <td>${item.description}</td>
              <td class="text-right">${item.totalSold}</td>
              <td class="text-right">$${item.totalCharged.toFixed(2)}</td>
              <td class="text-right">$${item.taxCollected.toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
        <tfoot>
          <tr>
            <th colspan="2">Totals</th>
            <th class="text-right">${totalSold}</th>
            <th class="text-right">$${totalCharged.toFixed(2)}</th>
            <th class="text-right">$${totalTaxCollected.toFixed(2)}</th>
          </tr>
        </tfoot>
      </table>
    </div>
  `;
};

export default InventoryTaxTable;