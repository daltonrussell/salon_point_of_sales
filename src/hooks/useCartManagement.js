import { useState, useCallback } from "react";

const useCartManagement = (taxRate) => {
  const [cartItems, setCartItems] = useState([]);
  const [subtotal, setSubtotal] = useState(0);
  const [productTax, setProductTax] = useState(0);
  const [serviceTax, setServiceTax] = useState(0);

  // Calculate totals whenever cart items change
  const updateTotals = useCallback((items) => {
    let newServiceSubtotal = 0;
    let newLuxuryServiceSubtotal = 0;
    let newProductSubtotal = 0;

    items.forEach((item) => {
      if (item.type === "service") {
        if (item.isLuxury) {
          newLuxuryServiceSubtotal += parseFloat(item.service.price);
        } else {
          newServiceSubtotal += parseFloat(item.service.price);
        }
      } else if (item.type === "product") {
        newProductSubtotal += parseFloat(item.price);
      }
    });

    // Calculate tax for products and luxury services (tips are tax-free)
    const newProductTax = newProductSubtotal * taxRate;
    const newLuxuryServiceTax = newLuxuryServiceSubtotal * taxRate;

    setSubtotal(
      newServiceSubtotal + newLuxuryServiceSubtotal + newProductSubtotal,
    );
    setProductTax(newProductTax);
    setServiceTax(newLuxuryServiceTax); // Apply tax to luxury services
  }, [taxRate]);

  const addToCart = useCallback((type, itemData) => {
    if (type === "service") {
      const { service, stylist, customPrice, isLuxury } = itemData;
      if (service && stylist) {
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
        return true; // Success
      }
    } else if (type === "product") {
      const { product, quantity, discountPercent } = itemData;
      if (product) {
        // Calculate discounted price
        const discountMultiplier = 1 - parseFloat(discountPercent || 0) / 100;
        const originalPrice = product.salePrice * quantity;
        const discountedPrice = originalPrice * discountMultiplier;

        const newItem = {
          id: Date.now(),
          type: "product",
          product: product,
          quantity: quantity,
          originalPrice: originalPrice,
          discountPercent: parseFloat(discountPercent || 0),
          price: parseFloat(discountedPrice.toFixed(2)),
        };
        const updatedCart = [...cartItems, newItem];
        setCartItems(updatedCart);
        updateTotals(updatedCart);
        return true; // Success
      }
    }
    return false; // Failed to add
  }, [cartItems, updateTotals]);

  const addBackBarItem = useCallback((product, quantity) => {
    if (product) {
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
      return true;
    }
    return false;
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

export default useCartManagement;
