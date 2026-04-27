import React from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import DataTable from "../../components/dashboard/DataTable";
import useApiResource from "../../hooks/useApiResource";
import { Link } from "../../routes/router.jsx";
import { orderService } from "../../services/orderService";
import { formatCurrency } from "../../utils/formatters";
import { customerOrderStatusLabels, formatOrderStatus } from "../../utils/orderStatus";

const navItems = [
  { to: "/dashboard", label: "Overview" },
  { to: "/dashboard/orders", label: "Orders" },
  { to: "/dashboard/wishlist", label: "Wishlist" }
];

export default function OrderHistoryPage() {
  const { data, loading, error, reload } = useApiResource(() => orderService.list(), []);

  return (
    <DashboardLayout title="Customer" description="Shopping account" navItems={navItems}>
      <h1 className="title-md">Order History</h1>
      <DataTable
        data={data}
        loading={loading}
        error={error}
        onRetry={reload}
        emptyMessage="No orders yet. Your orders will appear here after checkout."
        columns={[
          {
            key: "order_number",
            label: "Order",
            render: (row) => <Link className="table-link" to={`/dashboard/orders/${row.id}`}>{row.order_number}</Link>
          },
          { key: "status", label: "Status", render: (row) => formatOrderStatus(row.status, customerOrderStatusLabels) },
          { key: "total_amount", label: "Total", render: (row) => formatCurrency(row.total_amount, row.currency_code || "USD") },
          { key: "created_at", label: "Date", render: (row) => row.created_at ? new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(row.created_at)) : "" }
        ]}
      />
    </DashboardLayout>
  );
}
