import React, { useEffect, useState } from "react";
import { Link } from "../../routes/router.jsx";
import Icon from "../../components/common/Icon";

export default function CheckoutSuccessPage() {
  const [order, setOrder] = useState(null);

  useEffect(() => {
    const storedOrder = window.sessionStorage.getItem("aidep.checkout.lastOrder");
    if (storedOrder) {
      setOrder(JSON.parse(storedOrder));
    }
  }, []);

  return (
    <section className="container page-section success-page">
      <div className="panel">
        <Icon name="check_circle" size={52} filled />
        <h1 className="title-lg">Checkout Submitted</h1>
        <p className="muted">Thanks for shopping with AIDEP. Your order is ready for review.</p>
        {order?.order_number ? <p className="badge">Order {order.order_number}</p> : null}
        <Link className="primary-button" to="/dashboard/orders">View Orders</Link>
      </div>
    </section>
  );
}
