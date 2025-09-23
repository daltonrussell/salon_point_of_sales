/**
 * Custom hook for managing cart state and operations
 */
import { useState, useCallback } from 'react';
import { calculateSubtotals, calculateTaxes, calculateTotals, calculateDiscountedPrice } from '../utils/salesCalculations';

export const useCartManagement = (taxRate) => {
  const [cartItems, setCartItems] = useState([]);
  const [subtotal, setSubtotal] = useState(0);
  const [productTax, setProductTax] = useState(0);
  const [serviceTax, setServiceTax] = useState(0);

  const updateTotals = useCallback((items) => {
    const subtotals = calculateSubtotals(items);
    const taxes = calculateTaxes(
      subtotals.productSubtotal,
      subtotals.luxuryServiceSubtotal,
      taxRate,
      { productTaxableSubtotal: subtotals.productTaxableSubtotal }
    );
    const totals = calculateTotals(subtotals, taxes);

    setSubtotal(totals.totalSubtotal);
    setProductTax(taxes.productTax);
    setServiceTax(taxes.luxuryServiceTax);
  }, [taxRate]);

  const addToCart = useCallback((type, itemData) => {
    if (type === "service") {
      const { service, stylist, isLuxury, customPrice } = itemData;
      const servicePrice = parseFloat(customPrice) || service.price;
      
      const newItem = {
        id: Date.now(),
        type: "service",
        service: {
          ...service,
          price: servicePrice,
        },
        stylist: stylist,
        price: servicePrice,
        quantity: 1,
        isLuxury: isLuxury,
      };
      
      const updatedCart = [...cartItems, newItem];
      setCartItems(updatedCart);
      updateTotals(updatedCart);
      return newItem;
    } else if (type === "product") {
      const { product, quantity, discountPercent } = itemData;
      const originalPrice = product.salePrice * quantity;
      const discountedPrice = calculateDiscountedPrice(originalPrice, discountPercent);

      const newItem = {
        id: Date.now(),
        type: "product",
        product: product,
        quantity: quantity,
        originalPrice: originalPrice,
        discountPercent: parseFloat(discountPercent),
        price: discountedPrice,
      };
      
      const updatedCart = [...cartItems, newItem];
      setCartItems(updatedCart);
      updateTotals(updatedCart);
      return newItem;
    }
  }, [cartItems, updateTotals]);

  const addBackBarItem = useCallback((product, quantity) => {
    const newItem = {
      id: Date.now(),
      type: "product",
      product: product,
      quantity: quantity,
      price: 0,
      isBackBar: true,
    };
    
    const updatedCart = [...cartItems, newItem];
    setCartItems(updatedCart);
    updateTotals(updatedCart);
    return newItem;
  }, [cartItems, updateTotals]);

  const removeFromCart = useCallback((itemId) => {
    const updatedCart = cartItems.filter((item) => item.id !== itemId);
    setCartItems(updatedCart);
    updateTotals(updatedCart);
  }, [cartItems, updateTotals]);

  const clearCart = useCallback(() => {
    setCartItems([]);
    setSubtotal(0);
    setProductTax(0);
    setServiceTax(0);
  }, []);

  return {
    cartItems,
    subtotal,
    productTax,
    serviceTax,
    addToCart,
    addBackBarItem,
    removeFromCart,
    clearCart,
    updateTotals,
  };
};