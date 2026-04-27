import React from "react";
import { Link } from "../../routes/router.jsx";
import { formatCurrency } from "../../utils/formatters";

export default function OrderSummary({ cart, checkout = false, busy = false }) {
  const summary = cart?.summary || cart?.totals || {};
  const subtotal = summary.subtotal_amount ?? cart?.subtotal_amount ?? cart?.subtotal;
  const shipping = summary.shipping_amount ?? cart?.shipping_amount ?? cart?.shipping ?? "0.00";
  const tax = summary.tax_amount ?? cart?.tax_amount ?? cart?.tax ?? "0.00";
  const total = summary.total_amount ?? cart?.total_amount ?? cart?.total ?? subtotal;
  const currency = cart?.currency_code || cart?.currency || "USD";
  const hasItems = Boolean(cart?.items?.length);

  return (
    <aside className="order-summary panel">
      <h2 className="title-md">Order Summary</h2>
      <dl>
        <div><dt>Subtotal</dt><dd>{formatCurrency(subtotal, currency)}</dd></div>
        <div><dt>Shipping</dt><dd>{shipping === 0 || shipping === "0.00" ? "Free" : formatCurrency(shipping, currency)}</dd></div>
        <div><dt>Tax</dt><dd>{formatCurrency(tax, currency)}</dd></div>
        <div className="order-summary__total"><dt>Total</dt><dd>{formatCurrency(total, currency)}</dd></div>
      </dl>
      {checkout ? (
        <button className="primary-button is-loading-aware" type="submit" form="checkout-form" disabled={!hasItems || busy} aria-busy={busy}>
          {busy ? "Placing order..." : "Place Order"}
        </button>
      ) : (
        hasItems ? <Link className="primary-button" to="/checkout">Proceed to Checkout</Link> : <button className="primary-button" type="button" disabled>Proceed to Checkout</button>
      )}
    </aside>
  );
}
