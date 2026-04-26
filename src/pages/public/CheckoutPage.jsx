import React, { useEffect } from "react";
import CheckoutForm from "../../components/forms/CheckoutForm";
import OrderSummary from "../../components/cart/OrderSummary";
import PageHeader from "../../components/common/PageHeader";
import StatusState from "../../components/common/StatusState";
import { useCart } from "../../context/CartContext";
import { friendlyApiError } from "../../utils/apiErrors";

export default function CheckoutPage() {
  const { cart, loading, error, refreshCart } = useCart();
  const items = cart?.items || [];

  useEffect(() => {
    refreshCart();
  }, []);

  return (
    <div className="container page-section">
      <PageHeader eyebrow="Secure checkout" title="Checkout" description="Enter your shipping and payment details to continue." />
      {loading ? <StatusState type="loading" title="Loading checkout" message="We're checking your cart." /> : null}
      {error ? <StatusState type="error" title="We couldn't load checkout right now" message={friendlyApiError(error, "Please try again later.")} actionLabel="Retry" onAction={refreshCart} /> : null}
      {!loading && !error && !items.length ? <StatusState title="Your cart is empty" message="Add products to your cart before checkout." /> : null}
      {items.length ? (
        <div className="checkout-layout">
          <CheckoutForm />
          <OrderSummary cart={cart} checkout />
        </div>
      ) : null}
    </div>
  );
}
