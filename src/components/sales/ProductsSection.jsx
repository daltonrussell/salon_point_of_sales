/**
 * Products Section Component
 * Handles product selection and addition to cart
 */
import React from 'react';
import {
  Paper,
  Typography,
  Grid,
  Button,
  TextField,
  InputAdornment,
  Autocomplete,
  Tooltip,
} from '@mui/material';

const ProductsSection = ({
  products,
  selectedProduct,
  productQuantity,
  discountPercent,
  productKey,
  onProductSelect,
  onQuantityChange,
  onDiscountChange,
  onAddProduct,
  onAddBackBar,
}) => {
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Products
      </Typography>
      <Grid container spacing={2} alignItems="flex-start">
        {/* Product Dropdown */}
        <Grid item xs={8}>
          <Autocomplete
            key={`product-${productKey}`}
            options={products}
            value={selectedProduct}
            getOptionLabel={(option) =>
              option ? `${option.productName} - $${option.salePrice}` : ""
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Product"
                variant="outlined"
                fullWidth
              />
            )}
            onChange={(event, newValue) => onProductSelect(newValue)}
            renderOption={(props, option) => {
              const { key, ...otherProps } = props;
              return (
                <li key={key} {...otherProps}>
                  <div>
                    <Typography>{option.productName}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      SKU: {option.sku} - Stock: {option.quantity} - $
                      {option.salePrice}
                    </Typography>
                  </div>
                </li>
              );
            }}
            filterOptions={(options, state) => {
              // First, check if state.inputValue matches any SKU exactly
              const skuMatch = options.filter(
                (option) =>
                  option.sku.toLowerCase() ===
                  state.inputValue.toLowerCase(),
              );

              // If we have SKU matches, return those first
              if (skuMatch.length > 0) {
                return skuMatch;
              }

              // Otherwise, perform regular filtering on both SKU and product name
              return options.filter(
                (option) =>
                  option.sku
                    .toLowerCase()
                    .includes(state.inputValue.toLowerCase()) ||
                  option.productName
                    .toLowerCase()
                    .includes(state.inputValue.toLowerCase()),
              );
            }}
          />
        </Grid>

        {/* Add Button */}
        <Grid item xs={4}>
          <Button
            variant="contained"
            onClick={onAddProduct}
            disabled={!selectedProduct || productQuantity < 1}
            fullWidth
            sx={{ height: "56px" }}
          >
            ADD PRODUCT
          </Button>
        </Grid>

        {/* Quantity Input */}
        <Grid item xs={4}>
          <TextField
            label="Quantity"
            type="number"
            variant="outlined"
            fullWidth
            value={productQuantity}
            onChange={(e) =>
              onQuantityChange(Math.max(1, parseInt(e.target.value) || 1))
            }
            InputProps={{
              inputProps: { min: 1, max: selectedProduct?.quantity || 1 },
            }}
            disabled={!selectedProduct}
          />
        </Grid>

        {/* Discount Input */}
        <Grid item xs={4}>
          <TextField
            label="Discount %"
            type="number"
            variant="outlined"
            fullWidth
            value={discountPercent}
            onChange={(e) => {
              const value = Math.min(
                100,
                Math.max(0, parseInt(e.target.value) || 0),
              );
              onDiscountChange(value.toString());
            }}
            InputProps={{
              inputProps: { min: 0, max: 100 },
              endAdornment: (
                <InputAdornment position="end">%</InputAdornment>
              ),
            }}
            disabled={!selectedProduct}
          />
        </Grid>

        {/* Back Bar Button */}
        <Grid item xs={4}>
          <Tooltip title="Mark product as used in salon (not for sale)">
            <span>
              <Button
                variant="contained"
                color="secondary"
                onClick={onAddBackBar}
                disabled={!selectedProduct || productQuantity < 1}
                fullWidth
                sx={{ height: "56px" }}
              >
                BACK BAR
              </Button>
            </span>
          </Tooltip>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default ProductsSection;
