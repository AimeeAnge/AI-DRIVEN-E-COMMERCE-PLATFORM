import React, { useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import DataTable from "../../components/dashboard/DataTable";
import useApiResource from "../../hooks/useApiResource";
import { useToast } from "../../context/ToastContext.jsx";
import { merchantService } from "../../services/merchantService";
import { friendlyApiError } from "../../utils/apiErrors";
import { formatCurrency } from "../../utils/formatters";
import { formatOrderStatus, merchantOrderStatusLabels, nextMerchantOrderAction } from "../../utils/orderStatus";

const navItems = [
  { to: "/merchant", label: "Overview" },
  { to: "/merchant/products", label: "Products" },
  { to: "/merchant/orders", label: "Orders" },
  { to: "/merchant/analytics", label: "Analytics" }
];

export default function MerchantOrdersPage() {
  const { showToast } = useToast();
  const { data, loading, error, reload } = useApiResource(() => merchantService.orders(), []);
  const [actionError, setActionError] = useState("");
  const [actionStatus, setActionStatus] = useState("");
  const [updatingOrderId, setUpdatingOrderId] = useState("");

  async function updateOrderStatus(orderId, nextStatus) {
    setActionError("");
    setActionStatus("");
    setUpdatingOrderId(orderId);
    try {
      await merchantService.updateOrderStatus(orderId, nextStatus);
      setActionStatus("Order status updated.");
      showToast("Order status updated.");
      await reload();
    } catch (statusError) {
      console.log(statusError);
      const message = friendlyApiError(statusError, "We couldn't update this order right now.");
      setActionError(message);
      showToast(message, "error");
    } finally {
      setUpdatingOrderId("");
    }
  }

  return (
    <DashboardLayout title="Merchant" description="Store operations" navItems={navItems}>
      <h1 className="title-md">Merchant Orders</h1>
      {actionError ? <p className="form-error" role="alert">{actionError}</p> : null}
      {actionStatus ? <p className="form-status" role="status">{actionStatus}</p> : null}
      <DataTable
        data={data}
        loading={loading}
        error={error}
        onRetry={reload}
        emptyMessage="No customer orders yet."
        columns={[
          { key: "order_number", label: "Order" },
          { key: "customer", label: "Customer", render: (row) => row.customer?.full_name || "Customer" },
          {
            key: "items",
            label: "Items",
            render: (row) => row.items?.map((item) => `${item.product_name} x${item.quantity}`).join(", ") || ""
          },
          { key: "merchant_total", label: "Total", render: (row) => formatCurrency(row.merchant_total, row.currency_code || "USD") },
          { key: "order_status", label: "Status", render: (row) => formatOrderStatus(row.order_status, merchantOrderStatusLabels) },
          {
            key: "actions",
            label: "Action",
            render: (row) => {
              const action = nextMerchantOrderAction(row.order_status);
              if (!action) return <span className="muted">No action</span>;
              return (
                <button
                  className="secondary-button table-action"
                  type="button"
                  disabled={updatingOrderId === row.order_id}
                  onClick={() => updateOrderStatus(row.order_id, action.status)}
                >
                  {updatingOrderId === row.order_id ? "Updating..." : action.label}
                </button>
              );
            }
          }
        ]}
      />
    </DashboardLayout>
  );
}
