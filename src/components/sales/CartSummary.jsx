/**
 * Cart Summary Component
 * Displays cart items and totals
 */
import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Button,
} from '@mui/material';
import TipComponent from '../Reusable/TipComponent';

const CartSummary = ({
  cartItems,
  subtotal,
  productTax,
  serviceTax,
  tipAmount,
  onTipChange,
  onRemoveItem,
}) => {
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Cart Summary
      </Typography>

      {/* Cart Items */}
      <Box sx={{ mb: 3 }}>
        {cartItems.map((item) => (
          <Box
            key={item.id}
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 1,
            }}
          >
            <Typography>
              {item.type === "service" ? (
                <>
                  {item.service.name} - {item.stylist.firstName}
                  {item.isLuxury && (
                    <span style={{ color: "#9c27b0", marginLeft: "5px" }}>
                      [Luxury]
                    </span>
                  )}
                </>
              ) : (
                <>
                  {item.product.productName} (x{item.quantity})
                  {item.isBackBar && (
                    <span style={{ color: "blue" }}> [Back Bar]</span>
                  )}
                  {!item.isBackBar && item.discountPercent > 0 && (
                    <span style={{ color: "red" }}>
                      {" "}
                      [{item.discountPercent}% off]
                    </span>
                  )}
                </>
              )}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography>${item.price.toFixed(2)}</Typography>
              <Button
                size="small"
                color="error"
                onClick={() => onRemoveItem(item.id)}
              >
                X
              </Button>
            </Box>
          </Box>
        ))}
      </Box>

      {/* Totals */}
      <Box sx={{ mb: 3 }}>
        <Box
          sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
        >
          <Typography>Subtotal</Typography>
          <Typography>${subtotal.toFixed(2)}</Typography>
        </Box>
        {productTax > 0 && (
          <Box
            sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
          >
            <Typography>Product Tax</Typography>
            <Typography>${productTax.toFixed(2)}</Typography>
          </Box>
        )}
        {serviceTax > 0 && (
          <Box
            sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
          >
            <Typography>Luxury Service Tax</Typography>
            <Typography>${serviceTax.toFixed(2)}</Typography>
          </Box>
        )}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            mb: 1,
            fontWeight: "bold",
            borderTop: 1,
            borderColor: "divider",
            pt: 1,
          }}
        >
          <Typography fontWeight="bold">Subtotal + Tax</Typography>
          <Typography fontWeight="bold">
            ${(subtotal + productTax + serviceTax).toFixed(2)}
          </Typography>
        </Box>
      </Box>

      {/* Tip Section */}
      <TipComponent
        subtotal={subtotal}
        onTipChange={onTipChange}
        initialTip={tipAmount}
        disabled={cartItems.length === 0}
      />

      {/* Final Total with Tip */}
      <Box sx={{ mb: 3 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            mb: 1,
            fontWeight: "bold",
            fontSize: "1.1rem",
            borderTop: 2,
            borderColor: "primary.main",
            pt: 1,
          }}
        >
          <Typography fontWeight="bold" variant="h6">Final Total</Typography>
          <Typography fontWeight="bold" variant="h6" color="primary">
            ${(subtotal + productTax + serviceTax + tipAmount).toFixed(2)}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};

export default CartSummary;
