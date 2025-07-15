import React, { useState, useEffect } from "react";
import {
  Box,
  TextField,
  Typography,
  ButtonGroup,
  Button,
  InputAdornment,
  Paper,
} from "@mui/material";

const TipComponent = ({ 
  subtotal, 
  onTipChange, 
  initialTip = 0,
  disabled = false 
}) => {
  const [tipAmount, setTipAmount] = useState(initialTip);
  const [tipType, setTipType] = useState("amount"); // "amount" or "percentage"

  // Preset tip percentages
  const tipPercentages = [15, 18, 20, 25];

  useEffect(() => {
    setTipAmount(initialTip);
  }, [initialTip]);

  useEffect(() => {
    onTipChange(tipAmount);
  }, [tipAmount, onTipChange]);

  const handlePercentageTip = (percentage) => {
    const calculatedTip = (subtotal * percentage) / 100;
    setTipAmount(parseFloat(calculatedTip.toFixed(2)));
    setTipType("percentage");
  };

  const handleCustomTip = (value) => {
    const numValue = parseFloat(value) || 0;
    setTipAmount(numValue);
    setTipType("amount");
  };

  const clearTip = () => {
    setTipAmount(0);
    setTipType("amount");
  };

  return (
    <Paper sx={{ p: 2, mb: 2, bgcolor: "background.default" }}>
      <Typography variant="subtitle1" gutterBottom>
        Tip (Tax-Free)
      </Typography>
      
      {/* Quick Tip Percentage Buttons */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Quick Tip:
        </Typography>
        <ButtonGroup size="small" disabled={disabled}>
          {tipPercentages.map((percentage) => (
            <Button
              key={percentage}
              onClick={() => handlePercentageTip(percentage)}
              variant={
                tipType === "percentage" && 
                Math.abs(tipAmount - (subtotal * percentage) / 100) < 0.01
                  ? "contained" 
                  : "outlined"
              }
            >
              {percentage}%
            </Button>
          ))}
          <Button
            onClick={clearTip}
            variant="outlined"
            color="secondary"
          >
            No Tip
          </Button>
        </ButtonGroup>
      </Box>

      {/* Custom Tip Amount Input */}
      <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
        <TextField
          label="Custom Tip Amount"
          type="number"
          value={tipAmount || ""}
          onChange={(e) => handleCustomTip(e.target.value)}
          InputProps={{
            startAdornment: <InputAdornment position="start">$</InputAdornment>,
            inputProps: { min: 0, step: 0.01 }
          }}
          size="small"
          disabled={disabled}
          sx={{ flex: 1 }}
        />
        
        {/* Tip Display */}
        <Box sx={{ minWidth: 100 }}>
          <Typography variant="body2" color="text.secondary">
            Tip Amount:
          </Typography>
          <Typography variant="h6" color="primary">
            ${tipAmount.toFixed(2)}
          </Typography>
        </Box>
      </Box>

      {/* Tip Percentage Display */}
      {subtotal > 0 && tipAmount > 0 && (
        <Typography 
          variant="caption" 
          color="text.secondary" 
          sx={{ mt: 1, display: "block" }}
        >
          ({((tipAmount / subtotal) * 100).toFixed(1)}% of subtotal)
        </Typography>
      )}
    </Paper>
  );
};

export default TipComponent;
