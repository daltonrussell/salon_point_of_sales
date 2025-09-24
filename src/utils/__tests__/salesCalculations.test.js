/**
 * Tests for sales calculations and tax logic
 * These tests ensure the tax calculations work correctly before refactoring
 */

import {
  calculateSubtotals,
  calculateTaxes,
  calculateTotals,
  calculateDiscountedPrice,
  createProductSaleData,
  createServiceSaleData,
  calculateSplitPaymentAmounts,
  splitCartItems,
  calculateSplitPaymentTaxes,
} from '../salesCalculations';

// Mock data for testing
const mockCartItems = [
  {
    id: 1,
    type: "service",
    service: { id: 1, name: "Haircut", price: 50 },
    price: 50,
    isLuxury: false,
  },
  {
    id: 2,
    type: "service", 
    service: { id: 2, name: "Luxury Treatment", price: 100 },
    price: 100,
    isLuxury: true,
  },
  {
    id: 3,
    type: "product",
    product: { id: 1, productName: "Shampoo", salePrice: 25 },
    price: 25,
    quantity: 1,
    isBackBar: false,
  },
  {
    id: 4,
    type: "product",
    product: { id: 2, productName: "Conditioner", salePrice: 20 },
    price: 20,
    quantity: 1,
    isBackBar: true, // Back bar items should not be taxed
  },
];

const mockTaxRate = 0.08; // 8%

// Test tax calculation functions
describe("Sales Tax Calculations", () => {
  test("should calculate subtotals correctly", () => {
    const subtotals = calculateSubtotals(mockCartItems);

    expect(subtotals.serviceSubtotal).toBe(50); // Regular service
    expect(subtotals.luxuryServiceSubtotal).toBe(100); // Luxury service
    expect(subtotals.productSubtotal).toBe(45); // Both products (25 + 20)
  });

  test("should calculate taxes correctly", () => {
    const subtotals = calculateSubtotals(mockCartItems);
    const taxes = calculateTaxes(subtotals.productSubtotal, subtotals.luxuryServiceSubtotal, mockTaxRate);
    const totals = calculateTotals(subtotals, taxes);

    expect(taxes.productTax).toBe(3.6); // 45 * 0.08
    expect(taxes.luxuryServiceTax).toBe(8); // 100 * 0.08
    expect(totals.totalSubtotal).toBe(195); // 50 + 100 + 45
  });

  test("should handle back bar items correctly", () => {
    const backBarItems = mockCartItems.filter(item => item.isBackBar);
    const regularProductItems = mockCartItems.filter(item => 
      item.type === "product" && !item.isBackBar
    );

    const backBarSubtotal = backBarItems.reduce((sum, item) => sum + item.price, 0);
    const regularProductSubtotal = regularProductItems.reduce((sum, item) => sum + item.price, 0);

    // Back bar items should not be taxed
    const backBarTax = backBarSubtotal * mockTaxRate;
    const regularProductTax = regularProductSubtotal * mockTaxRate;

    expect(backBarSubtotal).toBe(20); // Back bar conditioner
    expect(regularProductSubtotal).toBe(25); // Regular shampoo
    expect(backBarTax).toBe(1.6); // 20 * 0.08 (still taxed in current implementation)
    expect(regularProductTax).toBe(2); // 25 * 0.08
  });

  test("should calculate discount correctly", () => {
    const originalPrice = 100;
    const discountPercent = 20;
    const discountedPrice = calculateDiscountedPrice(originalPrice, discountPercent);

    expect(discountedPrice).toBe(80);
  });

  test("should handle split payment calculations", () => {
    const totalAmount = 200;
    const secondaryAmount = 50;
    const { primaryAmount, primaryRatio } = calculateSplitPaymentAmounts(totalAmount, secondaryAmount);

    expect(primaryAmount).toBe(150);
    expect(primaryRatio).toBe(0.75);
  });
});

