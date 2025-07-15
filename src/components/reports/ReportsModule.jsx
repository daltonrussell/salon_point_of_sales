import React, { useState, useEffect } from "react";
import PDFTableExport from "./PDFTableExport";
import StylistSalesTable from "./StylistSalesTable";
import InventoryTaxTable from "./InventoryTaxTable";
import ClientsServedTable from "./ClientsServedTable";
import VoidedSalesTable from "./VoidedSalesTable"; // You'll need to create this component
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
  FormControlLabel,
  Checkbox,
  Tooltip,
  Typography,
  Divider,
} from "@mui/material";
import StylistServicesTable from "./StylistServicesTable";
import LuxurySalesTable from "./LuxurySalesTable";

const { ipcRenderer } = window.require("electron");

function ReportsModule() {
  // States
  const [stylists, setStylists] = useState([]);
  const [selectedStylist, setSelectedStylist] = useState(null);
  const [selectedStylists, setSelectedStylists] = useState([]); // New state for multiple stylists
  const [services, setServices] = useState([]); // New state for services
  const [selectedServices, setSelectedServices] = useState([]); // New state for multiple services
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [reportData, setReportData] = useState(null);
  const [reportType, setReportType] = useState("stylist-sales");
  const [includeVoided, setIncludeVoided] = useState(false);

  // Report type options
  const reportTypes = [
    { value: "stylist-sales", label: "Stylist Sales Report" },
    { value: "inventory-tax", label: "Inventory Tax Report" },
    { value: "clients-served", label: "Clients Served Report" },
    { value: "voided-sales", label: "Voided Sales Report" },
    { value: "stylist-services", label: "Stylist Services Report" },
    { value: "luxury-sales", label: "Luxury Sales Report" },
  ];

  useEffect(() => {
    loadStylists();
    loadServices(); // Add this new function call
  }, []);

  const loadStylists = async () => {
    try {
      const data = await ipcRenderer.invoke("get-stylists", "active");
      setStylists(data);
    } catch (error) {
      console.error("Error loading stylists:", error);
    }
  };

  const loadServices = async () => {
    try {
      const data = await ipcRenderer.invoke("get-services", "active");
      setServices(data);
    } catch (error) {
      console.error("Error loading services:", error);
    }
  };

  const generateReport = async () => {
    try {
      let result;

      // Create dates with specific times
      const startDateTime = new Date(startDate + "T00:01:00");
      const endDateTime = new Date(endDate + "T23:59:59.999");

      switch (reportType) {
        case "stylist-sales":
          result = await ipcRenderer.invoke("get-stylist-sales", {
            stylistId: selectedStylist?.id,
            startDate: startDateTime,
            endDate: endDateTime,
            includeVoided,
          });
          break;

        case "inventory-tax":
          result = await ipcRenderer.invoke("get-inventory-tax-report", {
            startDate: startDateTime,
            endDate: endDateTime,
            includeVoided,
          });
          break;

        case "clients-served":
          result = await ipcRenderer.invoke("get-clients-served-report", {
            startDate: startDateTime,
            endDate: endDateTime,
            includeVoided,
          });
          break;

        case "voided-sales":
          result = await ipcRenderer.invoke("get-voided-sales-report", {
            startDate: startDateTime,
            endDate: endDateTime,
          });
          break;
        case "stylist-services":
          result = await ipcRenderer.invoke("get-stylist-services", {
            stylistIds:
              selectedStylists.length > 0
                ? selectedStylists.map((s) => s.id)
                : null,
            serviceIds:
              selectedServices.length > 0
                ? selectedServices.map((s) => s.id)
                : null,
            startDate: startDateTime,
            endDate: endDateTime,
            includeVoided,
          });
          break;

        case "luxury-sales":
          result = await ipcRenderer.invoke("get-luxury-sales-report", {
            stylistId: selectedStylist?.id,
            startDate: startDateTime,
            endDate: endDateTime,
            includeVoided,
          });
          break;
      }

      console.log(result);
      setReportData(result);
    } catch (error) {
      console.error("Error generating report:", error);
    }
  };

  const renderReportContent = () => {
    if (!reportData) return null;

    // Create dates with specific times for display
    const startDateTime = new Date(startDate + "T00:01:00");
    const endDateTime = new Date(endDate + "T23:59:59.999");

    switch (reportType) {
      case "stylist-sales":
        return (
          <StylistSalesTable
            data={reportData || []}
            startDate={startDateTime}
            endDate={endDateTime}
          />
        );

      case "inventory-tax":
        return (
          <InventoryTaxTable
            data={reportData || []}
            startDate={startDateTime}
            endDate={endDateTime}
          />
        );

      case "clients-served":
        return (
          <ClientsServedTable
            data={reportData || []}
            startDate={startDateTime}
            endDate={endDateTime}
          />
        );

      case "voided-sales":
        return (
          <VoidedSalesTable
            data={reportData || []}
            startDate={startDateTime}
            endDate={endDateTime}
          />
        );
      case "stylist-services":
        return (
          <StylistServicesTable
            data={reportData || []}
            startDate={startDateTime}
            endDate={endDateTime}
            selectedStylists={selectedStylists}
            selectedServices={selectedServices}
          />
        );

      case "luxury-sales":
        return (
          <LuxurySalesTable
            data={reportData || []}
            startDate={startDateTime}
            endDate={endDateTime}
          />
        );

      default:
        return null;
    }
  };

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Generate Report
        </Typography>

        {/* First Row - Report Type */}
        <Grid container spacing={3} alignItems="center" sx={{ mb: 2 }}>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Report Type</InputLabel>
              <Select
                value={reportType}
                label="Report Type"
                onChange={(e) => {
                  setReportData(null);
                  setReportType(e.target.value);
                  // Reset filters when switching reports
                  if (e.target.value === "stylist-services") {
                    setSelectedStylists([]);
                    setSelectedServices([]);
                    setSelectedStylist(null);
                  } else if (["stylist-sales", "luxury-sales", "commission-tips"].includes(e.target.value)) {
                    setSelectedStylists([]);
                    setSelectedServices([]);
                  } else {
                    setSelectedStylist(null);
                    setSelectedStylists([]);
                    setSelectedServices([]);
                  }
                  // Reset includeVoided when switching to voided-sales report
                  if (e.target.value === "voided-sales") {
                    setIncludeVoided(false);
                  }
                }}
              >
                {reportTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {/* Second Row - Filters based on report type */}
        <Grid container spacing={3} alignItems="center" sx={{ mb: 2 }}>
          {/* For stylist-sales and luxury-sales reports - Single stylist selection */}
          {["stylist-sales", "commission-tips", "luxury-sales"].includes(reportType) && (
            <Grid item xs={12} md={6}>
              <Autocomplete
                options={stylists}
                getOptionLabel={(option) =>
                  option ? `${option.firstName} ${option.lastName}` : ""
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

          {/* For stylist-services report - Multiple stylist selection */}
          {reportType === "stylist-services" && (
            <>
              <Grid item xs={12} md={6}>
                <Autocomplete
                  multiple
                  options={stylists}
                  getOptionLabel={(option) =>
                    option ? `${option.firstName} ${option.lastName}` : ""
                  }
                  value={selectedStylists}
                  onChange={(event, newValue) => setSelectedStylists(newValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Select Stylists (optional)"
                      variant="outlined"
                      placeholder="All Stylists"
                      fullWidth
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Autocomplete
                  multiple
                  options={services}
                  getOptionLabel={(option) => (option ? option.name : "")}
                  value={selectedServices}
                  onChange={(event, newValue) => setSelectedServices(newValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Select Services (optional)"
                      variant="outlined"
                      placeholder="All Services"
                      fullWidth
                    />
                  )}
                />
              </Grid>
            </>
          )}

          {/* Checkbox for including voided sales - not shown for voided-sales report */}
          {reportType !== "voided-sales" && (
            <Grid item xs={12} md={reportType === "stylist-services" ? 12 : 6}>
              <Tooltip title="Include voided sales in the report">
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={includeVoided}
                      onChange={(e) => setIncludeVoided(e.target.checked)}
                    />
                  }
                  label="Include Voided Sales"
                />
              </Tooltip>
            </Grid>
          )}
        </Grid>

        <Divider sx={{ my: 2 }} />

        {/* Date Range Selectors */}
        <Typography variant="subtitle1" gutterBottom>
          Date Range
        </Typography>

        <Grid container spacing={3} alignItems="center" sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6} md={5}>
            <TextField
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={5}>
            <TextField
              label="End Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} md={2}>
            <Button
              variant="contained"
              onClick={generateReport}
              disabled={
                !startDate ||
                !endDate ||
                (["stylist-sales", "commission-tips"].includes(reportType) &&
                  !selectedStylist)
              }
              fullWidth
              size="large"
              sx={{ height: "56px" }}
            >
              Generate Report
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {reportData && (
        <Paper sx={{ p: 3 }}>
          <div id="report-content">{renderReportContent()}</div>
          <PDFTableExport
            data={reportData}
            reportType={reportType}
            startDate={startDate + "T00:01:00"}
            endDate={endDate + "T23:59:59.999"}
            includeVoided={includeVoided}
            selectedStylists={selectedStylists}
            selectedServices={selectedServices}
          />
        </Paper>
      )}
    </Box>
  );
}

export default ReportsModule;
