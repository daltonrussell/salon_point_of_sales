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
} from '@mui/material';
const { ipcRenderer } = window.require('electron');

function ReportsModule() {
  const [stylists, setStylists] = useState([]);
  const [selectedStylist, setSelectedStylist] = useState(null);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportData, setReportData] = useState(null);

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
    if (!selectedStylist) return;

    try {
      const result = await ipcRenderer.invoke('get-stylist-sales', {
        stylistId: selectedStylist.id,
        startDate: new Date(startDate),
        endDate: new Date(endDate)
      });
      setReportData(result);
    } catch (error) {
      console.error('Error generating report:', error);
    }
  };

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Stylist Sales Report
        </Typography>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={4}>
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
          <Grid item xs={3}>
            <TextField
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              fullWidth
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Grid>
          <Grid item xs={3}>
            <TextField
              label="End Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              fullWidth
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Grid>
          <Grid item xs={2}>
            <Button 
              variant="contained" 
              onClick={generateReport}
              disabled={!selectedStylist}
              fullWidth
            >
              Generate Report
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {reportData && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Report Summary
          </Typography>
          
          <Box sx={{ mb: 4 }}>
            <Grid container spacing={3}>
              <Grid item xs={4}>
                <Paper sx={{ p: 2, bgcolor: 'primary.light', color: 'white' }}>
                  <Typography variant="subtitle2">Total Sales</Typography>
                  <Typography variant="h4">{reportData.summary.totalSales}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={4}>
                <Paper sx={{ p: 2, bgcolor: 'success.light', color: 'white' }}>
                  <Typography variant="subtitle2">Total Revenue</Typography>
                  <Typography variant="h4">${reportData.summary.totalRevenue.toFixed(2)}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={4}>
                <Paper sx={{ p: 2, bgcolor: 'info.light', color: 'white' }}>
                  <Typography variant="subtitle2">Total Tips</Typography>
                  <Typography variant="h4">${reportData.summary.totalTips.toFixed(2)}</Typography>
                </Paper>
              </Grid>
            </Grid>
          </Box>

          <Typography variant="h6" gutterBottom>
            Service Breakdown
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Service</TableCell>
                  <TableCell align="right">Count</TableCell>
                  <TableCell align="right">Revenue</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.entries(reportData.summary.serviceBreakdown).map(([service, data]) => (
                  <TableRow key={service}>
                    <TableCell>{service}</TableCell>
                    <TableCell align="right">{data.count}</TableCell>
                    <TableCell align="right">${data.revenue.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Box>
  );
}

export default ReportsModule;