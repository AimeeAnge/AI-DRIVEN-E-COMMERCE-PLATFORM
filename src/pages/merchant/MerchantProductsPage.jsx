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

export default function MerchantProductsPage() {
  const { data, loading, error, reload } = useApiResource(() => merchantService.products(), []);

  return (
    <DashboardLayout title="Merchant" description="Store operations" navItems={navItems}>
      <div className="section-heading">
        <div>
          <h1 className="title-md">Product Management</h1>
          <p className="muted">Manage products and keep your catalog organized.</p>
        </div>
        <button className="primary-button" type="button">Add Product</button>
      </div>
      <DataTable
        data={data}
        loading={loading}
        error={error}
        onRetry={reload}
        emptyMessage="Your products will appear here when they're available."
        columns={[
          { key: "name", label: "Product" },
          { key: "sku", label: "SKU" },
          { key: "price", label: "Price", render: (row) => formatCurrency(row.price) },
          { key: "status", label: "Status" }
        ]}
      />
    </DashboardLayout>
  );
}
