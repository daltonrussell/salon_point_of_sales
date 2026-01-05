/**
 * Tests for useSaleProcessing hook
 * Tests ensure that tips are properly passed through all sale handlers
 */

import { renderHook, act } from '@testing-library/react';
import { useSaleProcessing } from '../useSaleProcessing';

// Mock the window.api IPC
const mockInvoke = jest.fn();
global.window = {
  api: {
    invoke: mockInvoke,
  },
};

describe('useSaleProcessing Hook - Tip Handling', () => {
  beforeEach(() => {
    mockInvoke.mockClear();
    mockInvoke.mockResolvedValue({ success: true });
  });

  test('handleProductOnlySale should include tip in sale data', async () => {
    const { result } = renderHook(() => useSaleProcessing());

    const productItems = [
      {
        product: { id: 1 },
        price: 50,
        quantity: 1,
        isBackBar: false,
      },
    ];

    const tipAmount = 10;

    await act(async () => {
      await result.current.handleProductOnlySale(
        productItems,
        1, // clientId
        2, // productStylistId
        'Cash',
        new Date(),
        0.08,
        tipAmount
      );
    });

    expect(mockInvoke).toHaveBeenCalledWith('create-sale', expect.objectContaining({
      tip: tipAmount,
    }));
  });

  test('handleServiceOnlySale should include tip in sale data', async () => {
    const { result } = renderHook(() => useSaleProcessing());

    const serviceItems = [
      {
        service: { id: 1, price: 75 },
        price: 75,
        isLuxury: false,
      },
    ];

    const tipAmount = 15;

    await act(async () => {
      await result.current.handleServiceOnlySale(
        serviceItems,
        1, // clientId
        2, // stylistId
        'Card',
        new Date(),
        0, // serviceTaxAmount
        tipAmount
      );
    });

    expect(mockInvoke).toHaveBeenCalledWith('create-sale', expect.objectContaining({
      tip: tipAmount,
    }));
  });

  test('handleMixedSale should include tip in both service and product sales', async () => {
    const { result } = renderHook(() => useSaleProcessing());

    const serviceItems = [
      {
        service: { id: 1, price: 50 },
        price: 50,
        isLuxury: false,
      },
    ];

    const productItems = [
      {
        product: { id: 1 },
        price: 30,
        quantity: 1,
        isBackBar: false,
      },
    ];

    const tipAmount = 12;
    const findStylistById = () => ({ firstName: 'John', lastName: 'Doe' });

    await act(async () => {
      await result.current.handleMixedSale(
        serviceItems,
        productItems,
        1, // clientId
        2, // stylistId
        3, // productStylistId
        'Cash',
        new Date(),
        0.08,
        0, // serviceTax
        findStylistById,
        tipAmount
      );
    });

    // Should be called twice: once for service, once for product
    expect(mockInvoke).toHaveBeenCalledTimes(2);

    // Both calls should include the tip
    const calls = mockInvoke.mock.calls;
    expect(calls[0][1]).toEqual(expect.objectContaining({ tip: tipAmount }));
    expect(calls[1][1]).toEqual(expect.objectContaining({ tip: tipAmount }));
  });

  test('handleSplitPaymentWithProductAttribution should include tip in both sales', async () => {
    const { result } = renderHook(() => useSaleProcessing());

    const serviceItems = [
      {
        service: { id: 1, price: 50 },
        price: 50,
        isLuxury: false,
      },
    ];

    const productItems = [
      {
        product: { id: 1 },
        price: 30,
        quantity: 1,
        isBackBar: false,
      },
    ];

    const tipAmount = 8;
    const findStylistById = () => ({ firstName: 'Jane', lastName: 'Smith' });

    await act(async () => {
      await result.current.handleSplitPaymentWithProductAttribution(
        serviceItems,
        productItems,
        1, // clientId
        2, // stylistId
        3, // productStylistId
        'Cash',
        'Card',
        25, // secondaryPaymentAmount
        new Date(),
        0.08,
        findStylistById,
        tipAmount
      );
    });

    // Should be called twice: once for service, once for product
    expect(mockInvoke).toHaveBeenCalledTimes(2);

    // Both calls should include the tip
    const calls = mockInvoke.mock.calls;
    expect(calls[0][1]).toEqual(expect.objectContaining({ tip: tipAmount }));
    expect(calls[1][1]).toEqual(expect.objectContaining({ tip: tipAmount }));
  });

  test('handleTraditionalSplitPayment should include tip in both split sales', async () => {
    const { result } = renderHook(() => useSaleProcessing());

    const cartItems = [
      {
        type: 'service',
        service: { id: 1, price: 50 },
        price: 50,
        isLuxury: false,
      },
      {
        type: 'product',
        product: { id: 1 },
        price: 30,
        quantity: 1,
        isBackBar: false,
      },
    ];

    const tipAmount = 10;

    await act(async () => {
      await result.current.handleTraditionalSplitPayment(
        cartItems,
        1, // clientId
        2, // stylistId
        'Cash',
        'Card',
        50, // primaryAmount
        30, // secondaryAmount
        new Date(),
        0.08,
        tipAmount
      );
    });

    // Should be called twice: once for each sale
    expect(mockInvoke).toHaveBeenCalledTimes(2);

    // Both calls should include the tip
    const calls = mockInvoke.mock.calls;
    expect(calls[0][1]).toEqual(expect.objectContaining({ tip: tipAmount }));
    expect(calls[1][1]).toEqual(expect.objectContaining({ tip: tipAmount }));
  });

  test('should handle missing tip amount (default to 0)', async () => {
    const { result } = renderHook(() => useSaleProcessing());

    const serviceItems = [
      {
        service: { id: 1, price: 50 },
        price: 50,
        isLuxury: false,
      },
    ];

    // Call without tipAmount parameter
    await act(async () => {
      await result.current.handleServiceOnlySale(
        serviceItems,
        1,
        2,
        'Card',
        new Date(),
        0
      );
    });

    expect(mockInvoke).toHaveBeenCalledWith('create-sale', expect.objectContaining({
      tip: 0,
    }));
  });
});
