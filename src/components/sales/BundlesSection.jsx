/**
 * Bundles Section Component
 * Handles bundle selection and addition to cart
 */
import React from 'react';
import {
  Paper,
  Typography,
  Grid,
  Button,
  TextField,
  Autocomplete,
  Chip,
  Box,
} from '@mui/material';
import Inventory2Icon from '@mui/icons-material/Inventory2';

const BundlesSection = ({
  bundles,
  selectedBundle,
  bundleQuantity,
  bundleKey,
  onBundleSelect,
  onQuantityChange,
  onAddBundle,
}) => {
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Inventory2Icon /> Bundles
      </Typography>
      <Grid container spacing={2} alignItems="flex-start">
        {/* Bundle Dropdown */}
        <Grid item xs={8}>
          <Autocomplete
            key={`bundle-${bundleKey}`}
            options={bundles}
            value={selectedBundle}
            getOptionLabel={(option) =>
              option ? `${option.bundleName} - $${option.salePrice}` : ""
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Bundle"
                variant="outlined"
                fullWidth
              />
            )}
            onChange={(event, newValue) => onBundleSelect(newValue)}
            renderOption={(props, option) => {
              const { key, ...otherProps } = props;
              return (
                <li key={key} {...otherProps}>
                  <Box sx={{ width: '100%' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography>{option.bundleName}</Typography>
                      <Chip
                        label={`${option.quantity} available`}
                        size="small"
                        color={option.quantity > 0 ? "success" : "error"}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      SKU: {option.sku} - ${option.salePrice}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Contains: {option.components.map(c => `${c.quantity}x ${c.productName}`).join(', ')}
                    </Typography>
                  </Box>
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

              // Otherwise, perform regular filtering on both SKU and bundle name
              return options.filter(
                (option) =>
                  option.sku
                    .toLowerCase()
                    .includes(state.inputValue.toLowerCase()) ||
                  option.bundleName
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
            color="secondary"
            onClick={onAddBundle}
            disabled={!selectedBundle || bundleQuantity < 1}
            fullWidth
            sx={{ height: "56px" }}
          >
            ADD BUNDLE
          </Button>
        </Grid>

        {/* Quantity Input */}
        <Grid item xs={12}>
          <TextField
            label="Quantity"
            type="number"
            variant="outlined"
            fullWidth
            value={bundleQuantity}
            onChange={(e) =>
              onQuantityChange(Math.max(1, parseInt(e.target.value) || 1))
            }
            InputProps={{
              inputProps: { min: 1, max: selectedBundle?.quantity || 1 },
            }}
            disabled={!selectedBundle}
            helperText={
              selectedBundle
                ? `${selectedBundle.quantity} bundles available`
                : 'Select a bundle'
            }
          />
        </Grid>

        {/* Show selected bundle components */}
        {selectedBundle && (
          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Bundle Contents:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {selectedBundle.components.map((component, index) => (
                <Chip
                  key={index}
                  label={`${component.quantity}x ${component.productName}`}
                  size="small"
                  variant="outlined"
                />
              ))}
            </Box>
          </Grid>
        )}
      </Grid>
    </Paper>
  );
};

export default BundlesSection;
