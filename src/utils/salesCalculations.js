/**
 * Utility functions for sales calculations and tax logic
 * Extracted from SalesForm.jsx to make them testable and reusable
 */

/**
 * Calculate subtotals for different item types
 * @param {Array} items - Array of cart items
 * @returns {Object} Object containing serviceSubtotal, luxuryServiceSubtotal, productSubtotal
 */
export const calculateSubtotals = (items) => {
  let serviceSubtotal = 0;
  let luxuryServiceSubtotal = 0;
  let productSubtotal = 0;

  items.forEach((item) => {
    if (item.type === "service") {
      if (item.isLuxury) {
        luxuryServiceSubtotal += parseFloat(item.service.price);
      } else {
        serviceSubtotal += parseFloat(item.service.price);
      }
    } else if (item.type === "product") {
      productSubtotal += parseFloat(item.price);
    }
  });

  return {
    serviceSubtotal,
    luxuryServiceSubtotal,
    productSubtotal,
  };
};

/**
 * Calculate taxes for products and luxury services
 * @param {number} productSubtotal - Subtotal for products
 * @param {number} luxuryServiceSubtotal - Subtotal for luxury services
 * @param {number} taxRate - Tax rate as decimal (e.g., 0.08 for 8%)
 * @returns {Object} Object containing productTax and luxuryServiceTax
 */
export const calculateTaxes = (productSubtotal, luxuryServiceSubtotal, taxRate) => {
  // Use proper rounding to avoid floating-point precision issues
  const productTax = Math.round((productSubtotal * taxRate) * 100) / 100;
  const luxuryServiceTax = Math.round((luxuryServiceSubtotal * taxRate) * 100) / 100;

  return {
    productTax,
    luxuryServiceTax,
  };
};

/**
 * Calculate total amounts including taxes and tips
 * @param {Object} subtotals - Object from calculateSubtotals
 * @param {Object} taxes - Object from calculateTaxes
 * @param {number} tipAmount - Tip amount
 * @returns {Object} Object containing totalSubtotal, totalTax, finalTotal
 */
export const calculateTotals = (subtotals, taxes, tipAmount = 0) => {
  const { serviceSubtotal, luxuryServiceSubtotal, productSubtotal } = subtotals;
  const { productTax, luxuryServiceTax } = taxes;

  const totalSubtotal = serviceSubtotal + luxuryServiceSubtotal + productSubtotal;
  const totalTax = productTax + luxuryServiceTax;
  const finalTotal = totalSubtotal + totalTax + tipAmount;

  return {
    totalSubtotal,
    totalTax,
    finalTotal,
  };
};

/**
 * Calculate discounted price for a product
 * @param {number} originalPrice - Original price of the product
 * @param {number} discountPercent - Discount percentage (0-100)
 * @returns {number} Discounted price
 */
export const calculateDiscountedPrice = (originalPrice, discountPercent) => {
  const discountMultiplier = 1 - parseFloat(discountPercent) / 100;
  return parseFloat((originalPrice * discountMultiplier).toFixed(2));
};

/**
 * Create product sale data object
 * @param {Array} productItems - Array of product items
 * @param {number} clientId - Client ID
 * @param {number} stylistId - Stylist ID
 * @param {string} paymentMethod - Payment method
 * @param {Date} saleDate - Sale date
 * @param {number} taxRate - Tax rate as decimal
 * @param {number} tipAmount - Tip amount
 * @returns {Object} Product sale data object
 */
export const createProductSaleData = (
  productItems,
  clientId,
  stylistId,
  paymentMethod,
  saleDate,
  taxRate,
  tipAmount = 0,
) => {
  const productSubtotal = productItems.reduce(
    (sum, item) => sum + parseFloat(item.price),
    0,
  );
  const productTaxAmount = Math.round((productSubtotal * taxRate) * 100) / 100;

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
    tip: tipAmount,
    total: productSubtotal + productTaxAmount + tipAmount,
    paymentMethod: paymentMethod,
    saleDate: saleDate,
  };
};

/**
 * Create service sale data object
 * @param {Array} serviceItems - Array of service items
 * @param {number} clientId - Client ID
 * @param {number} stylistId - Stylist ID
 * @param {string} paymentMethod - Payment method
 * @param {Date} saleDate - Sale date
 * @param {number} serviceTaxAmount - Service tax amount
 * @param {number} tipAmount - Tip amount
 * @returns {Object} Service sale data object
 */
