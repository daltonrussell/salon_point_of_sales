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



function SalesForm() {
  // Data states
  const [stylists, setStylists] = useState([]);
  const [services, setServices] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [serviceKey, setServiceKey] = useState(0);
  const [productKey, setProductKey] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

   const [taxRate, setTaxRate] = useState(() => {
    const savedRate = localStorage.getItem('taxRate');
    return savedRate ? parseFloat(savedRate) / 100 : 0.08;
  });

  // Selected item states
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedStylist, setSelectedStylist] = useState(null);

  // Add these to your existing state declarations
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productQuantity, setProductQuantity] = useState(1);

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
    loadProducts();
  }, []);

  const loadProducts = async () => {
  try {
    const data = await ipcRenderer.invoke('get-all-inventory');
    setProducts(data);
  } catch (error) {
    console.error('Error loading products:', error);
  }
};


  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'taxRate') {
        setTaxRate(parseFloat(e.newValue) / 100);
      }
    };

    // Listen for changes to localStorage (in case tax rate is updated in settings)
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
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
const addToCart = (type) => {
  if (type === 'service' && selectedService && selectedStylist) {
    const servicePrice = parseFloat(customPrice) || selectedService.price;
    const newItem = {
      id: Date.now(),
      type: 'service',
      service: {
        ...selectedService,
        price: servicePrice,
      },
      stylist: selectedStylist,
      price: servicePrice,
      quantity: 1
    };
    const updatedCart = [...cartItems, newItem];
    setCartItems(updatedCart);
    updateTotals(updatedCart);
    setSelectedService(null);
    setCustomPrice('');
    setServiceKey(prev => prev + 1); // Add this line
  } else if (type === 'product' && selectedProduct) {
    const productPrice = selectedProduct.salePrice * productQuantity;
    const newItem = {
      id: Date.now(),
      type: 'product',
      product: selectedProduct,
      quantity: productQuantity,
      price: productPrice
    };
    const updatedCart = [...cartItems, newItem];
    setCartItems(updatedCart);
    updateTotals(updatedCart);
    setSelectedProduct(null);
    setProductQuantity(1);
    setProductKey(prev => prev + 1); // Add this line
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

    const newProductTax = newProductSubtotal * taxRate;
    
    setSubtotal(newServiceSubtotal + newProductSubtotal);
    setProductTax(newProductTax);
    setServiceTax(0); // Services are not taxed
  };

  const handleCompleteSale = async () => {
  try {
    // Separate cart items into services and products
    const services = cartItems
      .filter(item => item.type === 'service')
      .map(item => ({
        serviceId: item.service.id,
        price: item.service.price,
        quantity: 1
      }));

    const products = cartItems
      .filter(item => item.type === 'product')
      .map(item => ({
        inventoryId: item.product.id,
        price: item.price,
        quantity: item.quantity
      }));

    const saleData = {
      ClientId: selectedCustomer.id,
      StylistId: selectedStylist.id,
      services,     // Send separated services array
      products,     // Send separated products array
      subtotal,
      tax: productTax,
      total: subtotal + productTax,
      paymentMethod
    };

    console.log('Sale Data being sent:', saleData);


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
                  required  // Add this
                />
              )}
              onChange={(event, newValue) => setSelectedStylist(newValue)}
              value={selectedStylist}  // Add this to make it a controlled component
            />
          </Box>
        </Paper>

        {/* Services Section */}
        <Paper sx={{ p: 3, mb: 3 }}>  {/* Added margin bottom */}
          <Typography variant="h6" gutterBottom>
            Services
          </Typography>
          <Grid container spacing={2} alignItems="flex-start">
            {/* Service Dropdown */}
            <Grid item xs={4}>
              <Autocomplete
                key={serviceKey}
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
                onClick={() => addToCart('service')}
                disabled={!selectedService || !selectedStylist}
                fullWidth
                sx={{ height: '56px' }}
              >
                ADD SERVICE
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Products Section */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Products
          </Typography>
          <Grid container spacing={2} alignItems="flex-start">
            {/* Product Dropdown */}
            <Grid item xs={4}>
              <Autocomplete
                key={productKey}
                options={products}
                getOptionLabel={(option) =>
                  option ? `${option.productName} - $${option.salePrice}` : ''
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Product"
                    variant="outlined"
                    fullWidth
                  />
                )}
                onChange={(event, newValue) => setSelectedProduct(newValue)}
                renderOption={(props, option) => (
                  <li {...props}>
                    <div>
                      <Typography>{option.productName}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Stock: {option.quantity} - ${option.salePrice}
                      </Typography>
                    </div>
                  </li>
                )}
              />
            </Grid>

            {/* Quantity Input */}
            <Grid item xs={4}>
              <TextField
                label="Quantity"
                type="number"
                variant="outlined"
                fullWidth
                value={productQuantity}
                onChange={(e) => setProductQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                InputProps={{
                  inputProps: { min: 1, max: selectedProduct?.quantity || 1 }
                }}
                disabled={!selectedProduct}
              />
            </Grid>

            {/* Add Button */}
            <Grid item xs={4}>
              <Button
                variant="contained"
                onClick={() => addToCart('product')}
                disabled={!selectedProduct || productQuantity < 1}
                fullWidth
                sx={{ height: '56px' }}
              >
                ADD PRODUCT
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
                  {item.type === 'service' ? (
                    `${item.service.name} - ${item.stylist.firstName}`
                  ) : (
                    `${item.product.productName} (x${item.quantity})`
                  )}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography>${item.price.toFixed(2)}</Typography>
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
            disabled={
              cartItems.length === 0 ||
              !paymentMethod ||
              !selectedCustomer ||
              !selectedStylist
            }
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