/**
 * Refactored SalesForm Component
 * Now uses extracted hooks and components for better maintainability
 */
import React, { useEffect, useState } from "react";
import {
  Box,
  TextField,
  Autocomplete,
  Paper,
  Typography,
  Grid,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import CustomerModal from "../customers/CustomerModal";
import SaleDatePicker from "../Reusable/SaleDatePicker";
import ReceiptGenerator from "../../utils/ReceiptGenerator";

// Import extracted components
import ServicesSection from "./ServicesSection";
import ProductsSection from "./ProductsSection";
import CartSummary from "./CartSummary";
import PaymentSection from "./PaymentSection";

// Import custom hooks
import { useCartManagement } from "../../hooks/useCartManagement";
import { usePaymentManagement, useChangeCalculation } from "../../hooks/usePaymentManagement";
import { useSaleProcessing } from "../../hooks/useSaleProcessing";
import { useSettings } from "../../hooks/useSettings";

const ipc = window.api;

function SalesForm() {
  // Data states
  const [stylists, setStylists] = useState([]);
  const [services, setServices] = useState([]);
  const [luxuryServices, setLuxuryServices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  
  // Form state - saleDate from electron-store is ISO string, convert to Date
  const [saleDateString, setSaleDateString] = useSettings("saleDate", new Date().toISOString());
  const [saleDate, setSaleDate] = useState(() => {
    return saleDateString ? new Date(saleDateString) : new Date();
  });

  // Update electron-store when saleDate changes
  useEffect(() => {
    setSaleDateString(saleDate.toISOString());
  }, [saleDate, setSaleDateString]);
  
  // Selected item states
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedStylist, setSelectedStylist] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedLuxuryService, setSelectedLuxuryService] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  // Service/product form states
  const [serviceType, setServiceType] = useState("regular");
  const [serviceKey, setServiceKey] = useState(0);
  const [luxuryServiceKey, setLuxuryServiceKey] = useState(0);
  const [productKey, setProductKey] = useState(0);
  const [customPrice, setCustomPrice] = useState("");
  const [productQuantity, setProductQuantity] = useState(1);
  const [discountPercent, setDiscountPercent] = useState("0");
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [completedSaleData, setCompletedSaleData] = useState(null);
  
  // Settings from electron-store
  const [productStylistId] = useSettings("productStylistId", "");
  const [taxRateString] = useSettings("taxRate", "8.00");
  const taxRate = parseFloat(taxRateString) / 100;

  // Custom hooks
  const {
    cartItems,
    subtotal,
    productTax,
    serviceTax,
    addToCart,
    addBackBarItem,
    removeFromCart,
    clearCart,
  } = useCartManagement(taxRate);

  const {
    paymentMethod,
    splitPayment,
    secondaryPayment,
    cashTender,
    handlePaymentMethodChange,
    handleCashTenderChange,
    handleSecondaryPaymentChange,
    toggleSplitPayment,
    resetPayment,
  } = usePaymentManagement();

  const changeDue = useChangeCalculation(
    paymentMethod,
    cashTender,
    subtotal,
    productTax,
    serviceTax,
    0 // tipAmount - will be handled separately
  );

  const {
    handleProductOnlySale,
    handleServiceOnlySale,
    handleMixedSale,
    handleSplitPaymentWithProductAttribution,
    handleTraditionalSplitPayment,
  } = useSaleProcessing();

  const [tipAmount, setTipAmount] = useState(0);

  // Load initial data
  useEffect(() => {
    loadStylists();
    loadServices();
    loadAllClients();
    loadProducts();
  }, []);

  // Prevent form submission on Enter when using barcode scanner
  useEffect(() => {
    const preventSubmit = (e) => {
      if (e.key === "Enter") {
        const allowEnter =
          e.target.tagName === "BUTTON" ||
          e.target.closest(".MuiAutocomplete-root") ||
          e.target.closest('[role="listbox"]') ||
          e.target.closest('[role="combobox"]');

        if (!allowEnter) {
          e.preventDefault();
        }
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
      const data = await ipc.invoke("get-stylists", "active");
      setStylists(data);
    } catch (error) {
      console.error("Error loading stylists:", error);
    }
  };

  const loadServices = async () => {
    try {
      const data = await ipc.invoke("get-services", "active");
      setServices(data.filter((service) => !service.luxury));
      setLuxuryServices(data.filter((service) => service.luxury));
    } catch (error) {
      console.error("Error loading services:", error);
    }
  };

  const loadAllClients = async () => {
    try {
      const data = await ipc.invoke("get-all-clients");
      setCustomers(data);
    } catch (error) {
      console.error("Error loading clients:", error);
    }
  };

  const loadProducts = async () => {
    try {
      const data = await ipc.invoke("get-all-inventory");
      setProducts(data);
    } catch (error) {
      console.error("Error loading products:", error);
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

  // Helper function to find a stylist by ID
  const findStylistById = (id) => {
    return stylists.find((stylist) => stylist.id === id) || null;
  };

  // Service handlers
  const handleServiceTypeChange = (newValue) => {
    setServiceType(newValue);
    setSelectedService(null);
    setSelectedLuxuryService(null);
    setCustomPrice("");
  };

  const handleServiceSelect = (newValue) => {
    setSelectedService(newValue);
    setCustomPrice(newValue ? newValue.price : "");
  };

  const handleLuxuryServiceSelect = (newValue) => {
    setSelectedLuxuryService(newValue);
    setCustomPrice(newValue ? newValue.price : "");
  };

  const handleAddService = () => {
    const isLuxury = serviceType === "luxury";
    const service = isLuxury ? selectedLuxuryService : selectedService;

    if (service && selectedStylist) {
      addToCart("service", {
        service,
        stylist: selectedStylist,
        isLuxury,
        customPrice,
      });

      setSelectedService(null);
      setSelectedLuxuryService(null);
      setCustomPrice("");
      setServiceKey((prev) => prev + 1);
      setLuxuryServiceKey((prev) => prev + 1);
    }
  };

  // Product handlers
  const handleProductSelect = (newValue) => {
    setSelectedProduct(newValue);
  };

  const handleQuantityChange = (quantity) => {
    setProductQuantity(quantity);
  };

  const handleDiscountChange = (discount) => {
    setDiscountPercent(discount);
  };

  const handleAddProduct = () => {
    if (selectedProduct) {
      addToCart("product", {
        product: selectedProduct,
        quantity: productQuantity,
        discountPercent,
      });

      setSelectedProduct(null);
      setProductQuantity(1);
      setDiscountPercent("0");
      setProductKey((prev) => prev + 1);
    }
  };

  const handleAddBackBar = () => {
    if (selectedProduct) {
      addBackBarItem(selectedProduct, productQuantity);
      setSelectedProduct(null);
      setProductQuantity(1);
      setDiscountPercent("0");
      setProductKey((prev) => prev + 1);
    }
  };

  // Sale completion logic
  const handleCompleteSale = async () => {
    if (window.saleInProgress) {
      console.log("Sale already in progress, ignoring duplicate submission");
      return;
    }

    window.saleInProgress = true;

    try {
      const hasBackBarItems = cartItems.some((item) => item.isBackBar);
      const productItems = cartItems.filter((item) => item.type === "product");
      const serviceItems = cartItems.filter((item) => item.type === "service");
      const hasProducts = productItems.some((item) => !item.isBackBar);
      const hasServices = serviceItems.length > 0;

      const shouldUseProductStylist = productStylistId && hasProducts;
      const clientId = selectedCustomer ? selectedCustomer.id : null;
      const stylistId = selectedStylist ? selectedStylist.id : null;

      let saleResults;

      // 1. PRODUCT-ONLY SALE
      if (shouldUseProductStylist && !hasServices) {
        saleResults = await handleProductOnlySale(
          productItems,
          clientId,
          productStylistId,
          paymentMethod || "back-bar",
          saleDate,
          taxRate,
          tipAmount,
        );
      }
      // 2. MIXED SALE WITHOUT SPLIT PAYMENT
      else if (shouldUseProductStylist && hasServices && !splitPayment) {
        saleResults = await handleMixedSale(
          serviceItems,
          productItems,
          clientId,
          stylistId,
          productStylistId,
          paymentMethod,
          saleDate,
          taxRate,
          serviceTax,
          findStylistById,
        );
      }
      // 3. SERVICE-ONLY SALE or NO PRODUCT STYLIST
      else if (!splitPayment) {
        if (hasServices && !hasProducts) {
          saleResults = await handleServiceOnlySale(
            serviceItems,
            clientId,
            stylistId,
            paymentMethod,
            saleDate,
            serviceTax,
            tipAmount,
          );
        } else {
          // Combined service and product sale (no product stylist defined)
          const servicesData = serviceItems.map((item) => ({
            serviceId: item.service.id,
            price: item.service.price,
            quantity: 1,
          }));

          const productsData = productItems.map((item) => ({
            inventoryId: item.product.id,
            price: item.price,
            quantity: item.quantity,
            isBackBar: !!item.isBackBar,
          }));

          const saleData = {
            ClientId: clientId,
            StylistId: stylistId,
            services: servicesData,
            products: productsData,
            subtotal,
            tax: productTax + serviceTax,
            tip: tipAmount,
            total: subtotal + productTax + serviceTax + tipAmount,
            paymentMethod: paymentMethod || "back-bar",
            saleDate: saleDate,
          };

          await ipc.invoke("create-sale", saleData);
          saleResults = saleData;
        }
      }
      // 4. SPLIT PAYMENT SCENARIOS
      else if (splitPayment) {
        const secondaryAmount = parseFloat(secondaryPayment.amount);

        if (
          isNaN(secondaryAmount) ||
          secondaryAmount <= 0 ||
          secondaryAmount >= subtotal + productTax + serviceTax + tipAmount
        ) {
          alert("Please enter a valid amount for the split payment");
          return;
        }

        const primaryAmount = subtotal + productTax + serviceTax + tipAmount - secondaryAmount;

        if (shouldUseProductStylist) {
          saleResults = await handleSplitPaymentWithProductAttribution(
            serviceItems,
            productItems,
            clientId,
            stylistId,
            productStylistId,
            paymentMethod,
            secondaryPayment.method,
            secondaryPayment.amount,
            saleDate,
            taxRate,
            findStylistById,
          );
        } else {
          saleResults = await handleTraditionalSplitPayment(
            cartItems,
            clientId,
            stylistId,
            paymentMethod,
            secondaryPayment.method,
            primaryAmount,
            secondaryAmount,
            saleDate,
            taxRate,
          );
        }
      }

      // Save completed sale data for receipt printing
      if (saleResults && selectedCustomer) {
        if (Array.isArray(saleResults)) {
          saleResults.forEach((sale) => {
            sale.clientName = `${selectedCustomer.firstName} ${selectedCustomer.lastName}`;
          });
        } else {
          saleResults.clientName = `${selectedCustomer.firstName} ${selectedCustomer.lastName}`;
        }
      }

      setCompletedSaleData(saleResults);
      resetForm();

      if (hasBackBarItems && cartItems.every((item) => item.isBackBar)) {
        alert("Back bar items recorded successfully!");
      } else {
        setShowReceiptDialog(true);
      }
    } catch (error) {
      console.error("Error completing sale:", error);
      alert("Error completing sale: " + error.message);
    } finally {
      window.saleInProgress = false;
    }
  };

  const resetForm = () => {
    clearCart();
    setSelectedCustomer(null);
    setSelectedStylist(null);
    setSelectedService(null);
    setCustomPrice("");
    setServiceKey(Date.now());
    setSelectedProduct(null);
    setProductQuantity(1);
    setDiscountPercent("0");
    setProductKey(Date.now());
    setTipAmount(0);
    resetPayment();
  };

  // Receipt printing
  const handlePrintReceipt = () => {
    try {
      let consolidatedReceiptData;
      if (Array.isArray(completedSaleData)) {
        consolidatedReceiptData = {
          ClientId: completedSaleData[0].ClientId,
          services: completedSaleData.flatMap((sale) => sale.services || []),
          products: completedSaleData.flatMap((sale) => sale.products || []),
          subtotal: completedSaleData.reduce(
            (sum, sale) => sum + sale.subtotal,
            0,
          ),
          tax: completedSaleData.reduce((sum, sale) => sum + sale.tax, 0),
          total: completedSaleData.reduce((sum, sale) => sum + sale.total, 0),
          paymentMethod: completedSaleData[0].paymentMethod,
          secondaryPaymentMethod: completedSaleData[1].paymentMethod,
          saleDate: completedSaleData[0].saleDate,
          splitPayment: true,
          paymentSplits: completedSaleData.map((sale) => ({
            method: sale.paymentMethod,
            amount: sale.total,
          })),
        };
      } else {
        consolidatedReceiptData = completedSaleData;
      }

      if (consolidatedReceiptData.ClientId) {
        const client = customers.find(
          (c) => c.id === consolidatedReceiptData.ClientId,
        );
        if (client) {
          consolidatedReceiptData.clientName = `${client.firstName} ${client.lastName}`;
        }
      }

      const businessInfo = {
        name: "A New You",
        address: "107 S 2nd St\nIronton, OH 45432",
      };

      const printWindow = window.open("", "_blank");
      const receiptContent = ReceiptGenerator.generatePdfContent(
        consolidatedReceiptData,
        businessInfo,
      );

      const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt - A New You</title>
          <style>
            body { 
              font-family: 'Courier New', monospace;
              font-size: 16px;
              padding: 20px;
              max-width: 80mm;
              margin: 0 auto;
            }
          </style>
        </head>
        <body>
          ${receiptContent}
          <div class="no-print" style="margin-top: 20px; text-align: center;">
            <button onclick="window.print()">Print Receipt</button>
          </div>
          <script>
            setTimeout(function() {
              window.print();
            }, 500);
          </script>
        </body>
      </html>
    `;

      printWindow.document.write(htmlContent);
      printWindow.document.close();
      setShowReceiptDialog(false);
    } catch (error) {
      console.error("Receipt printing error:", error);
      alert(
        "Sale completed successfully, but there was an error displaying the receipt.",
      );
      setShowReceiptDialog(false);
    }
  };

  // Calculate if complete sale button should be disabled
  const isCompleteSaleDisabled = 
    cartItems.length === 0 ||
    (!cartItems.some((item) => item.isBackBar) &&
      (!selectedCustomer ||
        !selectedStylist ||
        !paymentMethod ||
        (splitPayment &&
          (!secondaryPayment.method ||
            !secondaryPayment.amount ||
            isNaN(parseFloat(secondaryPayment.amount)) ||
            parseFloat(secondaryPayment.amount) <= 0 ||
            parseFloat(secondaryPayment.amount) >=
              subtotal + productTax + serviceTax + tipAmount))));

  return (
    <Grid container spacing={3}>
      {/* Left Section */}
      <Grid item xs={8}>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Sale Information
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {/* Date and Stylist Row */}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <SaleDatePicker
                  initialDate={saleDate}
                  onDateChange={(date) => setSaleDate(date)}
                />
              </Grid>
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
                options={[
                  ...new Map(
                    customers.map((client) => [
                      `${client.lastName.toLowerCase()},${client.firstName.toLowerCase()}`,
                      client,
                    ]),
                  ).values(),
                ]}
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
        <ServicesSection
          services={services}
          luxuryServices={luxuryServices}
          selectedService={selectedService}
          selectedLuxuryService={selectedLuxuryService}
          selectedStylist={selectedStylist}
          customPrice={customPrice}
          serviceType={serviceType}
          serviceKey={serviceKey}
          luxuryServiceKey={luxuryServiceKey}
          onServiceTypeChange={handleServiceTypeChange}
          onServiceSelect={handleServiceSelect}
          onLuxuryServiceSelect={handleLuxuryServiceSelect}
          onCustomPriceChange={setCustomPrice}
          onAddService={handleAddService}
        />

        {/* Products Section */}
        <ProductsSection
          products={products}
          selectedProduct={selectedProduct}
          productQuantity={productQuantity}
          discountPercent={discountPercent}
          productKey={productKey}
          onProductSelect={handleProductSelect}
          onQuantityChange={handleQuantityChange}
          onDiscountChange={handleDiscountChange}
          onAddProduct={handleAddProduct}
          onAddBackBar={handleAddBackBar}
        />
      </Grid>

      {/* Right Section - Cart Summary */}
      <Grid item xs={4}>
        <CartSummary
          cartItems={cartItems}
          subtotal={subtotal}
          productTax={productTax}
          serviceTax={serviceTax}
          tipAmount={tipAmount}
          onTipChange={setTipAmount}
          onRemoveItem={removeFromCart}
        />

        <PaymentSection
          paymentMethod={paymentMethod}
          splitPayment={splitPayment}
          secondaryPayment={secondaryPayment}
          cashTender={cashTender}
          changeDue={changeDue}
          subtotal={subtotal}
          productTax={productTax}
          serviceTax={serviceTax}
          tipAmount={tipAmount}
          onPaymentMethodChange={handlePaymentMethodChange}
          onSplitPaymentToggle={toggleSplitPayment}
          onSecondaryPaymentChange={handleSecondaryPaymentChange}
          onCashTenderChange={handleCashTenderChange}
          onCompleteSale={handleCompleteSale}
          isDisabled={isCompleteSaleDisabled}
        />
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
