import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  Typography,
  IconButton,
  Autocomplete,
  Box,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

const ipc = window.api;

function BundleModal({ open, onClose, onBundleCreated, onBundleUpdated, bundleToEdit }) {
  const [formData, setFormData] = useState({
    bundleName: '',
    sku: '',
    quantity: 1,
    components: [],
    salePrice: 0,
    calculatedPrice: 0,
    overridePrice: false,
  });

  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [componentQuantity, setComponentQuantity] = useState(1);
  const [error, setError] = useState('');
  const [availabilityInfo, setAvailabilityInfo] = useState('');

  // Load products when modal opens
  useEffect(() => {
    if (open) {
      loadProducts();
    }
  }, [open]);

  // Reset form when modal opens/closes or when bundleToEdit changes
  useEffect(() => {
    if (open) {
      if (bundleToEdit) {
        const calculatedPrice = calculateTotalPrice(bundleToEdit.components);
        setFormData({
          bundleName: bundleToEdit.bundleName || '',
          sku: bundleToEdit.sku || '',
          quantity: bundleToEdit.quantity || 1,
          components: bundleToEdit.components || [],
          salePrice: bundleToEdit.salePrice || 0,
          calculatedPrice: calculatedPrice,
          overridePrice: bundleToEdit.salePrice !== calculatedPrice,
        });
      } else {
        setFormData({
          bundleName: '',
          sku: '',
          quantity: 1,
          components: [],
          salePrice: 0,
          calculatedPrice: 0,
          overridePrice: false,
        });
      }
      setError('');
      setAvailabilityInfo('');
    }
  }, [open, bundleToEdit]);

  // Calculate availability when components or quantity changes
  useEffect(() => {
    if (formData.components.length > 0 && formData.quantity > 0) {
      calculateAvailability();
    } else {
      setAvailabilityInfo('');
    }
  }, [formData.components, formData.quantity]);

  // Update calculated price when components change
  useEffect(() => {
    const newCalculatedPrice = calculateTotalPrice(formData.components);
    setFormData(prev => ({
      ...prev,
      calculatedPrice: newCalculatedPrice,
      salePrice: prev.overridePrice ? prev.salePrice : newCalculatedPrice,
    }));
  }, [formData.components]);

  const loadProducts = async () => {
    try {
      const inventoryWithAvailability = await ipc.invoke('get-inventory-with-availability');
      setProducts(inventoryWithAvailability);
    } catch (error) {
      console.error('Error loading products:', error);
      setError('Failed to load products');
    }
  };

  const calculateTotalPrice = (components) => {
    return components.reduce((total, comp) => {
      return total + (comp.salePrice * comp.quantity);
    }, 0);
  };

  const calculateAvailability = async () => {
    if (formData.components.length === 0) {
      setAvailabilityInfo('');
      return;
    }

    try {
      const inventoryWithAvailability = await ipc.invoke('get-inventory-with-availability');

      let maxBundles = Infinity;
      let limitingProduct = null;

      for (const component of formData.components) {
        const product = inventoryWithAvailability.find(p => p.id === component.inventoryId);
        if (product) {
          const availableForBundles = Math.floor(product.quantityAvailable / component.quantity);
          if (availableForBundles < maxBundles) {
            maxBundles = availableForBundles;
            limitingProduct = product.productName;
          }
        }
      }

      if (maxBundles === Infinity) {
        setAvailabilityInfo('');
      } else if (maxBundles < formData.quantity) {
        setAvailabilityInfo(
          `Warning: You can only create ${maxBundles} bundles with current inventory (limited by ${limitingProduct})`
        );
      } else {
        setAvailabilityInfo(
          `You can create up to ${maxBundles} bundles with current inventory`
        );
      }
    } catch (error) {
      console.error('Error calculating availability:', error);
    }
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNumberChange = (event) => {
    const { name, value } = event.target;
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0) {
      // Round to 2 decimal places to avoid floating point precision issues
      const roundedValue = Math.round(numValue * 100) / 100;
      setFormData(prev => ({
        ...prev,
        [name]: roundedValue
      }));
    }
  };

  const handlePriceOverrideChange = (event) => {
    const override = event.target.checked;
    setFormData(prev => ({
      ...prev,
      overridePrice: override,
      salePrice: override ? prev.salePrice : prev.calculatedPrice,
    }));
  };

  const handleAddComponent = () => {
    if (!selectedProduct) {
      setError('Please select a product');
      return;
    }

    if (componentQuantity <= 0) {
      setError('Quantity must be greater than 0');
      return;
    }

    // Check if product already in components
    if (formData.components.some(c => c.inventoryId === selectedProduct.id)) {
      setError('This product is already in the bundle');
      return;
    }

    const newComponent = {
      inventoryId: selectedProduct.id,
      productName: selectedProduct.productName,
      quantity: componentQuantity,
      purchasePrice: selectedProduct.purchasePrice,
      salePrice: selectedProduct.salePrice,
    };

    setFormData(prev => ({
      ...prev,
      components: [...prev.components, newComponent]
    }));

    setSelectedProduct(null);
    setComponentQuantity(1);
    setError('');
  };

  const handleRemoveComponent = (inventoryId) => {
    setFormData(prev => ({
      ...prev,
      components: prev.components.filter(c => c.inventoryId !== inventoryId)
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (formData.components.length === 0) {
      setError('Please add at least one product to the bundle');
      return;
    }

    if (formData.quantity <= 0) {
      setError('Bundle quantity must be greater than 0');
      return;
    }

    if (formData.salePrice <= 0) {
      setError('Sale price must be greater than 0');
      return;
    }

    try {
      const bundleData = {
        bundleName: formData.bundleName,
        sku: formData.sku,
        quantity: formData.quantity,
        salePrice: formData.salePrice,
        calculatedPrice: formData.calculatedPrice,
        components: formData.components.map(c => ({
          inventoryId: c.inventoryId,
          quantity: c.quantity,
        })),
      };

      if (bundleToEdit) {
        // Update existing bundle
        const updatedBundle = await ipc.invoke('update-bundle', {
          id: bundleToEdit.id,
          ...bundleData
        });
        onBundleUpdated(updatedBundle);
      } else {
        // Create new bundle
        const newBundle = await ipc.invoke('create-bundle', bundleData);
        onBundleCreated(newBundle);
      }
      onClose();
    } catch (error) {
      console.error('Error saving bundle:', error);
      setError(error.message || 'Failed to save bundle');
    }
  };

  const isEditMode = !!bundleToEdit;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{isEditMode ? 'Edit Bundle' : 'Create New Bundle'}</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {availabilityInfo && (
            <Alert
              severity={availabilityInfo.includes('Warning') ? 'warning' : 'info'}
              sx={{ mb: 2 }}
            >
              {availabilityInfo}
            </Alert>
          )}

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                name="bundleName"
                label="Bundle Name"
                value={formData.bundleName}
                onChange={handleInputChange}
                required
                fullWidth
                placeholder="e.g., Holiday Gift Basket"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="sku"
                label="SKU"
                value={formData.sku}
                onChange={handleInputChange}
                required
                fullWidth
                placeholder="e.g., BUNDLE-HOLIDAY-001"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="quantity"
                label="Number of Bundles to Create"
                type="number"
                value={formData.quantity}
                onChange={handleNumberChange}
                required
                fullWidth
                inputProps={{ min: 1, step: 1 }}
              />
            </Grid>

            {/* Component Products Section */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                Component Products
              </Typography>

              <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'flex-start' }}>
                <Autocomplete
                  value={selectedProduct}
                  onChange={(event, newValue) => setSelectedProduct(newValue)}
                  options={products}
                  getOptionLabel={(option) =>
                    `${option.productName} (Available: ${option.quantityAvailable})`
                  }
                  renderOption={(props, option) => (
                    <li {...props} key={option.id}>
                      <Box>
                        <Typography>{option.productName}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Stock: {option.quantity} (Available: {option.quantityAvailable}, Reserved: {option.quantityReserved}) - ${option.salePrice}
                        </Typography>
                      </Box>
                    </li>
                  )}
                  sx={{ flexGrow: 1 }}
                  renderInput={(params) => (
                    <TextField {...params} label="Select Product" />
                  )}
                />
                <TextField
                  label="Quantity"
                  type="number"
                  value={componentQuantity}
                  onChange={(e) => setComponentQuantity(parseInt(e.target.value) || 1)}
                  inputProps={{ min: 1, step: 1 }}
                  sx={{ width: 120 }}
                />
                <IconButton
                  color="primary"
                  onClick={handleAddComponent}
                  sx={{ mt: 1 }}
                >
                  <AddIcon />
                </IconButton>
              </Box>

              {formData.components.length > 0 && (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Product</TableCell>
                      <TableCell align="right">Qty per Bundle</TableCell>
                      <TableCell align="right">Price Each</TableCell>
                      <TableCell align="right">Subtotal</TableCell>
                      <TableCell align="right">Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {formData.components.map((component) => (
                      <TableRow key={component.inventoryId}>
                        <TableCell>{component.productName}</TableCell>
                        <TableCell align="right">{component.quantity}</TableCell>
                        <TableCell align="right">${component.salePrice.toFixed(2)}</TableCell>
                        <TableCell align="right">
                          ${(component.salePrice * component.quantity).toFixed(2)}
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            onClick={() => handleRemoveComponent(component.inventoryId)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={3} align="right">
                        <strong>Calculated Total:</strong>
                      </TableCell>
                      <TableCell align="right">
                        <strong>${formData.calculatedPrice.toFixed(2)}</strong>
                      </TableCell>
                      <TableCell />
                    </TableRow>
                  </TableBody>
                </Table>
              )}
            </Grid>

            {/* Pricing Section */}
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.overridePrice}
                    onChange={handlePriceOverrideChange}
                  />
                }
                label="Override calculated price"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                name="salePrice"
                label="Bundle Sale Price"
                type="number"
                value={formData.salePrice}
                onChange={handleNumberChange}
                required
                fullWidth
                disabled={!formData.overridePrice}
                inputProps={{ min: 0, step: 0.01 }}
                helperText={
                  formData.overridePrice
                    ? `Calculated price: $${formData.calculatedPrice.toFixed(2)}`
                    : 'Using calculated price from components'
                }
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" color="primary">
            {isEditMode ? 'Update Bundle' : 'Create Bundle'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default BundleModal;
