import React, { useState } from "react";
import { TextField } from "@mui/material";

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

  return (
    <TextField
      label="Sale Date"
      type="date"
      value={saleDate}
      onChange={handleDateChange}
      fullWidth
      InputLabelProps={{ shrink: true }}
    />
  );
};

export default SaleDatePicker;
