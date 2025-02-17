import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Autocomplete,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
const { ipcRenderer } = window.require('electron');

function ReportsModule() {
  // Existing states
  const [stylists, setStylists] = useState([]);
  const [selectedStylist, setSelectedStylist] = useState(null);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportData, setReportData] = useState(null);

  // New state for report type
  const [reportType, setReportType] = useState('stylist-sales');

  // Report type options
  const reportTypes = [
    { value: 'stylist-sales', label: 'Stylist Sales Report' },
    { value: 'inventory-tax', label: 'Inventory Tax Report' },
    { value: 'clients-served', label: 'Clients Served Report' },
    { value: 'commission-tips', label: 'Commission & Tips Report' }
  ];

  useEffect(() => {
    loadStylists();
  }, []);

  const loadStylists = async () => {
    try {
      const data = await ipcRenderer.invoke('get-stylists', 'active');
      setStylists(data);
    } catch (error) {
      console.error('Error loading stylists:', error);
    }
  };

  const generateReport = async () => {
    try {
      let result;

      // Different API calls based on report type
      switch (reportType) {
        case 'stylist-sales':
          result = await ipcRenderer.invoke('get-stylist-sales', {
            stylistId: selectedStylist?.id,
            startDate: new Date(startDate),
            endDate: new Date(endDate)
          });
          break;

        case 'inventory-tax':
          result = await ipcRenderer.invoke('get-inventory-tax-report', {
            startDate: new Date(startDate),
            endDate: new Date(endDate)
          });
          break;

        case 'clients-served':
          result = await ipcRenderer.invoke('get-clients-served-report', {
            stylistId: selectedStylist?.id,
            startDate: new Date(startDate),
            endDate: new Date(endDate)
          });
          break;

        case 'commission-tips':
          result = await ipcRenderer.invoke('get-commission-report', {
            stylistId: selectedStylist?.id,
            startDate: new Date(startDate),
            endDate: new Date(endDate)
          });
          break;
      }

      console.log(result);
      setReportData(result);
    } catch (error) {
      console.error('Error generating report:', error);
    }
  };

  // Render different report content based on type
  const renderReportContent = () => {
    if (!reportData) return null;

    switch (reportType) {
      case 'stylist-sales':
      return (
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
              {reportData.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell>{new Date(sale.saleDate).toLocaleDateString()}</TableCell>
                  <TableCell>{sale.client}</TableCell>
                  <TableCell>
                    {sale.items.map((item, index) => (
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
                <TableCell align="right">
                  ${reportData.reduce((sum, sale) => sum + sale.subtotal, 0).toFixed(2)}
                </TableCell>
                <TableCell align="right">
                  ${reportData.reduce((sum, sale) => sum + sale.tax, 0).toFixed(2)}
                </TableCell>
                <TableCell align="right">
                  ${reportData.reduce((sum, sale) => sum + sale.total, 0).toFixed(2)}
                </TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
          </Table>
        </TableContainer>
      );
      case 'inventory-tax':
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
                {reportData.map((item) => (
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
                  <TableCell align="right">
                    {reportData.reduce((sum, item) => sum + item.totalSold, 0)}
                  </TableCell>
                  <TableCell align="right">
                    ${reportData.reduce((sum, item) => sum + item.totalCharged, 0).toFixed(2)}
                  </TableCell>
                  <TableCell align="right">
                    ${reportData.reduce((sum, item) => sum + item.taxCollected, 0).toFixed(2)}
                  </TableCell>
                </TableRow>
              </TableHead>
            </Table>
          </TableContainer>
        </Box>
      );
      // Add other report type renderers here
      // ...
    }
  };

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={3}>
            <FormControl fullWidth>
              <InputLabel>Report Type</InputLabel>
              <Select
                value={reportType}
                label="Report Type"
                onChange={(e) => setReportType(e.target.value)}
              >
                {reportTypes.map(type => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Show stylist selector only for relevant reports */}
          {['stylist-sales', 'clients-served', 'commission-tips'].includes(reportType) && (
            <Grid item xs={3}>
              <Autocomplete
                options={stylists}
                getOptionLabel={(option) =>
                  option ? `${option.firstName} ${option.lastName}` : ''
                }
                value={selectedStylist}
                onChange={(event, newValue) => setSelectedStylist(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Stylist"
                    variant="outlined"
                    fullWidth
                  />
                )}
              />
            </Grid>
          )}

          <Grid item xs={2}>
            <TextField
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={2}>
            <TextField
              label="End Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={2}>
            <Button
              variant="contained"
              onClick={generateReport}
              disabled={
                !startDate || !endDate ||
                (['stylist-sales', 'clients-served', 'commission-tips'].includes(reportType) && !selectedStylist)
              }
              fullWidth
            >
              Generate Report
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {reportData && (
        <Paper sx={{ p: 3 }}>
          {renderReportContent()}
        </Paper>
      )}
    </Box>
  );
}

export default ReportsModule;