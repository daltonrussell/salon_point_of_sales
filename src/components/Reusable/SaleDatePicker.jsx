import React, { useState, useEffect } from "react";
import { TextField } from "@mui/material";

const SaleDatePicker = ({ initialDate = new Date(), onDateChange }) => {
  // Format the initial date to YYYY-MM-DD format for the input
  // Use local date methods to avoid timezone conversion issues
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Initialize state with today's date or provided initialDate
  const [saleDate, setSaleDate] = useState(formatDate(initialDate));

  // Sync internal state when initialDate prop changes
  // Only update if the formatted dates are actually different to avoid unnecessary re-renders
  useEffect(() => {
    const formattedInitialDate = formatDate(initialDate);
    if (formattedInitialDate !== saleDate) {
      setSaleDate(formattedInitialDate);
    }
  }, [initialDate]);

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
