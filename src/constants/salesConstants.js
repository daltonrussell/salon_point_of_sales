// Payment methods available in the system
export const PAYMENT_METHODS = ["Cash", "Credit Card", "Debit Card", "Check"];

// Service types
export const SERVICE_TYPES = {
  REGULAR: "regular",
  LUXURY: "luxury"
};

// Item types for cart
export const ITEM_TYPES = {
  SERVICE: "service",
  PRODUCT: "product"
};

// Default tip percentages
export const DEFAULT_TIP_PERCENTAGES = [15, 18, 20, 25];

// Tax-related constants
export const TAX_EXEMPT_ITEMS = {
  TIPS: "tips",
  REGULAR_SERVICES: "regular_services"
};

// Sale validation messages
export const VALIDATION_MESSAGES = {
  NO_ITEMS: "Please add items to the cart before completing the sale",
  NO_CUSTOMER: "Please select a customer",
  NO_STYLIST: "Please select a stylist", 
  NO_PAYMENT_METHOD: "Please select a payment method",
  INVALID_SPLIT_AMOUNT: "Please enter a valid amount for the split payment",
  INSUFFICIENT_CASH: "Cash tendered must be greater than or equal to the total"
};

// Default values
export const DEFAULTS = {
  PRODUCT_QUANTITY: 1,
  DISCOUNT_PERCENT: "0",
  TIP_AMOUNT: 0,
  TAX_RATE: 0.08
};
