import React, { useEffect } from "react";
import CheckoutForm from "../../components/forms/CheckoutForm";
import OrderSummary from "../../components/cart/OrderSummary";
import PageHeader from "../../components/common/PageHeader";
import { useCart } from "../../context/CartContext";

export default function CheckoutPage() {
  const { cart, refreshCart } = useCart();

  useEffect(() => {
    refreshCart();
  }, []);

  return (
    <div className="container page-section">
      <PageHeader eyebrow="Secure checkout" title="Checkout" description="Enter your shipping and payment details to continue." />
      <div className="checkout-layout">
        <CheckoutForm />
        <OrderSummary cart={cart} checkout />
      </div>
    </div>
  );
}
