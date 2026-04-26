import React from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import DataTable from "../../components/dashboard/DataTable";
import useApiResource from "../../hooks/useApiResource";
import { orderService } from "../../services/orderService";
import { formatCurrency } from "../../utils/formatters";

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
        emptyMessage="Your orders will appear here after checkout."
        columns={[
          { key: "id", label: "Order" },
          { key: "status", label: "Status" },
          { key: "total", label: "Total", render: (row) => formatCurrency(row.total) },
          { key: "createdAt", label: "Date" }
        ]}
      />
    </DashboardLayout>
  );
}
