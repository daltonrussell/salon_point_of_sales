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

  // Product Stylist ID from settings
  const [productStylistId, setProductStylistId] = useState(() => {
    return localStorage.getItem("productStylistId") || "";
  });

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
      } else if (e.key === "productStylistId") {
        setProductStylistId(e.newValue || "");
      }
    };

    // Listen for changes to localStorage (in case settings are updated in another tab)
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Add this to prevent form submission on Enter when using barcode scanner
  useEffect(() => {
    const preventSubmit = (e) => {
      // Only prevent Enter in specific contexts
      if (e.key === "Enter") {
        // Allow Enter in these scenarios:
        const allowEnter =
          e.target.tagName === "BUTTON" || // Buttons should use Enter
          e.target.closest(".MuiAutocomplete-root") || // Autocomplete needs Enter
          e.target.closest('[role="listbox"]') || // Dropdown selections
          e.target.closest('[role="combobox"]'); // Input with dropdown

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

  // Helper function to find a stylist by ID
  const findStylistById = (id) => {
    return stylists.find((stylist) => stylist.id === id) || null;
  };

  // Helper functions for sale operations
  const createProductSaleData = (
    productItems,
    clientId,
    stylistId,
    paymentMethod,
    saleDate,
    taxRate,
  ) => {
    const productSubtotal = productItems.reduce(
      (sum, item) => sum + parseFloat(item.price),
      0,
    );
    const productTaxAmount = productSubtotal * taxRate;

    return {
      ClientId: clientId,
      StylistId: stylistId,
      services: [],
      products: productItems.map((item) => ({
        inventoryId: item.product.id,
        price: item.price,
        quantity: item.quantity,
        isBackBar: !!item.isBackBar,
      })),
      subtotal: productSubtotal,
      tax: productTaxAmount,
      total: productSubtotal + productTaxAmount,
      paymentMethod: paymentMethod,
      saleDate: saleDate,
    };
  };

  const createServiceSaleData = (
    serviceItems,
    clientId,
    stylistId,
    paymentMethod,
    saleDate,
  ) => {
    const serviceSubtotal = serviceItems.reduce(
      (sum, item) => sum + parseFloat(item.price),
      0,
    );

    return {
      ClientId: clientId,
      StylistId: stylistId,
      services: serviceItems.map((item) => ({
        serviceId: item.service.id,
        price: item.service.price,
        quantity: 1,
      })),
      products: [],
      subtotal: serviceSubtotal,
      tax: 0, // Services aren't taxed
      total: serviceSubtotal,
      paymentMethod: paymentMethod,
      saleDate: saleDate,
    };
  };

  // Create a consolidated receipt data object that merges service and product data
  const createCombinedReceiptData = (
    serviceItems,
    productItems,
    clientId,
    serviceStylishId,
    productStylistId,
    productStylistName,
    subtotal,
    tax,
    paymentMethod,
    secondaryPaymentMethod = null,
    secondaryPaymentAmount = null,
    saleDate,
  ) => {
    return {
      ClientId: clientId,
      StylistId: serviceStylishId,
      ProductStylistId: productStylistId,
      ProductStylistName: productStylistName,
      services: serviceItems.map((item) => ({
        serviceId: item.service.id,
        price: item.service.price,
        quantity: 1,
        name: item.service.name,
        stylistName: item.stylist
          ? `${item.stylist.firstName} ${item.stylist.lastName}`
          : "",
      })),
      products: productItems.map((item) => ({
        inventoryId: item.product.id,
        price: item.price,
        quantity: item.quantity,
        isBackBar: !!item.isBackBar,
        name: item.product.productName,
      })),
      subtotal,
      tax,
      total: subtotal + tax,
      paymentMethod,
      secondaryPaymentMethod,
      secondaryPaymentAmount,
      saleDate,
      splitPayment: !!secondaryPaymentMethod,
      splitAttribution: true,
    };
  };

  // Handle product-only sales
  const handleProductOnlySale = async (
    productItems,
    clientId,
    productStylistId,
    paymentMethod,
    saleDate,
    taxRate,
  ) => {
    const saleData = createProductSaleData(
      productItems,
      clientId,
      productStylistId,
      paymentMethod,
      saleDate,
      taxRate,
    );

    await ipcRenderer.invoke("create-sale", saleData);
    return saleData;
  };

  // Handle service-only sales
  const handleServiceOnlySale = async (
    serviceItems,
    clientId,
    stylistId,
    paymentMethod,
    saleDate,
  ) => {
    const saleData = createServiceSaleData(
      serviceItems,
      clientId,
      stylistId,
      paymentMethod,
      saleDate,
    );

    await ipcRenderer.invoke("create-sale", saleData);
    return saleData;
  };

  // Handle mixed product and service sales
  const handleMixedSale = async (
    serviceItems,
    productItems,
    clientId,
    stylistId,
    productStylistId,
    paymentMethod,
    saleDate,
    taxRate,
    findStylistById,
  ) => {
    // Create and submit service sale
    if (serviceItems.length > 0) {
      const serviceSaleData = createServiceSaleData(
        serviceItems,
        clientId,
        stylistId,
        paymentMethod,
        saleDate,
      );
      await ipcRenderer.invoke("create-sale", serviceSaleData);
    }

    // Create and submit product sale
    if (productItems.length > 0) {
      const productSaleData = createProductSaleData(
        productItems,
        clientId,
        productStylistId,
        paymentMethod,
        saleDate,
        taxRate,
      );
      await ipcRenderer.invoke("create-sale", productSaleData);
    }

    // Create combined receipt data
    const productStylist = findStylistById(productStylistId);
    const serviceSubtotal = serviceItems.reduce(
      (sum, item) => sum + parseFloat(item.price),
      0,
    );
    const productSubtotal = productItems.reduce(
      (sum, item) => sum + parseFloat(item.price),
      0,
    );
    const productTaxAmount = productSubtotal * taxRate;

    return createCombinedReceiptData(
      serviceItems,
      productItems,
      clientId,
      stylistId,
      productStylistId,
      productStylist
        ? `${productStylist.firstName} ${productStylist.lastName}`
        : "House",
      serviceSubtotal + productSubtotal,
      productTaxAmount,
      paymentMethod,
      null,
      null,
      saleDate,
    );
  };

  // Handle split payment with separate product attribution
  const handleSplitPaymentWithProductAttribution = async (
    serviceItems,
    productItems,
    clientId,
    stylistId,
    productStylistId,
    primaryPaymentMethod,
    secondaryPaymentMethod,
    secondaryPaymentAmount,
    saleDate,
    taxRate,
    findStylistById,
  ) => {
    // Create service sale
    if (serviceItems.length > 0) {
      const serviceSaleData = createServiceSaleData(
        serviceItems,
        clientId,
        stylistId,
        primaryPaymentMethod,
        saleDate,
      );
      await ipcRenderer.invoke("create-sale", serviceSaleData);
    }

    // Create product sale
    if (productItems.length > 0) {
      const productSaleData = createProductSaleData(
        productItems,
        clientId,
        productStylistId,
        secondaryPaymentMethod,
        saleDate,
        taxRate,
      );
      await ipcRenderer.invoke("create-sale", productSaleData);
    }

    // Create combined receipt data
    const productStylist = findStylistById(productStylistId);
    const serviceSubtotal = serviceItems.reduce(
      (sum, item) => sum + parseFloat(item.price),
      0,
    );
    const productSubtotal = productItems.reduce(
      (sum, item) => sum + parseFloat(item.price),
      0,
    );
    const productTaxAmount = productSubtotal * taxRate;

    return createCombinedReceiptData(
      serviceItems,
      productItems,
      clientId,
      stylistId,
      productStylistId,
      productStylist
        ? `${productStylist.firstName} ${productStylist.lastName}`
        : "House",
      serviceSubtotal + productSubtotal,
      productTaxAmount,
      primaryPaymentMethod,
      secondaryPaymentMethod,
      parseFloat(secondaryPaymentAmount),
      saleDate,
    );
  };

  // Handle traditional split payment without separate product attribution
  const handleTraditionalSplitPayment = async (
    cartItems,
    clientId,
    stylistId,
    primaryPaymentMethod,
    secondaryPaymentMethod,
    primaryAmount,
    secondaryAmount,
    saleDate,
    taxRate,
  ) => {
    // Calculate proportion for dividing items
    const totalAmount = primaryAmount + secondaryAmount;
    const primaryRatio = primaryAmount / totalAmount;

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
      if ((runningTotal + item.price) / totalAmount <= primaryRatio) {
        sale1Services.push(item);
        runningTotal += item.price;
      } else {
        sale2Services.push(item);
      }
    }

    // Assign products
    for (const item of products) {
      if ((runningTotal + item.price) / totalAmount <= primaryRatio) {
        sale1Products.push(item);
        runningTotal += item.price;
      } else {
        sale2Products.push(item);
      }
    }

    // Create first sale data
    const sale1ServicesData = sale1Services.map((item) => ({
      serviceId: item.service.id,
      price: item.service.price,
      quantity: 1,
    }));

    const sale1ProductsData = sale1Products.map((item) => ({
      inventoryId: item.product.id,
      price: item.price,
      quantity: item.quantity,
      isBackBar: !!item.isBackBar,
    }));

    const sale1Subtotal = [...sale1Services, ...sale1Products].reduce(
      (sum, item) => sum + item.price,
      0,
    );
    const sale1Tax = sale1Products.reduce(
      (sum, item) => sum + item.price * taxRate,
      0,
    );

    const saleData1 = {
      ClientId: clientId,
      StylistId: stylistId,
      services: sale1ServicesData,
      products: sale1ProductsData,
      subtotal: sale1Subtotal,
      tax: sale1Tax,
      total: sale1Subtotal + sale1Tax,
      paymentMethod: primaryPaymentMethod,
      saleDate: saleDate,
    };

    // Create second sale data
    const sale2ServicesData = sale2Services.map((item) => ({
      serviceId: item.service.id,
      price: item.service.price,
      quantity: 1,
    }));

    const sale2ProductsData = sale2Products.map((item) => ({
      inventoryId: item.product.id,
      price: item.price,
      quantity: item.quantity,
      isBackBar: !!item.isBackBar,
    }));

    const sale2Subtotal = [...sale2Services, ...sale2Products].reduce(
      (sum, item) => sum + item.price,
      0,
    );
    const sale2Tax = sale2Products.reduce(
      (sum, item) => sum + item.price * taxRate,
      0,
    );

    const saleData2 = {
      ClientId: clientId,
      StylistId: stylistId,
      services: sale2ServicesData,
      products: sale2ProductsData,
      subtotal: sale2Subtotal,
      tax: sale2Tax,
      total: sale2Subtotal + sale2Tax,
      paymentMethod: secondaryPaymentMethod,
      saleDate: saleDate,
    };

    // Submit both sales
    await ipcRenderer.invoke("create-sale", saleData1);
    await ipcRenderer.invoke("create-sale", saleData2);

    // Return both sale data objects for receipt
    return [saleData1, saleData2];
  };

  // The main handleCompleteSale function, now simplified with helper functions
  const handleCompleteSale = async () => {
    try {
      // Check what types of items we have in the cart
      const hasBackBarItems = cartItems.some((item) => item.isBackBar);
      const productItems = cartItems.filter((item) => item.type === "product");
      const serviceItems = cartItems.filter((item) => item.type === "service");
      const hasProducts = productItems.some((item) => !item.isBackBar);
      const hasServices = serviceItems.length > 0;

      // Determine if we should use product stylist
      const shouldUseProductStylist = productStylistId && hasProducts;

      // Get client and stylist IDs
      const clientId = selectedCustomer ? selectedCustomer.id : null;
      const stylistId = selectedStylist ? selectedStylist.id : null;

      // Handle different sale types
      let saleResults;

      // 1. PRODUCT-ONLY SALE - Always use product stylist if defined
      if (shouldUseProductStylist && !hasServices) {
        saleResults = await handleProductOnlySale(
          productItems,
          clientId,
          productStylistId,
          paymentMethod || "back-bar",
          saleDate,
          taxRate,
        );
      }
      // 2. MIXED SALE WITHOUT SPLIT PAYMENT - Split attribution between stylists
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
          findStylistById,
        );
      }
      // 3. SERVICE-ONLY SALE or NO PRODUCT STYLIST - Regular single stylist sale
      else if (!splitPayment) {
        if (hasServices && !hasProducts) {
          saleResults = await handleServiceOnlySale(
            serviceItems,
            clientId,
            stylistId,
            paymentMethod,
            saleDate,
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
            tax: productTax,
            total: subtotal + productTax,
            paymentMethod: paymentMethod || "back-bar",
            saleDate: saleDate,
          };

          await ipcRenderer.invoke("create-sale", saleData);
          saleResults = saleData;
        }
      }
      // 4. SPLIT PAYMENT SCENARIOS
      else if (splitPayment) {
        const secondaryAmount = parseFloat(secondaryPayment.amount);

        // Validate split payment amount
        if (
          isNaN(secondaryAmount) ||
          secondaryAmount <= 0 ||
          secondaryAmount >= subtotal + productTax
        ) {
          alert("Please enter a valid amount for the split payment");
          return;
        }

        const primaryAmount = subtotal + productTax - secondaryAmount;

        // Split payment with product stylist
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
        }
        // Traditional split payment
        else {
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

      // Save the completed sale data for receipt printing
      setCompletedSaleData(saleResults);

      // Reset form
      resetForm();

      // For back bar items only, no receipt is needed
      if (hasBackBarItems && cartItems.every((item) => item.isBackBar)) {
        alert("Back bar items recorded successfully!");
      } else {
        // For regular sales, show the receipt dialog
        setShowReceiptDialog(true);
      }
    } catch (error) {
      console.error("Error completing sale:", error);
      alert("Error completing sale");
    }
  };

  // Updated print receipt function to handle a single receipt
  const handlePrintReceipt = async () => {
    try {
      // Get a consolidated receipt data object regardless of structure
      let consolidatedReceiptData;

      if (Array.isArray(completedSaleData)) {
        // For split payments, combine the data into a single receipt
        consolidatedReceiptData = {
          ClientId: completedSaleData[0].ClientId,
          StylistId: completedSaleData[0].StylistId,
          services: completedSaleData.flatMap((sale) => sale.services || []),
          products: completedSaleData.flatMap((sale) => sale.products || []),
          subtotal: completedSaleData.reduce(
            (sum, sale) => sum + sale.subtotal,
            0,
          ),
          tax: completedSaleData.reduce((sum, sale) => sum + sale.tax, 0),
          total: completedSaleData.reduce((sum, sale) => sum + sale.total, 0),
          paymentMethod: completedSaleData
            .map((sale) => sale.paymentMethod)
            .join(" / "),
          saleDate: completedSaleData[0].saleDate,
          // Include payment split information if needed
          splitPayment: true,
          paymentSplits: completedSaleData.map((sale) => ({
            method: sale.paymentMethod,
            amount: sale.total,
          })),
        };
      } else {
        // Already consolidated or single payment
        consolidatedReceiptData = completedSaleData;
      }

      // Print a single receipt
      await ipcRenderer.invoke("print-receipt", {
        saleData: consolidatedReceiptData,
        businessInfo: {
          name: "A New You",
          address: "107 S 2nd St\nIronton, OH 45432",
        },
      });

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
    setServiceKey(Date.now()); // Use timestamp for more reliable reset
    setSelectedProduct(null);
    setProductQuantity(1);
    setDiscountPercent("0");
    setProductKey(Date.now()); // Use timestamp for more reliable reset
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
