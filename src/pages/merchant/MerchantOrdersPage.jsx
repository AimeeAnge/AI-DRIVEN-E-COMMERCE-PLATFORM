import React from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import DataTable from "../../components/dashboard/DataTable";
import useApiResource from "../../hooks/useApiResource";
import { merchantService } from "../../services/merchantService";
import { formatCurrency } from "../../utils/formatters";

const navItems = [
  { to: "/merchant", label: "Overview" },
  { to: "/merchant/products", label: "Products" },
  { to: "/merchant/orders", label: "Orders" },
  { to: "/merchant/analytics", label: "Analytics" }
];

export default function MerchantOrdersPage() {
  const { data, loading, error, reload } = useApiResource(() => merchantService.orders(), []);

  return (
    <DashboardLayout title="Merchant" description="Store operations" navItems={navItems}>
      <h1 className="title-md">Merchant Orders</h1>
      <DataTable
        data={data}
        loading={loading}
        error={error}
        onRetry={reload}
        emptyMessage="Customer orders will appear here when they're available."
        columns={[
          { key: "id", label: "Order" },
          { key: "customerName", label: "Customer" },
          { key: "total", label: "Total", render: (row) => formatCurrency(row.total) },
          { key: "status", label: "Status" }
        ]}
      />
    </DashboardLayout>
  );
}
