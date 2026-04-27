import React, { useState } from "react";
import { orderService } from "../../services/orderService";
import { useCart } from "../../context/CartContext";
import { useRouter } from "../../routes/router.jsx";
import { eventService } from "../../services/eventService";
import { useToast } from "../../context/ToastContext.jsx";
import { friendlyApiError } from "../../utils/apiErrors";
import TextField from "./TextField";

export default function CheckoutForm({ onBusyChange }) {
  const { navigate } = useRouter();
  const { clearCart, refreshCart } = useCart();
  const { showToast } = useToast();
  const [paymentMethod, setPaymentMethod] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function selectPaymentMethod(nextMethod) {
    setPaymentMethod(nextMethod);
    setError("");
  }

  function validateCardDetails(form) {
    const cardNumber = String(form.card_number || "").replace(/\s+/g, "");
    const cardHolder = String(form.card_holder || "").trim();
    const expiry = String(form.card_expiry || "").trim();
    const cvv = String(form.card_cvv || "").trim();

    if (!cardNumber || !cardHolder || !expiry || !cvv) {
      return "Please fill in your card details.";
    }
    if (!/^\d{13,19}$/.test(cardNumber) || !/^[A-Za-z][A-Za-z\s.'-]{1,}$/.test(cardHolder) || !/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry) || !/^\d{3,4}$/.test(cvv)) {
      return "Please enter valid card details.";
    }
    return "";
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    const form = Object.fromEntries(new FormData(event.currentTarget).entries());

    if (!paymentMethod) {
      setError("Please select a payment method.");
      showToast("Please select a payment method.", "error");
      return;
    }

    if (paymentMethod === "card") {
      const cardError = validateCardDetails(form);
      if (cardError) {
        setError(cardError);
        showToast(cardError, "error");
        return;
      }
    }

    setLoading(true);
    onBusyChange?.(true);
    try {
      const payload = {
        shipping_country_code: form.shipping_country_code,
        shipping_region: form.shipping_region,
        shipping_city: form.shipping_city,
        shipping_address_line1: form.shipping_address_line1,
        shipping_address_line2: form.shipping_address_line2,
        payment_method: paymentMethod
      };
      const response = await orderService.checkout(payload);
      const order = response?.data?.order || response?.order;
      if (order) {
        window.sessionStorage.setItem("aidep.checkout.lastOrder", JSON.stringify(order));
        eventService.safelyTrack({
          source_context: "checkout",
          event_type: "purchase",
          metadata: { order_id: order.id, order_number: order.order_number }
        });
      }
      clearCart();
      await refreshCart();
      showToast("Order placed successfully.");
      navigate("/checkout/success");
    } catch (checkoutError) {
      console.log(checkoutError);
      const message = friendlyApiError(checkoutError, "We couldn't place your order right now. Please try again later.");
      setError(message);
      showToast(message, "error");
    } finally {
      setLoading(false);
      onBusyChange?.(false);
    }
  }

  return (
    <form id="checkout-form" className="checkout-form" onSubmit={handleSubmit}>
      <section className="panel form-section">
        <h2><span>1</span> Shipping Address</h2>
        <div className="form-grid">
          <TextField label="Country code" id="shipping_country_code" name="shipping_country_code" placeholder="RW" maxLength={2} helper="Use a two-letter country code." />
          <TextField label="Region" id="shipping_region" name="shipping_region" />
          <TextField label="City" id="shipping_city" name="shipping_city" />
          <TextField label="Address line 1" id="shipping_address_line1" name="shipping_address_line1" helper="Street, building, or delivery landmark." />
          <TextField label="Address line 2" id="shipping_address_line2" name="shipping_address_line2" />
        </div>
      </section>
      <section className="panel form-section">
        <h2><span>2</span> Payment Method</h2>
        <div className="payment-options">
          <button type="button" className={paymentMethod === "card" ? "is-active" : ""} onClick={() => selectPaymentMethod("card")}>
            <span className="payment-brand-stack">
              <span className="payment-logo payment-logo--visa">VISA</span>
              <span className="payment-logo payment-logo--mastercard">MC</span>
            </span>
            <span>Visa / MasterCard<small>Card payment</small></span>
          </button>
          <button type="button" className={paymentMethod === "mobile_money" ? "is-active" : ""} onClick={() => selectPaymentMethod("mobile_money")}>
            <span className="payment-logo payment-logo--momo">MoMo</span>
            <span>Mobile Money<small>Pay by phone</small></span>
          </button>
          <button type="button" className={paymentMethod === "cod" ? "is-active" : ""} onClick={() => selectPaymentMethod("cod")}>
            <span className="payment-logo payment-logo--cod">COD</span>
            <span>Cash on Delivery<small>Pay at delivery</small></span>
          </button>
        </div>
        {paymentMethod === "card" ? (
          <div className="payment-card-form">
            <div className="form-grid payment-card-fields">
              <TextField label="Card number" id="card_number" name="card_number" inputMode="numeric" autoComplete="cc-number" placeholder="4242 4242 4242 4242" />
              <TextField label="Card holder name" id="card_holder" name="card_holder" autoComplete="cc-name" placeholder="Jane Customer" />
              <TextField label="Expiry date" id="card_expiry" name="card_expiry" autoComplete="cc-exp" placeholder="MM/YY" maxLength={5} />
              <TextField label="CVV" id="card_cvv" name="card_cvv" inputMode="numeric" autoComplete="cc-csc" placeholder="123" maxLength={4} />
            </div>
            <p className="muted">Card details are validated on this page only and are not sent with your order.</p>
          </div>
        ) : null}
        {paymentMethod === "mobile_money" ? (
          <div className="payment-card-form">
            <TextField label="Mobile money phone" id="mobile_money_phone" name="mobile_money_phone" inputMode="tel" autoComplete="tel" placeholder="+250 7xx xxx xxx" />
            <p className="muted">Mobile Money collection will be connected later. This checkout creates a pending order.</p>
          </div>
        ) : null}
        {paymentMethod === "cod" ? <p className="muted">Cash on Delivery will create a pending order for offline payment at delivery.</p> : null}
        {error ? <p className="form-error" role="alert">{error}</p> : null}
        {loading ? <p className="form-status">Placing your order...</p> : null}
      </section>
    </form>
  );
}
