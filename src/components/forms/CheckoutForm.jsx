import React, { useState } from "react";
import { orderService } from "../../services/orderService";
import { useCart } from "../../context/CartContext";
import { useRouter } from "../../routes/router.jsx";
import { friendlyApiError } from "../../utils/apiErrors";
import Icon from "../common/Icon";
import TextField from "./TextField";

export default function CheckoutForm() {
  const { navigate } = useRouter();
  const { clearCart, refreshCart } = useCart();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const form = Object.fromEntries(new FormData(event.currentTarget).entries());
      const payload = {
        shipping_country_code: form.shipping_country_code,
        shipping_region: form.shipping_region,
        shipping_city: form.shipping_city,
        shipping_address_line1: form.shipping_address_line1,
        shipping_address_line2: form.shipping_address_line2
      };
      const response = await orderService.checkout(payload);
      const order = response?.data?.order || response?.order;
      if (order) {
        window.sessionStorage.setItem("aidep.checkout.lastOrder", JSON.stringify(order));
      }
      clearCart();
      await refreshCart();
      navigate("/checkout/success");
    } catch (checkoutError) {
      console.log(checkoutError);
      setError(friendlyApiError(checkoutError, "We couldn't place your order right now. Please try again later."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form id="checkout-form" className="checkout-form" onSubmit={handleSubmit}>
      <section className="panel form-section">
        <h2><span>1</span> Shipping Address</h2>
        <div className="form-grid">
          <TextField label="Country code" id="shipping_country_code" name="shipping_country_code" placeholder="RW" maxLength={2} />
          <TextField label="Region" id="shipping_region" name="shipping_region" />
          <TextField label="City" id="shipping_city" name="shipping_city" />
          <TextField label="Address line 1" id="shipping_address_line1" name="shipping_address_line1" />
          <TextField label="Address line 2" id="shipping_address_line2" name="shipping_address_line2" />
        </div>
      </section>
      <section className="panel form-section">
        <h2><span>2</span> Payment Method</h2>
        <div className="payment-options">
          <button type="button" className="is-active"><Icon name="credit_card" /> Card</button>
          <button type="button"><Icon name="account_balance_wallet" /> Wallet</button>
          <button type="button"><Icon name="payments" /> PayPal</button>
        </div>
        <p className="muted">Payment capture will be connected later. This checkout creates a pending order.</p>
        {error ? <p className="form-error" role="alert">{error}</p> : null}
        {loading ? <p className="form-status">Placing your order...</p> : null}
      </section>
    </form>
  );
}
