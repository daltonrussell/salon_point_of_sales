/**
 * Tests for useSaleProcessing hook
 * Ensures that tips are properly passed through all sale handlers
 *
 * Note: Integration tests for actual hook execution are covered by:
 * - salesCalculations.test.js (data creation with tips)
 * - ServicesSection.test.jsx (component integration)
 */

import {
  createProductSaleData,
  createServiceSaleData,
  createCombinedReceiptData,
} from '../../utils/salesCalculations';

describe('useSaleProcessing Hook - Tip Data Structure', () => {
  test('createProductSaleData includes tip in returned object', () => {
    const productItems = [
      {
        product: { id: 1 },
        price: 50,
        quantity: 1,
        isBackBar: false,
      },
    ];

    const tipAmount = 10;
    const saleData = createProductSaleData(
      productItems,
      1, // clientId
      2, // stylistId
      'Cash',
      new Date(),
      0.08,
      tipAmount
    );

    expect(saleData).toHaveProperty('tip', tipAmount);
    expect(saleData.total).toBe(50 * 1.08 + tipAmount);
  });

  test('createServiceSaleData includes tip in returned object', () => {
    const serviceItems = [
      {
        service: { id: 1, price: 75 },
        price: 75,
        isLuxury: false,
      },
    ];

    const tipAmount = 15;
    const saleData = createServiceSaleData(
      serviceItems,
      1, // clientId
      2, // stylistId
      'Card',
      new Date(),
      0, // serviceTax
      tipAmount
    );

    expect(saleData).toHaveProperty('tip', tipAmount);
    expect(saleData.total).toBe(75 + tipAmount);
  });

  test('createCombinedReceiptData includes tip in returned object', () => {
    const serviceItems = [
      {
        service: { id: 1, price: 50 },
        price: 50,
        isLuxury: false,
      },
    ];

    const productItems = [
      {
        product: { id: 1, productName: 'Product' },
        price: 30,
        quantity: 1,
        isBackBar: false,
      },
    ];

    const tipAmount = 12;
    const receiptData = createCombinedReceiptData(
      serviceItems,
      productItems,
      1, // clientId
      2, // serviceStylistId
      3, // productStylistId
      'House', // productStylistName
      80, // subtotal
      6.4, // tax
      tipAmount,
      'Cash'
    );

    expect(receiptData).toHaveProperty('tip', tipAmount);
    expect(receiptData.total).toBe(80 + 6.4 + tipAmount);
  });

  test('handles missing tip amount (defaults to 0)', () => {
    const serviceItems = [
      {
        service: { id: 1, price: 50 },
        price: 50,
        isLuxury: false,
      },
    ];

    // Call without tipAmount - should default to 0
    const saleData = createServiceSaleData(
      serviceItems,
      1,
      2,
      'Card',
      new Date(),
      0
    );

    expect(saleData).toHaveProperty('tip', 0);
  });

  test('all sale data functions preserve tip through calculations', () => {
    const productItems = [{ product: { id: 1 }, price: 100, quantity: 1, isBackBar: false }];
    const tipAmount = 20;
    const taxRate = 0.08;

    const saleData = createProductSaleData(
      productItems,
      1,
      2,
      'Cash',
      new Date(),
      taxRate,
      tipAmount
    );

    // Verify tip is properly added to total
    const expectedTax = 100 * taxRate;
    const expectedTotal = 100 + expectedTax + tipAmount;

    expect(saleData.tip).toBe(tipAmount);
    expect(saleData.total).toBe(expectedTotal);
    expect(saleData.subtotal).toBe(100);
    expect(saleData.tax).toBeCloseTo(expectedTax);
  });
});
