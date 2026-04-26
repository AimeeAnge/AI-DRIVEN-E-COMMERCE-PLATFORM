import React from "react";
import { Link } from "../../routes/router.jsx";
import Icon from "../../components/common/Icon";

export default function CheckoutSuccessPage() {
  return (
    <section className="container page-section success-page">
      <div className="panel">
        <Icon name="check_circle" size={52} filled />
        <h1 className="title-lg">Checkout Submitted</h1>
        <p className="muted">Thanks for shopping with AIDEP. Your order is ready for review.</p>
        <Link className="primary-button" to="/dashboard/orders">View Orders</Link>
      </div>
    </section>
  );
}
