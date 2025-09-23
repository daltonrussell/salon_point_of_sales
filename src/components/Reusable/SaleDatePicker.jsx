import React, { useState } from "react";
import { TextField, Button, Box } from "@mui/material";
import { Refresh as RefreshIcon } from "@mui/icons-material";

const SaleDatePicker = ({ initialDate = new Date(), onDateChange }) => {
  // Format the initial date to YYYY-MM-DD format for the input
  const formatDate = (date) => {
    return date.toISOString().split("T")[0];
  };

  // Initialize state with today's date or provided initialDate
  const [saleDate, setSaleDate] = useState(formatDate(initialDate));

  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setSaleDate(newDate);

    // Pass the selected date to parent component
    if (onDateChange) {
      // Create a Date object at noon to avoid timezone issues
      const dateObj = new Date(newDate + "T12:00:00");
      onDateChange(dateObj);
    }
  };

  const handleUseCurrentDate = () => {
    const currentDate = new Date();
    const formattedDate = formatDate(currentDate);
    setSaleDate(formattedDate);
    
    if (onDateChange) {
      onDateChange(currentDate);
    }
  };

  return (
    <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
      <TextField
        label="Sale Date"
        type="date"
        value={saleDate}
        onChange={handleDateChange}
        fullWidth
        InputLabelProps={{ shrink: true }}
      />
      <Button
        variant="outlined"
        size="small"
        onClick={handleUseCurrentDate}
        startIcon={<RefreshIcon />}
        sx={{ minWidth: "auto", px: 1 }}
        title="Use current date"
      >
        Now
      </Button>
    </Box>
  );
};

export default SaleDatePicker;
