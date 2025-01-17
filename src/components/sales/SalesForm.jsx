import React, { useEffect, useState } from 'react';
import {
  Box,
  TextField,
  Autocomplete,
  Paper,
  Typography,
  Grid,
  Button,
  ButtonGroup,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
const { ipcRenderer } = window.require('electron');

const paymentMethods = [
  'Cash',
  'Credit Card',
  'Debit Card',
  'Gift Card',
];

function SalesForm() {
  // Data states
  const [stylists, setStylists] = useState([]);
  const [services, setServices] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  
  // Selected item states
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedStylist, setSelectedStylist] = useState(null);

  // Payment states
  const [subtotal, setSubtotal] = useState(0);
  const [tax, setTax] = useState(0);
  const [tip, setTip] = useState(0);
  const [customTip, setCustomTip] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');

  // Load initial data
  useEffect(() => {
    loadStylists();
    loadServices();
  }, []);

  // Data loading functions
  const loadStylists = async () => {
    try {
      const data = await ipcRenderer.invoke('get-stylists', 'active');
      setStylists(data);
    } catch (error) {
      console.error('Error loading stylists:', error);
    }
  };

  const loadServices = async () => {
    // TODO: Implement service loading from database
    setServices([
      { id: 1, name: 'Haircut', price: 30 },
      { id: 2, name: 'Color', price: 80 },
    ]);
  };

  // Cart management
  const addToCart = () => {
    if (selectedService && selectedStylist) {
      const newItem = {
        id: Date.now(), // temporary ID
        service: selectedService,
        stylist: selectedStylist,
      };
      setCartItems([...cartItems, newItem]);
      updateTotals([...cartItems, newItem]);
    }
  };

  const removeFromCart = (itemId) => {
    const updatedCart = cartItems.filter(item => item.id !== itemId);
    setCartItems(updatedCart);
    updateTotals(updatedCart);
  };

  // Payment calculations
  const updateTotals = (items) => {
    const newSubtotal = items.reduce((sum, item) => sum + item.service.price, 0);
    setSubtotal(newSubtotal);
    setTax(newSubtotal * 0.08); // Assuming 8% tax
  };

  const handleTipSelection = (percentage) => {
    setTip(subtotal * (percentage / 100));
    setCustomTip('');
  };

  const handleCustomTip = (value) => {
    setCustomTip(value);
    setTip(parseFloat(value) || 0);
  };

  const handleCompleteSale = async () => {
    try {
      // TODO: Implement sale completion
      // 1. Save sale to database
      // 2. Save client history
      // 3. Update inventory if needed
      // 4. Clear form
      console.log('Sale completed');
    } catch (error) {
      console.error('Error completing sale:', error);
    }
  };

  return (
    <Grid container spacing={3}>
      {/* Left Section */}
      <Grid item xs={8}>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Client Information
          </Typography>
          <Autocomplete
            freeSolo
            options={[]} // TODO: Implement client search
            getOptionLabel={(option) => 
              option ? `${option.firstName} ${option.lastName}` : ''
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Search Clients"
                variant="outlined"
                fullWidth
              />
            )}
            onChange={(event, newValue) => setSelectedClient(newValue)}
          />
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Services & Products
          </Typography>
          <Grid container spacing={2} alignItems="flex-start">
            <Grid item xs={5}>
              <Autocomplete
                options={services}
                getOptionLabel={(option) => 
                  option ? `${option.name} - $${option.price}` : ''
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Service"
                    variant="outlined"
                    fullWidth
                  />
                )}
                onChange={(event, newValue) => setSelectedService(newValue)}
              />
            </Grid>
            <Grid item xs={5}>
              <Autocomplete
                options={stylists}
                getOptionLabel={(option) => 
                  option ? `${option.firstName} ${option.lastName}` : ''
                }
                isOptionEqualToValue={(option, value) => option.id === value.id}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Stylist"
                    variant="outlined"
                    fullWidth
                  />
                )}
                onChange={(event, newValue) => setSelectedStylist(newValue)}
              />
            </Grid>
            <Grid item xs={2}>
              <Button 
                variant="contained" 
                onClick={addToCart}
                disabled={!selectedService || !selectedStylist}
                fullWidth
                sx={{ height: '56px' }}
              >
                ADD
              </Button>
            </Grid>
          </Grid>
        </Paper>
      </Grid>

      {/* Right Section - Cart Summary */}
      <Grid item xs={4}>
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
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 1 
                }}
              >
                <Typography>
                  {item.service.name} - {item.stylist.firstName}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography>${item.service.price}</Typography>
                  <Button 
                    size="small" 
                    color="error"
                    onClick={() => removeFromCart(item.id)}
                  >
                    X
                  </Button>
                </Box>
              </Box>
            ))}
          </Box>

          {/* Totals */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography>Subtotal</Typography>
              <Typography>${subtotal.toFixed(2)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography>Tax</Typography>
              <Typography>${tax.toFixed(2)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography>Tip</Typography>
              <Typography>${tip.toFixed(2)}</Typography>
            </Box>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              mb: 1,
              fontWeight: 'bold'
            }}>
              <Typography>Total</Typography>
              <Typography>${(subtotal + tax + tip).toFixed(2)}</Typography>
            </Box>
          </Box>

          {/* Payment Section */}
          <Typography variant="subtitle1" gutterBottom>
            Payment
          </Typography>
          
          {/* Tip Options */}
          <Typography variant="body2" gutterBottom>
            Tip
          </Typography>
          <ButtonGroup fullWidth sx={{ mb: 2 }}>
            <Button onClick={() => handleTipSelection(15)}>15%</Button>
            <Button onClick={() => handleTipSelection(18)}>18%</Button>
            <Button onClick={() => handleTipSelection(20)}>20%</Button>
          </ButtonGroup>
          
          <TextField
            label="Custom Tip"
            value={customTip}
            onChange={(e) => handleCustomTip(e.target.value)}
            fullWidth
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            }}
          />

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Payment Method</InputLabel>
            <Select
              value={paymentMethod}
              label="Payment Method"
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              {paymentMethods.map((method) => (
                <MenuItem key={method} value={method}>
                  {method}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button
            variant="contained"
            fullWidth
            size="large"
            onClick={handleCompleteSale}
            disabled={cartItems.length === 0 || !paymentMethod}
          >
            COMPLETE SALE
          </Button>
        </Paper>
      </Grid>
    </Grid>
  );
}

export default SalesForm;