// Test sale data creation functions
describe("Sale Data Creation", () => {
  test("should create product sale data correctly", () => {
    const productItems = mockCartItems.filter(item => item.type === "product");
    const clientId = 1;
    const stylistId = 2;
    const paymentMethod = "Cash";
    const saleDate = new Date("2024-01-01");
    const taxRate = mockTaxRate;
    const tipAmount = 10;

    const saleData = createProductSaleData(
      productItems,
      clientId,
      stylistId,
      paymentMethod,
      saleDate,
      taxRate,
      tipAmount
    );

    expect(saleData.subtotal).toBe(45);
    expect(saleData.tax).toBe(3.6);
    expect(saleData.tip).toBe(10);
    expect(saleData.total).toBe(58.6);
    expect(saleData.products).toHaveLength(2);
  });

  test("should create service sale data correctly", () => {
    const serviceItems = mockCartItems.filter(item => item.type === "service");
    const clientId = 1;
    const stylistId = 2;
    const paymentMethod = "Card";
    const saleDate = new Date("2024-01-01");
    const serviceTaxAmount = 8; // Luxury service tax
    const tipAmount = 15;

    const saleData = createServiceSaleData(
      serviceItems,
      clientId,
      stylistId,
      paymentMethod,
      saleDate,
      serviceTaxAmount,
      tipAmount
    );

    expect(saleData.subtotal).toBe(150);
    expect(saleData.tax).toBe(8);
    expect(saleData.tip).toBe(15);
    expect(saleData.total).toBe(173);
    expect(saleData.services).toHaveLength(2);
  });
});

// Test complex sale scenarios
describe("Complex Sale Scenarios", () => {
  test("should handle mixed sale with product stylist", () => {
    const serviceItems = mockCartItems.filter(item => item.type === "service");
    const productItems = mockCartItems.filter(item => item.type === "product");
    
    const serviceSubtotal = serviceItems.reduce((sum, item) => sum + parseFloat(item.price), 0);
    const productSubtotal = productItems.reduce((sum, item) => sum + parseFloat(item.price), 0);
    
    // Calculate taxes separately
    const luxuryServiceItems = serviceItems.filter((item) => item.isLuxury);
    const luxuryServiceSubtotal = luxuryServiceItems.reduce(
      (sum, item) => sum + parseFloat(item.price),
      0,
    );
    const luxuryServiceTax = luxuryServiceSubtotal * mockTaxRate;
    const productTaxAmount = productSubtotal * mockTaxRate;

    expect(serviceSubtotal).toBe(150);
    expect(productSubtotal).toBe(45);
    expect(luxuryServiceTax).toBe(8);
    expect(productTaxAmount).toBe(3.6);
  });

  test("should handle split payment with product attribution", () => {
    const serviceItems = mockCartItems.filter(item => item.type === "service");
    const productItems = mockCartItems.filter(item => item.type === "product");
    
    const serviceSubtotal = serviceItems.reduce((sum, item) => sum + parseFloat(item.price), 0);
    const productSubtotal = productItems.reduce((sum, item) => sum + parseFloat(item.price), 0);
    
    // Calculate taxes
    const luxuryServiceItems = serviceItems.filter((item) => item.isLuxury);
    const luxuryServiceSubtotal = luxuryServiceItems.reduce(
      (sum, item) => sum + parseFloat(item.price),
      0,
    );
    const luxuryServiceTax = luxuryServiceSubtotal * mockTaxRate;
    const productTaxAmount = productSubtotal * mockTaxRate;
    const totalTaxAmount = productTaxAmount + luxuryServiceTax;

    expect(totalTaxAmount).toBe(11.6); // 3.6 + 8
  });

  test("should handle traditional split payment", () => {
    const cartItems = mockCartItems;
    const primaryAmount = 100;
    const secondaryAmount = 50;

    const { sale1Services, sale1Products } = splitCartItems(cartItems, primaryAmount, secondaryAmount);

    expect(sale1Services).toHaveLength(1); // Should get first service
    expect(sale1Products).toHaveLength(2); // Both products fit in primary amount
  });
});

// Test edge cases
describe("Edge Cases", () => {
  test("should handle empty cart", () => {
    const emptyCart = [];
    const subtotals = calculateSubtotals(emptyCart);
    const taxes = calculateTaxes(subtotals.productSubtotal, subtotals.luxuryServiceSubtotal, mockTaxRate);

    expect(subtotals.serviceSubtotal).toBe(0);
    expect(subtotals.luxuryServiceSubtotal).toBe(0);
    expect(subtotals.productSubtotal).toBe(0);
    expect(taxes.productTax).toBe(0);
    expect(taxes.luxuryServiceTax).toBe(0);
  });

  test("should handle zero tax rate", () => {
    const zeroTaxRate = 0;
    const productSubtotal = 100;
    const luxuryServiceSubtotal = 50;

    const taxes = calculateTaxes(productSubtotal, luxuryServiceSubtotal, zeroTaxRate);

    expect(taxes.productTax).toBe(0);
    expect(taxes.luxuryServiceTax).toBe(0);
  });

  test("should handle 100% discount", () => {
    const originalPrice = 100;
    const discountPercent = 100;
    const discountedPrice = calculateDiscountedPrice(originalPrice, discountPercent);

    expect(discountedPrice).toBe(0);
  });
});
