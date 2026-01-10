// TaxManagement.jsx
import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
  InputAdornment,
  Alert,
  Snackbar
} from '@mui/material';

function TaxManagement() {
  // Initialize tax rate from localStorage, with a default of 8.00%
  // We use a callback in useState to ensure we only read from localStorage once
  const [taxRate, setTaxRate] = useState(() => {
    return localStorage.getItem('taxRate') || '8.00';
  });

  // State for managing the success/error notification
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Handler for tax rate input changes
  // We validate the input to ensure it's a valid number between 0 and 100
  const handleTaxRateChange = (event) => {
    const value = event.target.value;
    // Allow empty input for better user experience while typing
    if (value === '') {
      setTaxRate('');
      return;
    }

    // Convert to number for validation
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
      setTaxRate(value);
    }
  };

  // Handler for saving the tax rate
  const handleSave = () => {
    try {
      // Convert to number and validate again before saving
      const numValue = parseFloat(taxRate);
      if (isNaN(numValue) || numValue < 0 || numValue > 100) {
        throw new Error('Invalid tax rate. Please enter a number between 0 and 100.');
      }

      // Format the number to always show 2 decimal places
      const formattedTaxRate = numValue.toFixed(2);
      localStorage.setItem('taxRate', formattedTaxRate);
      setTaxRate(formattedTaxRate);

      // Show success notification
      setNotification({
        open: true,
        message: 'Tax rate saved successfully!',
        severity: 'success'
      });
    } catch (error) {
      // Show error notification
      setNotification({
        open: true,
        message: error.message || 'Error saving tax rate',
        severity: 'error'
      });
    }
  };

  // Handler for closing the notification
  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  return (
    <Paper sx={{ p: 3, maxWidth: 600 }}>
      <Typography variant="h6" gutterBottom>
        Tax Rate Management
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Set the tax rate that will be applied to product sales.
        Services are not taxed. Changes will take effect immediately.
      </Typography>

      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
        <TextField
          label="Product Tax Rate"
          value={taxRate}
          onChange={handleTaxRateChange}
          sx={{ width: 200 }}
          InputProps={{
            endAdornment: <InputAdornment position="end">%</InputAdornment>,
          }}
          type="number"
          inputProps={{
            step: "0.01",
            min: "0",
            max: "100"
          }}
        />

        <Button
          variant="contained"
          onClick={handleSave}
          sx={{ height: 56 }}  // Match height with TextField
        >
          Save Changes
        </Button>
      </Box>

      {/* Notification for success/error messages */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={notification.severity}
          elevation={6}
          variant="filled"
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
}

export default TaxManagement;