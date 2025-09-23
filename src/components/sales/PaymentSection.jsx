/**
 * Payment Section Component
 * Handles payment method selection and split payments
 */
import React from 'react';
import {
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  TextField,
  InputAdornment,
  Grid,
  Box,
  Divider,
} from '@mui/material';
import { PAYMENT_METHODS } from '../../constants/salesConstants';

const PaymentSection = ({
  paymentMethod,
  splitPayment,
  secondaryPayment,
  cashTender,
  changeDue,
  subtotal,
  productTax,
  serviceTax,
  tipAmount,
  onPaymentMethodChange,
  onSplitPaymentToggle,
  onSecondaryPaymentChange,
  onCashTenderChange,
  onCompleteSale,
  isDisabled,
}) => {
  return (
    <>
      <Typography variant="subtitle1" gutterBottom>
        Payment
      </Typography>

      <FormControlLabel
        control={
          <Checkbox
            checked={splitPayment}
            onChange={(e) => onSplitPaymentToggle(e.target.checked)}
          />
        }
        label="Split Payment"
        sx={{ mb: 1 }}
      />

      {!splitPayment ? (
        <>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Payment Method</InputLabel>
            <Select
              value={paymentMethod}
              label="Payment Method"
              onChange={onPaymentMethodChange}
            >
              {PAYMENT_METHODS.map((method) => (
                <MenuItem key={method} value={method}>
                  {method}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Cash tender and change due - only show for cash payments */}
          {paymentMethod === "Cash" && (
            <Box sx={{ mt: 2, mb: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    label="Cash Tendered"
                    type="number"
                    fullWidth
                    value={cashTender}
                    onChange={onCashTenderChange}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">$</InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      p: 2,
                      bgcolor: "background.paper",
                      borderRadius: 1,
                      border: 1,
                      borderColor: "divider",
                    }}
                  >
                    <Typography variant="subtitle1">Change Due:</Typography>
                    <Typography
                      variant="subtitle1"
                      fontWeight="bold"
                      color={
                        changeDue > 0 ? "success.main" : "text.primary"
                      }
                    >
                      ${changeDue.toFixed(2)}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}
        </>
      ) : (
        <Box
          sx={{
            mt: 2,
            border: 1,
            borderColor: "divider",
            p: 2,
            borderRadius: 1,
          }}
        >
          <Typography variant="subtitle2" gutterBottom>
            First Payment: $
            {secondaryPayment.amount
              ? (
                  subtotal +
                  productTax +
                  serviceTax +
                  tipAmount -
                  parseFloat(secondaryPayment.amount)
                ).toFixed(2)
              : (subtotal + productTax + serviceTax + tipAmount).toFixed(2)}
          </Typography>

          <Box sx={{ mb: 2 }}>
            <FormControl fullWidth>
              <InputLabel>First Payment Method</InputLabel>
              <Select
                value={paymentMethod}
                label="First Payment Method"
                onChange={onPaymentMethodChange}
              >
                {PAYMENT_METHODS.map((method) => (
                  <MenuItem key={method} value={method}>
                    {method}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle2" gutterBottom>
            Second Payment: ${secondaryPayment.amount || "0.00"}
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Second Method</InputLabel>
                <Select
                  value={secondaryPayment.method}
                  label="Second Method"
                  onChange={(e) =>
                    onSecondaryPaymentChange("method", e.target.value)
                  }
                >
                  {PAYMENT_METHODS.map((method) => (
                    <MenuItem key={method} value={method}>
                      {method}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Amount"
                type="number"
                fullWidth
                value={secondaryPayment.amount}
                onChange={(e) =>
                  onSecondaryPaymentChange("amount", e.target.value)
                }
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">$</InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>
        </Box>
      )}

      <Button
        variant="contained"
        fullWidth
        size="large"
        onClick={onCompleteSale}
        disabled={isDisabled}
      >
        COMPLETE SALE
      </Button>
    </>
  );
};

export default PaymentSection;
