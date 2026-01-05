/**
 * Custom hook for managing sale processing logic
 */
import { useState, useCallback } from 'react';
import { 
  createProductSaleData, 
  createServiceSaleData, 
  createCombinedReceiptData,
  splitCartItems,
  calculateSplitPaymentTaxes,
  calculateSplitPaymentAmounts
} from '../utils/salesCalculations';

const ipc = window.api;

export const useSaleProcessing = () => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleProductOnlySale = useCallback(async (
    productItems,
    clientId,
    productStylistId,
    paymentMethod,
    saleDate,
    taxRate,
    tipAmount,
  ) => {
    const saleData = createProductSaleData(
      productItems,
      clientId,
      productStylistId,
      paymentMethod,
      saleDate,
      taxRate,
      tipAmount,
    );

    await ipc.invoke("create-sale", saleData);
    return saleData;
  }, []);

  const handleServiceOnlySale = useCallback(async (
    serviceItems,
    clientId,
    stylistId,
    paymentMethod,
    saleDate,
    serviceTax,
    tipAmount,
  ) => {
    const saleData = createServiceSaleData(
      serviceItems,
      clientId,
      stylistId,
      paymentMethod,
      saleDate,
      serviceTax,
      tipAmount,
    );

    await ipc.invoke("create-sale", saleData);
    return saleData;
  }, []);

  const handleMixedSale = useCallback(async (
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
    tipAmount = 0,
  ) => {
    // Create and submit service sale
    if (serviceItems.length > 0) {
      const serviceSaleData = createServiceSaleData(
        serviceItems,
        clientId,
        stylistId,
        paymentMethod,
        saleDate,
        serviceTax,
        tipAmount,
      );
      await ipc.invoke("create-sale", serviceSaleData);
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
        tipAmount,
      );
      await ipc.invoke("create-sale", productSaleData);
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
    const productTaxAmount = Math.round((productSubtotal * taxRate) * 100) / 100;

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
      productTaxAmount + serviceTax,
      paymentMethod,
      null,
      null,
      saleDate,
    );
  }, []);

  const handleSplitPaymentWithProductAttribution = useCallback(async (
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
    tipAmount = 0,
  ) => {
    // Create service sale
    if (serviceItems.length > 0) {
      // Calculate luxury service tax
      const luxuryServiceItems = serviceItems.filter((item) => item.isLuxury);
      const luxuryServiceSubtotal = luxuryServiceItems.reduce(
        (sum, item) => sum + parseFloat(item.price),
        0,
      );
      const luxuryServiceTax = Math.round((luxuryServiceSubtotal * taxRate) * 100) / 100;

      const serviceSaleData = createServiceSaleData(
        serviceItems,
        clientId,
        stylistId,
        primaryPaymentMethod,
        saleDate,
        luxuryServiceTax,
        tipAmount,
      );
      await ipc.invoke("create-sale", serviceSaleData);
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
        tipAmount,
      );
      await ipc.invoke("create-sale", productSaleData);
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
    const productTaxAmount = Math.round((productSubtotal * taxRate) * 100) / 100;

    // Calculate luxury service tax for receipt
    const luxuryServiceItems = serviceItems.filter((item) => item.isLuxury);
    const luxuryServiceSubtotal = luxuryServiceItems.reduce(
      (sum, item) => sum + parseFloat(item.price),
      0,
    );
    const luxuryServiceTax = Math.round((luxuryServiceSubtotal * taxRate) * 100) / 100;

    // Total tax combines product tax and luxury service tax
    const totalTaxAmount = productTaxAmount + luxuryServiceTax;

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
      totalTaxAmount,
      primaryPaymentMethod,
      secondaryPaymentMethod,
      parseFloat(secondaryPaymentAmount),
      saleDate,
    );
  }, []);

  const handleTraditionalSplitPayment = useCallback(async (
    cartItems,
    clientId,
    stylistId,
    primaryPaymentMethod,
    secondaryPaymentMethod,
    primaryAmount,
    secondaryAmount,
    saleDate,
    taxRate,
    tipAmount = 0,
  ) => {
    const { sale1Services, sale1Products, sale2Services, sale2Products } = 
      splitCartItems(cartItems, primaryAmount, secondaryAmount);

    // Create first sale data
    const sale1ServicesData = sale1Services.map((item) => ({
      serviceId: item.service.id,
      price: item.service.price,
      quantity: 1,
      isLuxury: item.isLuxury,
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

    const sale1Taxes = calculateSplitPaymentTaxes(sale1Services, sale1Products, taxRate);

    const saleData1 = {
      ClientId: clientId,
      StylistId: stylistId,
      services: sale1ServicesData,
      products: sale1ProductsData,
      subtotal: sale1Subtotal,
      tax: sale1Taxes.totalTax,
      tip: tipAmount,
      total: sale1Subtotal + sale1Taxes.totalTax + tipAmount,
      paymentMethod: primaryPaymentMethod,
      saleDate: saleDate,
    };

    // Create second sale data
    const sale2ServicesData = sale2Services.map((item) => ({
      serviceId: item.service.id,
      price: item.service.price,
      quantity: 1,
      isLuxury: item.isLuxury,
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

    const sale2Taxes = calculateSplitPaymentTaxes(sale2Services, sale2Products, taxRate);

    const saleData2 = {
      ClientId: clientId,
      StylistId: stylistId,
      services: sale2ServicesData,
      products: sale2ProductsData,
      subtotal: sale2Subtotal,
      tax: sale2Taxes.totalTax,
      tip: tipAmount,
      total: sale2Subtotal + sale2Taxes.totalTax + tipAmount,
      paymentMethod: secondaryPaymentMethod,
      saleDate: saleDate,
    };

    // Submit both sales
    await ipc.invoke("create-sale", saleData1);
    await ipc.invoke("create-sale", saleData2);

    // Return both sale data objects for receipt
    return [saleData1, saleData2];
  }, []);

  const processSale = useCallback(async (saleData) => {
    setIsProcessing(true);
    try {
      const result = await ipc.invoke("create-sale", saleData);
      return result;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  return {
    isProcessing,
    handleProductOnlySale,
    handleServiceOnlySale,
    handleMixedSale,
    handleSplitPaymentWithProductAttribution,
    handleTraditionalSplitPayment,
    processSale,
  };
};