export const createServiceSaleData = (
  serviceItems,
  clientId,
  stylistId,
  paymentMethod,
  saleDate,
  serviceTaxAmount,
  tipAmount = 0,
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
      isLuxury: item.isLuxury,
    })),
    products: [],
    subtotal: serviceSubtotal,
    tax: serviceTaxAmount,
    tip: tipAmount,
    total: serviceSubtotal + serviceTaxAmount + tipAmount,
    paymentMethod: paymentMethod,
    saleDate: saleDate,
  };
};

/**
 * Create combined receipt data object
 * @param {Array} serviceItems - Array of service items
 * @param {Array} productItems - Array of product items
 * @param {number} clientId - Client ID
 * @param {number} serviceStylistId - Service stylist ID
 * @param {number} productStylistId - Product stylist ID
 * @param {string} productStylistName - Product stylist name
 * @param {number} subtotal - Total subtotal
 * @param {number} tax - Total tax
 * @param {number} tip - Tip amount
 * @param {string} paymentMethod - Primary payment method
 * @param {string} secondaryPaymentMethod - Secondary payment method (optional)
 * @param {number} secondaryPaymentAmount - Secondary payment amount (optional)
 * @param {Date} saleDate - Sale date
 * @returns {Object} Combined receipt data object
 */
export const createCombinedReceiptData = (
  serviceItems,
  productItems,
  clientId,
  serviceStylistId,
  productStylistId,
  productStylistName,
  subtotal,
  tax,
  tip,
  paymentMethod,
  secondaryPaymentMethod = null,
  secondaryPaymentAmount = null,
  saleDate,
) => {
  return {
    ClientId: clientId,
    StylistId: serviceStylistId,
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
    tip,
    total: subtotal + tax + tip,
    paymentMethod,
    secondaryPaymentMethod,
    secondaryPaymentAmount,
    saleDate,
    splitPayment: !!secondaryPaymentMethod,
    splitAttribution: true,
  };
};

/**
 * Calculate split payment amounts
 * @param {number} totalAmount - Total amount to split
 * @param {number} secondaryAmount - Secondary payment amount
 * @returns {Object} Object containing primaryAmount and primaryRatio
 */
export const calculateSplitPaymentAmounts = (totalAmount, secondaryAmount) => {
  const primaryAmount = totalAmount - secondaryAmount;
  const primaryRatio = primaryAmount / totalAmount;

  return {
    primaryAmount,
    primaryRatio,
  };
};

/**
 * Split cart items for traditional split payment
 * @param {Array} cartItems - Array of cart items
 * @param {number} primaryAmount - Primary payment amount
 * @param {number} secondaryAmount - Secondary payment amount
 * @returns {Object} Object containing split items for both payments
 */
export const splitCartItems = (cartItems, primaryAmount, secondaryAmount) => {
  const totalAmount = primaryAmount + secondaryAmount;
  const { primaryRatio } = calculateSplitPaymentAmounts(totalAmount, secondaryAmount);

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

  return {
    sale1Services,
    sale1Products,
    sale2Services,
    sale2Products,
  };
};

/**
 * Calculate taxes for split payment items
 * @param {Array} services - Array of service items
 * @param {Array} products - Array of product items
 * @param {number} taxRate - Tax rate as decimal
 * @returns {Object} Object containing productTax, luxuryServiceTax, and totalTax
 */
export const calculateSplitPaymentTaxes = (services, products, taxRate) => {
  // Calculate product tax with proper rounding
  const productTax = Math.round(
    products.reduce(
      (sum, item) => sum + item.price * taxRate,
      0,
    ) * 100
  ) / 100;

  // Calculate luxury service tax with proper rounding
  const luxuryServiceSubtotal = services
    .filter((item) => item.isLuxury)
    .reduce((sum, item) => sum + parseFloat(item.price), 0);
  const luxuryServiceTax = Math.round((luxuryServiceSubtotal * taxRate) * 100) / 100;

  // Total tax is the sum of product tax and luxury service tax
  const totalTax = Math.round((productTax + luxuryServiceTax) * 100) / 100;

  return {
    productTax,
    luxuryServiceTax,
    totalTax,
  };
};
