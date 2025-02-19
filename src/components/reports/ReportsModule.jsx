import React, { useState, useEffect } from 'react';
import PDFTableExport from './PDFTableExport';
import StylistSalesTable from './StylistSalesTable';
import InventoryTaxTable from './InventoryTaxTable';
import ClientsServedTable from './ClientsServedTable';
import {
  Box,
  Paper,
  Grid,
  Autocomplete,
  TextField,
  Button,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
const { ipcRenderer } = window.require('electron');

function ReportsModule() {
  // States
  const [stylists, setStylists] = useState([]);
  const [selectedStylist, setSelectedStylist] = useState(null);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportData, setReportData] = useState(null);
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

      // Create dates with specific times
      const startDateTime = new Date(startDate + 'T00:01:00');
      const endDateTime = new Date(endDate + 'T23:59:59.999');

      switch (reportType) {
        case 'stylist-sales':
          result = await ipcRenderer.invoke('get-stylist-sales', {
            stylistId: selectedStylist?.id,
            startDate: startDateTime,
            endDate: endDateTime
          });
          break;

        case 'inventory-tax':
          result = await ipcRenderer.invoke('get-inventory-tax-report', {
            startDate: startDateTime,
            endDate: endDateTime
          });
          break;

        case 'clients-served':
          result = await ipcRenderer.invoke('get-clients-served-report', {
            startDate: startDateTime,
            endDate: endDateTime
          });
          break;

        case 'commission-tips':
          result = await ipcRenderer.invoke('get-commission-report', {
            stylistId: selectedStylist?.id,
            startDate: startDateTime,
            endDate: endDateTime
          });
          break;
      }

      console.log(result);
      setReportData(result);
    } catch (error) {
      console.error('Error generating report:', error);
    }
  };

  const renderReportContent = () => {
    if (!reportData) return null;

    // Create dates with specific times for display
    const startDateTime = new Date(startDate + 'T00:01:00');
    const endDateTime = new Date(endDate + 'T23:59:59.999');

    switch (reportType) {
      case 'stylist-sales':
      return <StylistSalesTable
        data={reportData || []}
        startDate={startDateTime}
        endDate={endDateTime}
      />;

      case 'inventory-tax':
        return <InventoryTaxTable
          data={reportData || []}
          startDate={startDateTime}
          endDate={endDateTime}
        />;

      case 'clients-served':
        return <ClientsServedTable
          data={reportData || []}
          startDate={startDateTime}
          endDate={endDateTime}
        />;

      default:
        return null;
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
                onChange={(e) =>
                {
                  setReportData(null)
                  setReportType(e.target.value)
                }
              }

              >
                {reportTypes.map(type => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {['stylist-sales', 'commission-tips'].includes(reportType) && (
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
                (['stylist-sales', 'commission-tips'].includes(reportType) && !selectedStylist)
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
          <div id="report-content">
            {renderReportContent()}
          </div>
          <PDFTableExport
            data={reportData}
            reportType={reportType}
            startDate={startDate + 'T00:01:00'}
            endDate={endDate + 'T23:59:59.999'}
          />
        </Paper>
      )}
    </Box>
  );
}

export default ReportsModule;