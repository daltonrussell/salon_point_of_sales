/**
 * Services Section Component
 * Handles service selection and addition to cart
 */
import React from 'react';
import {
  Paper,
  Typography,
  Grid,
  Button,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  Autocomplete,
  Box,
} from '@mui/material';
import { InfoIcon } from 'lucide-react';

const ServicesSection = ({
  services,
  luxuryServices,
  selectedService,
  selectedLuxuryService,
  selectedStylist,
  customPrice,
  serviceType,
  serviceKey,
  luxuryServiceKey,
  onServiceTypeChange,
  onServiceSelect,
  onLuxuryServiceSelect,
  onCustomPriceChange,
  onAddService,
}) => {
  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Services
      </Typography>

      <Grid container spacing={2}>
        {/* Service Type Tabs */}
        <Grid item xs={12}>
          <Tabs
            value={serviceType}
            onChange={(e, newValue) => {
              onServiceTypeChange(newValue);
            }}
            sx={{ mb: 2, borderBottom: 1, borderColor: "divider" }}
          >
            <Tab label="Regular Services" value="regular" />
            <Tab label="Luxury Services" value="luxury" />
          </Tabs>
        </Grid>

        {/* Service Selection Row */}
        <Grid item xs={6}>
          {serviceType === "regular" ? (
            <Autocomplete
              key={`service-${serviceKey}`}
              options={services}
              value={selectedService}
              getOptionLabel={(option) =>
                option ? `${option.name} - $${option.price}` : ""
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Service"
                  variant="outlined"
                  fullWidth
                />
              )}
              onChange={(event, newValue) => {
                onServiceSelect(newValue);
              }}
            />
          ) : (
            <Autocomplete
              key={`luxury-service-${luxuryServiceKey}`}
              options={luxuryServices}
              value={selectedLuxuryService}
              getOptionLabel={(option) =>
                option ? `${option.name} - $${option.price}` : ""
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Luxury Service"
                  placeholder="Search by name or SKU..."
                  variant="outlined"
                  fullWidth
                />
              )}
              onChange={(event, newValue) => {
                onLuxuryServiceSelect(newValue);
              }}
              renderOption={(props, option) => {
                const { key, ...otherProps } = props;
                return (
                  <li key={key} {...otherProps}>
                    <div>
                      <Typography>{option.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {option.description
                          ? `SKU: ${option.description}`
                          : ""}{" "}
                        - ${option.price}
                      </Typography>
                    </div>
                  </li>
                );
              }}
              filterOptions={(options, state) => {
                // First, check if state.inputValue matches any SKU exactly
                const skuMatch = options.filter(
                  (option) =>
                    option.description &&
                    option.description.toLowerCase() ===
                      state.inputValue.toLowerCase(),
                );

                // If we have SKU matches, return those first
                if (skuMatch.length > 0) {
                  return skuMatch;
                }

                // Otherwise, perform regular filtering on both SKU and service name
                return options.filter(
                  (option) =>
                    option.name
                      .toLowerCase()
                      .includes(state.inputValue.toLowerCase()) ||
                    (option.description &&
                      option.description
                        .toLowerCase()
                        .includes(state.inputValue.toLowerCase())),
                );
              }}
            />
          )}
        </Grid>

        {/* Price Text Box */}
        <Grid item xs={3}>
          <TextField
            label="Price"
            variant="outlined"
            fullWidth
            value={customPrice}
            onChange={(e) => onCustomPriceChange(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">$</InputAdornment>
              ),
            }}
            disabled={!selectedService && !selectedLuxuryService}
          />
        </Grid>

        {/* Add Button */}
        <Grid item xs={3}>
          <Button
            variant="contained"
            onClick={onAddService}
            disabled={
              (serviceType === "regular" && !selectedService) ||
              (serviceType === "luxury" && !selectedLuxuryService) ||
              !selectedStylist
            }
            fullWidth
            sx={{ height: "56px" }}
          >
            ADD SERVICE
          </Button>
        </Grid>

        {/* Info text about luxury services - only shown in luxury tab */}
        {serviceType === "luxury" && (
          <Grid item xs={12}>
            <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
              <InfoIcon color="info" fontSize="small" sx={{ mr: 1 }} />
              <Typography variant="caption" color="text.secondary">
                Luxury services are subject to sales tax.
              </Typography>
            </Box>
          </Grid>
        )}
      </Grid>
    </Paper>
  );
};

export default ServicesSection;
