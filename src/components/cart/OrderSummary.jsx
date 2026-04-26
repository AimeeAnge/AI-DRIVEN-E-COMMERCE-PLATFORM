import React from "react";
import { Link } from "../../routes/router.jsx";
import { formatCurrency } from "../../utils/formatters";

export default function OrderSummary({ cart, checkout = false }) {
  const subtotal = cart?.subtotal ?? cart?.totals?.subtotal;
  const shipping = cart?.shipping ?? cart?.totals?.shipping;
  const tax = cart?.tax ?? cart?.totals?.tax;
  const total = cart?.total ?? cart?.totals?.total;

  return (
    <aside className="order-summary panel">
      <h2 className="title-md">Order Summary</h2>
      <dl>
        <div><dt>Subtotal</dt><dd>{formatCurrency(subtotal)}</dd></div>
        <div><dt>Shipping</dt><dd>{shipping === 0 ? "Free" : formatCurrency(shipping)}</dd></div>
        <div><dt>Tax</dt><dd>{formatCurrency(tax)}</dd></div>
        <div className="order-summary__total"><dt>Total</dt><dd>{formatCurrency(total)}</dd></div>
      </dl>
      {checkout ? (
        <button className="primary-button" type="submit" form="checkout-form">Place Order</button>
      ) : (
        <Link className="primary-button" to="/checkout">Proceed to Checkout</Link>
      )}
    </aside>
  );
}
