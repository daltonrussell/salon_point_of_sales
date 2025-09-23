/**
 * Custom hook for managing payment state and calculations
 */
import { useState, useEffect } from 'react';

export const usePaymentManagement = () => {
  const [paymentMethod, setPaymentMethod] = useState("");
  const [splitPayment, setSplitPayment] = useState(false);
  const [secondaryPayment, setSecondaryPayment] = useState({
    method: "",
    amount: "",
  });
  const [cashTender, setCashTender] = useState("");
  const [changeDue, setChangeDue] = useState(0);

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

  const handleSecondaryPaymentChange = (field, value) => {
    setSecondaryPayment({
      ...secondaryPayment,
      [field]: value,
    });
  };

  const toggleSplitPayment = (checked) => {
    setSplitPayment(checked);
    if (!checked) {
      setSecondaryPayment({ method: "", amount: "" });
    }
  };

  const resetPayment = () => {
    setPaymentMethod("");
    setSplitPayment(false);
    setSecondaryPayment({ method: "", amount: "" });
    setCashTender("");
    setChangeDue(0);
  };

  return {
    paymentMethod,
    splitPayment,
    secondaryPayment,
    cashTender,
    changeDue,
    handlePaymentMethodChange,
    handleCashTenderChange,
    handleSecondaryPaymentChange,
    toggleSplitPayment,
    resetPayment,
  };
};

/**
 * Custom hook for calculating change due
 */
export const useChangeCalculation = (paymentMethod, cashTender, subtotal, productTax, serviceTax, tipAmount) => {
  const [changeDue, setChangeDue] = useState(0);

  useEffect(() => {
    if (paymentMethod === "Cash" && cashTender) {
      const tenderAmount = parseFloat(cashTender);
      const total = subtotal + productTax + serviceTax + tipAmount;
      if (!isNaN(tenderAmount) && tenderAmount >= total) {
        setChangeDue(tenderAmount - total);
      } else {
        setChangeDue(0);
      }
    } else {
      setChangeDue(0);
    }
  }, [cashTender, subtotal, productTax, serviceTax, tipAmount, paymentMethod]);

  return changeDue;
};
