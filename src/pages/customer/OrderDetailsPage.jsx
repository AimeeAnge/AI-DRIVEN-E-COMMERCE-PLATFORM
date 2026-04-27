import React from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import StatusState from "../../components/common/StatusState";
import useApiResource from "../../hooks/useApiResource";
import { orderService } from "../../services/orderService";
import { formatCurrency } from "../../utils/formatters";
import { customerOrderStatusLabels, formatOrderStatus, orderTimelineSteps } from "../../utils/orderStatus";

const navItems = [
  { to: "/dashboard", label: "Overview" },
  { to: "/dashboard/orders", label: "Orders" },
  { to: "/dashboard/wishlist", label: "Wishlist" }
];

function stepState(currentStatus, stepStatus) {
  const currentIndex = orderTimelineSteps.findIndex((step) => step.status === currentStatus);
  const stepIndex = orderTimelineSteps.findIndex((step) => step.status === stepStatus);
  if (currentStatus === "cancelled") return "is-muted";
  if (stepIndex < currentIndex) return "is-complete";
  if (stepIndex === currentIndex) return "is-current";
  return "";
}

export default function OrderDetailsPage({ params }) {
  const { data, loading, error, reload } = useApiResource(() => orderService.getById(params.id), [params.id]);
  const order = data?.data?.order || data?.order || data;

  return (
    <DashboardLayout title="Customer" description="Shopping account" navItems={navItems}>
      {loading ? <StatusState type="loading" title="Loading order" message="We're checking your order status." /> : null}
      {error ? <StatusState type="error" title="We couldn't load this order right now" message="Please try again later." actionLabel="Retry" onAction={reload} /> : null}
      {!loading && !error ? (
        <div className="dashboard-stack">
          <section className="panel order-detail-panel">
            <div className="section-heading">
              <div>
                <h1 className="title-md">{order?.order_number || "Order details"}</h1>
                <p className="muted">{formatOrderStatus(order?.status, customerOrderStatusLabels)}</p>
              </div>
              <span className="badge">{formatCurrency(order?.total_amount, order?.currency_code || "USD")}</span>
            </div>
            <div className="order-timeline" aria-label="Order progress">
              {orderTimelineSteps.map((step) => (
                <div key={step.status} className={`order-timeline__step ${stepState(order?.status, step.status)}`}>
                  <span />
                  <strong>{step.label}</strong>
                  <small>{step.detail}</small>
                </div>
              ))}
            </div>
            {order?.status === "cancelled" ? <p className="form-error">This order was cancelled.</p> : null}
          </section>
          <section className="panel order-detail-panel">
            <h2 className="title-md">Items</h2>
            <div className="dashboard-stack">
              {(order?.items || []).map((item) => (
                <div className="order-line" key={item.id}>
                  <span>{item.product_name}</span>
                  <span>x{item.quantity}</span>
                  <strong>{formatCurrency(item.total_price, order.currency_code || "USD")}</strong>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : null}
    </DashboardLayout>
  );
}
