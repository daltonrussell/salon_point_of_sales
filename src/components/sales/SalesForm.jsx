import React, { useEffect, useState } from "react";
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
  FormControlLabel,
  Checkbox,
  Divider,
  Tab,
  Tooltip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import CustomerModal from "../customers/CustomerModal";
import SaleDatePicker from "../Reusable/SaleDatePicker";

const { ipcRenderer } = window.require("electron");

const paymentMethods = ["Cash", "Credit Card", "Debit Card", "Check"];

function SalesForm() {
  // Data states
  const [stylists, setStylists] = useState([]);
  const [services, setServices] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [saleDate, setSaleDate] = useState(new Date());
  const [serviceKey, setServiceKey] = useState(0);
  const [productKey, setProductKey] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [completedSaleData, setCompletedSaleData] = useState(null);
  const [splitPayment, setSplitPayment] = useState(false);
  const [secondaryPayment, setSecondaryPayment] = useState({
    method: "",
    amount: "",
  });

  const [cashTender, setCashTender] = useState("");
  const [changeDue, setChangeDue] = useState(0);

  const [taxRate, setTaxRate] = useState(() => {
    const savedRate = localStorage.getItem("taxRate");
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
  const [discountPercent, setDiscountPercent] = useState("0");

  // Payment states
  const [subtotal, setSubtotal] = useState(0);
  const [productTax, setProductTax] = useState(0);
  const [serviceTax, setServiceTax] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [customPrice, setCustomPrice] = useState("");

  // Load initial data
  useEffect(() => {
    loadStylists();
    loadServices();
    loadAllClients();
    loadProducts();
  }, []);

  useEffect(() => {
    if (paymentMethod === "Cash" && cashTender) {
      const tenderAmount = parseFloat(cashTender);
      const total = subtotal + productTax;
      if (!isNaN(tenderAmount) && tenderAmount >= total) {
        setChangeDue(tenderAmount - total);
      } else {
        setChangeDue(0);
      }
    } else {
      setChangeDue(0);
    }
  }, [cashTender, subtotal, productTax, paymentMethod]);

  const loadProducts = async () => {
    try {
      const data = await ipcRenderer.invoke("get-all-inventory");
      setProducts(data);
    } catch (error) {
      console.error("Error loading products:", error);
    }
  };

  const handlePaymentMethodChange = (event) => {
    const method = event.target.value;
    setPaymentMethod(method);

    // Reset cash tender amount if switching away from cash
    if (method !== "Cash") {
      setCashTender("");
      setChangeDue(0);
    }
  };

  const handleCashTenderChange = (event) => {
    const value = event.target.value;
    setCashTender(value);
  };

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "taxRate") {
        setTaxRate(parseFloat(e.newValue) / 100);
      }
    };

    // Listen for changes to localStorage (in case tax rate is updated in settings)
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Add this to prevent form submission on Enter when using barcode scanner
  useEffect(() => {
    const preventSubmit = (e) => {
      if (e.key === "Enter" && e.target.tagName !== "BUTTON") {
        e.preventDefault();
      }
    };

    window.addEventListener("keydown", preventSubmit);

    return () => {
      window.removeEventListener("keydown", preventSubmit);
    };
  }, []);

  // Data loading functions
  const loadStylists = async () => {
    try {
      const data = await ipcRenderer.invoke("get-stylists", "active");
      setStylists(data);
    } catch (error) {
      console.error("Error loading stylists:", error);
    }
  };

  const handleSecondaryPaymentChange = (field, value) => {
    setSecondaryPayment({
      ...secondaryPayment,
      [field]: value,
    });
  };

  const loadServices = async () => {
    try {
      // Get only active services for the sales form
      const data = await ipcRenderer.invoke("get-services", "active");
      setServices(data);
    } catch (error) {
      console.error("Error loading services:", error);
    }
  };

  const loadAllClients = async () => {
    try {
      const data = await ipcRenderer.invoke("get-all-clients");
      setCustomers(data);
    } catch (error) {
      console.error("Error loading clients:", error);
    }
  };

  const handleNewCustomer = (newCustomer) => {
    if (!newCustomer || !newCustomer.lastName || !newCustomer.firstName) {
      console.error("Invalid customer data:", newCustomer);
      return;
    }

    setCustomers((prev) =>
      [...prev.filter((c) => c && c.lastName && c.firstName), newCustomer].sort(
        (a, b) => {
          if (!a || !b) return 0;
          const lastNameCompare = a.lastName.localeCompare(b.lastName);
          return lastNameCompare || a.firstName.localeCompare(b.firstName);
        },
      ),
    );
    setSelectedCustomer(newCustomer);
  };

  // Handle back bar button
  const handleBackBar = () => {
    if (selectedProduct) {
      // Add product to cart with zero price (back bar usage)
      const newItem = {
        id: Date.now(),
        type: "product",
        product: selectedProduct,
        quantity: productQuantity,
        price: 0,
        isBackBar: true,
      };
      const updatedCart = [...cartItems, newItem];
      setCartItems(updatedCart);
      updateTotals(updatedCart);
      setSelectedProduct(null);
      setProductQuantity(1);
      setDiscountPercent("0");
      setProductKey((prev) => prev + 1);
    }
  };

  // Cart management
  const addToCart = (type) => {
    if (type === "service" && selectedService && selectedStylist) {
      const servicePrice = parseFloat(customPrice) || selectedService.price;
      const newItem = {
        id: Date.now(),
        type: "service",
        service: {
          ...selectedService,
          price: servicePrice,
        },
        stylist: selectedStylist,
        price: servicePrice,
        quantity: 1,
      };
      const updatedCart = [...cartItems, newItem];
      setCartItems(updatedCart);
      updateTotals(updatedCart);
      setSelectedService(null);
      setCustomPrice("");
      setServiceKey((prev) => prev + 1); // Add this line
    } else if (type === "product" && selectedProduct) {
      // Calculate discounted price
      const discountMultiplier = 1 - parseFloat(discountPercent) / 100;
      const originalPrice = selectedProduct.salePrice * productQuantity;
      const discountedPrice = originalPrice * discountMultiplier;

      const newItem = {
        id: Date.now(),
        type: "product",
        product: selectedProduct,
        quantity: productQuantity,
        originalPrice: originalPrice,
        discountPercent: parseFloat(discountPercent),
        price: parseFloat(discountedPrice.toFixed(2)),
      };
      const updatedCart = [...cartItems, newItem];
      setCartItems(updatedCart);
      updateTotals(updatedCart);
      setSelectedProduct(null);
      setProductQuantity(1);
      setDiscountPercent("0");
      setProductKey((prev) => prev + 1); // Add this line
    }
  };

  const removeFromCart = (itemId) => {
    const updatedCart = cartItems.filter((item) => item.id !== itemId);
    setCartItems(updatedCart);
    updateTotals(updatedCart);
  };

  // Payment calculations
  const updateTotals = (items) => {
    let newServiceSubtotal = 0;
    let newProductSubtotal = 0;

    items.forEach((item) => {
      if (item.type === "service") {
        newServiceSubtotal += parseFloat(item.service.price);
      } else if (item.type === "product") {
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
      // Check if this sale contains any back bar items
      const hasBackBarItems = cartItems.some((item) => item.isBackBar);

      if (!splitPayment) {
        // Regular single payment sale
        const services = cartItems
          .filter((item) => item.type === "service")
          .map((item) => ({
            serviceId: item.service.id,
            price: item.service.price,
            quantity: 1,
          }));

        const products = cartItems
          .filter((item) => item.type === "product")
          .map((item) => ({
            inventoryId: item.product.id,
            price: item.price,
            quantity: item.quantity,
            isBackBar: !!item.isBackBar,
          }));

        const saleData = {
          ClientId: selectedCustomer ? selectedCustomer.id : null,
          StylistId: selectedStylist ? selectedStylist.id : null,
          services,
          products,
          subtotal,
          tax: productTax,
          total: subtotal + productTax,
          paymentMethod: paymentMethod || "back-bar",
          saleDate: saleDate,
        };

        console.log("Sale Data being sent:", saleData);

        await ipcRenderer.invoke("create-sale", saleData);

        // Reset form
        resetForm();

        // For back bar items, no receipt is needed
        if (hasBackBarItems) {
          alert("Back bar items recorded successfully!");
        } else {
          // For regular sales, show the receipt dialog
          setCompletedSaleData(saleData);
          setShowReceiptDialog(true);
        }
      } else {
        // Split payment sale - create two separate sales
        const secondaryAmount = parseFloat(secondaryPayment.amount);

        if (
          isNaN(secondaryAmount) ||
          secondaryAmount <= 0 ||
          secondaryAmount >= subtotal + productTax
        ) {
          alert("Please enter a valid amount for the split payment");
          return;
        }

        const primaryAmount = subtotal + productTax - secondaryAmount;

        // Calculate proportion for dividing items
        const primaryRatio = primaryAmount / (subtotal + productTax);

        // Split services and products into two groups
        const services = cartItems.filter((item) => item.type === "service");
        const products = cartItems.filter((item) => item.type === "product");

        let sale1Services = [];
        let sale1Products = [];
        let sale2Services = [];
        let sale2Products = [];

        let runningTotal = 0;

        // Assign services
        for (const item of services) {
          if (
            (runningTotal + item.price) / (subtotal + productTax) <=
            primaryRatio
          ) {
            sale1Services.push(item);
            runningTotal += item.price;
          } else {
            sale2Services.push(item);
          }
        }

        // Assign products
        for (const item of products) {
          if (
            (runningTotal + item.price) / (subtotal + productTax) <=
            primaryRatio
          ) {
            sale1Products.push(item);
            runningTotal += item.price;
          } else {
            sale2Products.push(item);
          }
        }

        // Create first sale
        const saleData1 = createSaleDataObject(
          sale1Services,
          sale1Products,
          primaryAmount,
          paymentMethod,
        );

        // Create second sale
        const saleData2 = createSaleDataObject(
          sale2Services,
          sale2Products,
          secondaryAmount,
          secondaryPayment.method,
        );

        // Submit both sales
        await ipcRenderer.invoke("create-sale", saleData1);
        await ipcRenderer.invoke("create-sale", saleData2);

        // Reset form
        resetForm();

        // Back bar items don't need receipts
        if (hasBackBarItems) {
          alert("Back bar items recorded successfully!");
        } else {
          // Show receipt dialog for both sales
          setCompletedSaleData([saleData1, saleData2]);
          setShowReceiptDialog(true);
        }
      }
    } catch (error) {
      console.error("Error completing sale:", error);
      alert("Error completing sale");
    }
  };
  const createSaleDataObject = (services, products, amount, paymentMethod) => {
    const servicesData = services.map((item) => ({
      serviceId: item.service.id,
      price: item.service.price,
      quantity: 1,
    }));

    const productsData = products.map((item) => ({
      inventoryId: item.product.id,
      price: item.price,
      quantity: item.quantity,
      isBackBar: !!item.isBackBar,
    }));

    const subtotalAmount = [...services, ...products].reduce(
      (sum, item) => sum + item.price,
      0,
    );
    const taxAmount = products.reduce(
      (sum, item) => sum + item.price * taxRate,
      0,
    );

    return {
      ClientId: selectedCustomer ? selectedCustomer.id : null,
      StylistId: selectedStylist ? selectedStylist.id : null,
      services: servicesData,
      products: productsData,
      subtotal: subtotalAmount,
      tax: taxAmount,
      total: subtotalAmount + taxAmount,
      paymentMethod: paymentMethod,
      saleDate: saleDate,
    };
  };

  const resetForm = () => {
    // Reset form immediately after successful sale
    setCartItems([]);
    setSelectedCustomer(null);
    setSelectedStylist(null);
    setPaymentMethod("");
    setSelectedService(null);
    setCustomPrice("");
    setServiceKey((prev) => prev + 1);
    setSelectedProduct(null);
    setProductQuantity(1);
    setDiscountPercent("0");
    setProductKey((prev) => prev + 1);
    setSplitPayment(false);
    setSaleDate(new Date()); // Reset to current date

    setSecondaryPayment({
      method: "",
      amount: "",
    });

    setSubtotal(0);
    setProductTax(0);
    setServiceTax(0);

    setCashTender("");
    setChangeDue(0);
  };

  const handlePrintReceipt = async () => {
    try {
      if (Array.isArray(completedSaleData)) {
        // For split payments, print both receipts
        for (const saleData of completedSaleData) {
          await ipcRenderer.invoke("print-receipt", {
            saleData,
            businessInfo: {
              name: "A New You",
              address: "107 S 2nd St\nIronton, OH 45432",
            },
          });
        }
      } else {
        // Single payment, print one receipt
        await ipcRenderer.invoke("print-receipt", {
          saleData: completedSaleData,
          businessInfo: {
            name: "A New You",
            address: "107 S 2nd St\nIronton, OH 45432",
          },
        });
      }

      setShowReceiptDialog(false);
      alert("Sale completed successfully!");
    } catch (error) {
      console.error("Receipt printer error:", error);
      alert(
        "Sale completed successfully, but receipt could not be printed. Please check printer connection.",
      );
      setShowReceiptDialog(false);
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
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {/* Date and Stylist Row - Grid container to place them side by side */}
            <Grid container spacing={2}>
              {/* Sale Date Selection - Takes up half the width */}
              <Grid item xs={12} sm={6}>
                <SaleDatePicker
                  initialDate={saleDate}
                  onDateChange={(date) => setSaleDate(date)}
                />
              </Grid>

              {/* Stylist Selection - Takes up half the width */}
              <Grid item xs={12} sm={6}>
                <Autocomplete
                  options={stylists}
                  getOptionLabel={(option) =>
                    option ? `${option.firstName} ${option.lastName}` : ""
                  }
                  isOptionEqualToValue={(option, value) =>
                    option?.id === value?.id
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Stylist"
                      variant="outlined"
                      fullWidth
                      required
                    />
                  )}
                  onChange={(event, newValue) => setSelectedStylist(newValue)}
                  value={selectedStylist}
                />
              </Grid>
            </Grid>

            {/* Customer Selection */}
            <Box sx={{ display: "flex", gap: 1 }}>
              <Autocomplete
                sx={{ flex: 1 }}
                options={customers}
                getOptionLabel={(option) =>
                  option ? `${option.lastName}, ${option.firstName}` : ""
                }
                isOptionEqualToValue={(option, value) =>
                  option?.id === value?.id
                }
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
                sx={{ minWidth: "auto", px: 2 }}
              >
                +
              </Button>
            </Box>
          </Box>
        </Paper>

        {/* Services Section */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Services
          </Typography>
          <Grid container spacing={2} alignItems="flex-start">
            {/* Service Dropdown */}
            <Grid item xs={4}>
              <Autocomplete
                key={serviceKey}
                options={services}
                getOptionLabel={(option) =>
                  option ? `${option.name} - $${option.price}` : ""
                }
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
                  setCustomPrice(newValue ? newValue.price : "");
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
                  startAdornment: (
                    <InputAdornment position="start">$</InputAdornment>
                  ),
                }}
                disabled={!selectedService}
              />
            </Grid>

            {/* Add Button */}
            <Grid item xs={4}>
              <Button
                variant="contained"
                onClick={() => addToCart("service")}
                disabled={!selectedService || !selectedStylist}
                fullWidth
                sx={{ height: "56px" }}
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
            <Grid item xs={8}>
              <Autocomplete
                key={productKey}
                options={products}
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
                onChange={(event, newValue) => setSelectedProduct(newValue)}
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
                onClick={() => addToCart("product")}
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
                  setProductQuantity(Math.max(1, parseInt(e.target.value) || 1))
                }
                InputProps={{
                  inputProps: { min: 1, max: selectedProduct?.quantity || 1 },
                }}
                disabled={!selectedProduct}
              />
            </Grid>

            {/* New Row for Discount and Back Bar */}
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
                  setDiscountPercent(value.toString());
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

            <Grid item xs={4}>
              <Tooltip title="Mark product as used in salon (not for sale)">
                <span>
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={handleBackBar}
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
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 1,
                }}
              >
                <Typography>
                  {item.type === "service" ? (
                    `${item.service.name} - ${item.stylist.firstName}`
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

          <FormControlLabel
            control={
              <Checkbox
                checked={splitPayment}
                onChange={(e) => {
                  setSplitPayment(e.target.checked);
                  if (!e.target.checked) {
                    setSecondaryPayment({ method: "", amount: "" });
                  }
                }}
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
                  onChange={handlePaymentMethodChange}
                >
                  {paymentMethods.map((method) => (
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
                        onChange={handleCashTenderChange}
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
                      productTax -
                      parseFloat(secondaryPayment.amount)
                    ).toFixed(2)
                  : (subtotal + productTax).toFixed(2)}
              </Typography>

              <Box sx={{ mb: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>First Payment Method</InputLabel>
                  <Select
                    value={paymentMethod}
                    label="First Payment Method"
                    onChange={handlePaymentMethodChange}
                  >
                    {paymentMethods.map((method) => (
                      <MenuItem key={method} value={method}>
                        {method}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Cash tender fields for split payment's first payment */}
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
                        handleSecondaryPaymentChange("method", e.target.value)
                      }
                    >
                      {paymentMethods.map((method) => (
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
                      handleSecondaryPaymentChange("amount", e.target.value)
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
            onClick={handleCompleteSale}
            disabled={
              cartItems.length === 0 ||
              (!cartItems.some((item) => item.isBackBar) && // <-- If NO back bar items, AND missing requirements, THEN disable
                (!selectedCustomer ||
                  !selectedStylist ||
                  !paymentMethod ||
                  (splitPayment &&
                    (!secondaryPayment.method ||
                      !secondaryPayment.amount ||
                      isNaN(parseFloat(secondaryPayment.amount)) ||
                      parseFloat(secondaryPayment.amount) <= 0 ||
                      parseFloat(secondaryPayment.amount) >=
                        subtotal + productTax))))
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
      <Dialog
        open={showReceiptDialog}
        onClose={() => setShowReceiptDialog(false)}
      >
        <DialogTitle>Print Receipt?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {Array.isArray(completedSaleData)
              ? "Would you like to print receipts for both payments?"
              : "Would you like to print a receipt for this sale?"}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowReceiptDialog(false)}>No</Button>
          <Button onClick={handlePrintReceipt} variant="contained">
            {Array.isArray(completedSaleData)
              ? "Yes, Print Both Receipts"
              : "Yes, Print Receipt"}
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
}

export default SalesForm;
