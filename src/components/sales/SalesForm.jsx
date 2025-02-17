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
  Tabs,
  Tab,
} from '@mui/material';
import CustomerModal from '../customers/CustomerModal';
const { ipcRenderer } = window.require('electron');

const paymentMethods = [
  'Cash',
  'Credit Card',
  'Debit Card',
];

const TAX_RATE = 0.08; // 8% tax rate for products only

function SalesForm() {
  // Data states
  const [stylists, setStylists] = useState([]);
  const [services, setServices] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0); // 0 for services, 1 for products
  
  // Selected item states
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedStylist, setSelectedStylist] = useState(null);

  // Payment states
  const [subtotal, setSubtotal] = useState(0);
  const [productTax, setProductTax] = useState(0);
  const [serviceTax, setServiceTax] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [customPrice, setCustomPrice] = useState('');

  // Load initial data
  useEffect(() => {
    loadStylists();
    loadServices();
    loadAllClients();
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
    setServices([
      { id: 1, name: 'Haircut', price: 30 },
      { id: 2, name: 'Color', price: 80 },
    ]);
  };

  const loadAllClients = async () => {
    try {
      const data = await ipcRenderer.invoke('get-all-clients');
      setCustomers(data);
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };

  const handleNewCustomer = (newCustomer) => {
    if (!newCustomer || !newCustomer.lastName || !newCustomer.firstName) {
      console.error('Invalid customer data:', newCustomer);
      return;
    }
    
    setCustomers(prev => [
      ...prev.filter(c => c && c.lastName && c.firstName),
      newCustomer
    ].sort((a, b) => {
      if (!a || !b) return 0;
      const lastNameCompare = a.lastName.localeCompare(b.lastName);
      return lastNameCompare || a.firstName.localeCompare(b.firstName);
    }));
    setSelectedCustomer(newCustomer);
  };

  // Cart management
  const addToCart = () => {
    if (selectedService && selectedStylist) {
      const newItem = {
        id: Date.now(),
        type: 'service',
        service: {
          ...selectedService,
          price: parseFloat(customPrice) || selectedService.price,
        },
        stylist: selectedStylist,
      };
      const updatedCart = [...cartItems, newItem];
      setCartItems(updatedCart);
      updateTotals(updatedCart);
      setSelectedService(null);
      setCustomPrice('');
    }
  };

  const removeFromCart = (itemId) => {
    const updatedCart = cartItems.filter(item => item.id !== itemId);
    setCartItems(updatedCart);
    updateTotals(updatedCart);
  };

  // Payment calculations
  const updateTotals = (items) => {
    let newServiceSubtotal = 0;
    let newProductSubtotal = 0;

    items.forEach(item => {
      if (item.type === 'service') {
        newServiceSubtotal += parseFloat(item.service.price);
      } else if (item.type === 'product') {
        newProductSubtotal += parseFloat(item.price);
      }
    });

    const newProductTax = newProductSubtotal * TAX_RATE;
    
    setSubtotal(newServiceSubtotal + newProductSubtotal);
    setProductTax(newProductTax);
    setServiceTax(0); // Services are not taxed
  };

  const handleCompleteSale = async () => {
    try {
      const saleData = {
        clientId: selectedCustomer.id,
        stylistId: selectedStylist?.id,
        items: cartItems.map(item => ({
          type: item.type,
          price: item.type === 'service' ? item.service.price : item.price,
          quantity: item.quantity || 1,
          ...(item.type === 'service' 
            ? { serviceId: item.service.id }
            : { inventoryId: item.product.id }
          )
        })),
        subtotal,
        serviceTax,
        productTax,
        totalTax: serviceTax + productTax,
        total: subtotal + serviceTax + productTax,
        paymentMethod
      };

      await ipcRenderer.invoke('create-sale', saleData);
      
      // Reset form
      setCartItems([]);
      setSelectedCustomer(null);
      setSelectedStylist(null);
      setPaymentMethod('');
      
      alert('Sale completed successfully!');
    } catch (error) {
      console.error('Error completing sale:', error);
      alert('Error completing sale');
    }
  };

  return (
    <Grid container spacing={3}>
      {/* Left Section */}
      <Grid item xs={8}>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Sale Information
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Customer Selection */}
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Autocomplete
                sx={{ flex: 1 }}
                options={customers}
                getOptionLabel={(option) =>
                  option ? `${option.lastName}, ${option.firstName}` : ''
                }
                isOptionEqualToValue={(option, value) => option?.id === value?.id}
                value={selectedCustomer}
                onChange={(event, newValue) => setSelectedCustomer(newValue)}
                renderOption={(props, option) => {
                  const { key, ...otherProps } = props;
                  return (
                    <li key={key} {...otherProps}>
                      <div>
                        <strong>
                          {option.lastName}, {option.firstName}
                        </strong>
                        {option.phone && (
                          <Typography variant="body2" color="text.secondary">
                            {option.phone}
                          </Typography>
                        )}
                      </div>
                    </li>
                  );
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Client"
                    placeholder="Type to filter clients..."
                    variant="outlined"
                    fullWidth
                  />
                )}
              />
              <Button
                variant="contained"
                onClick={() => setIsModalOpen(true)}
                sx={{ minWidth: 'auto', px: 2 }}
              >
                +
              </Button>
            </Box>

            {/* Stylist Selection */}
            <Autocomplete
              options={stylists}
              getOptionLabel={(option) =>
                option ? `${option.firstName} ${option.lastName}` : ''
              }
              isOptionEqualToValue={(option, value) => option?.id === value?.id}
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
          </Box>
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Services
          </Typography>
          <Grid container spacing={2} alignItems="flex-start">
            {/* Service Dropdown */}
            <Grid item xs={4}>
              <Autocomplete
                options={services}
                getOptionLabel={(option) => (option ? `${option.name} - $${option.price}` : '')}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Service"
                    variant="outlined"
                    fullWidth
                  />
                )}
                onChange={(event, newValue) => {
                  setSelectedService(newValue);
                  setCustomPrice(newValue ? newValue.price : '');
                }}
              />
            </Grid>

            {/* Price Text Box */}
            <Grid item xs={4}>
              <TextField
                label="Price"
                variant="outlined"
                fullWidth
                value={customPrice}
                onChange={(e) => setCustomPrice(e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                disabled={!selectedService}
              />
            </Grid>

            {/* Add Button */}
            <Grid item xs={4}>
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
            {productTax > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography>Product Tax</Typography>
                <Typography>${productTax.toFixed(2)}</Typography>
              </Box>
            )}
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              mb: 1,
              fontWeight: 'bold',
              borderTop: 1,
              borderColor: 'divider',
              pt: 1
            }}>
              <Typography fontWeight="bold">Total</Typography>
              <Typography fontWeight="bold">
                ${(subtotal + productTax).toFixed(2)}
              </Typography>
            </Box>
          </Box>

          {/* Payment Section */}
          <Typography variant="subtitle1" gutterBottom>
            Payment
          </Typography>

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
            disabled={cartItems.length === 0 || !paymentMethod || !selectedCustomer}
          >
            COMPLETE SALE
          </Button>
        </Paper>
      </Grid>

      <CustomerModal 
        open={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onCustomerAdded={handleNewCustomer}
      />
    </Grid>
  );
}

export default SalesForm;