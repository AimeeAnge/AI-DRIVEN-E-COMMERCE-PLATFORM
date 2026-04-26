import React, { useState } from "react";
import { orderService } from "../../services/orderService";
import { useRouter } from "../../routes/router.jsx";
import Icon from "../common/Icon";
import TextField from "./TextField";

export default function CheckoutForm() {
  const { navigate } = useRouter();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
      await orderService.checkout(payload);
      navigate("/checkout/success");
    } catch (checkoutError) {
      console.log(checkoutError);
      setError(checkoutError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form id="checkout-form" className="checkout-form" onSubmit={handleSubmit}>
      <section className="panel form-section">
        <h2><span>1</span> Shipping Address</h2>
        <div className="form-grid">
          <TextField label="First name" id="firstName" name="firstName" required />
          <TextField label="Last name" id="lastName" name="lastName" required />
          <TextField label="Street address" id="address" name="address" required />
          <TextField label="City" id="city" name="city" required />
          <TextField label="Postal code" id="postalCode" name="postalCode" required />
        </div>
      </section>
      <section className="panel form-section">
        <h2><span>2</span> Payment Method</h2>
        <div className="payment-options">
          <button type="button" className="is-active"><Icon name="credit_card" /> Card</button>
          <button type="button"><Icon name="account_balance_wallet" /> Wallet</button>
          <button type="button"><Icon name="payments" /> PayPal</button>
        </div>
        <div className="form-grid">
          <TextField label="Card number" id="cardNumber" name="cardNumber" inputMode="numeric" required />
          <TextField label="Expiry date" id="expiry" name="expiry" placeholder="MM/YY" required />
          <TextField label="CVC" id="cvc" name="cvc" inputMode="numeric" required />
        </div>
        {error ? <p className="form-error" role="alert">We couldn't place your order right now. Please try again later.</p> : null}
        {loading ? <p className="form-status">Placing your order...</p> : null}
      </section>
    </form>
  );
}
