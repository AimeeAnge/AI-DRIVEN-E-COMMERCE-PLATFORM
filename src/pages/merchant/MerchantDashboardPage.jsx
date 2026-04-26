import React from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import DashboardOverview from "../../components/dashboard/DashboardOverview";
import StatusState from "../../components/common/StatusState";
import useApiResource from "../../hooks/useApiResource";
import { merchantService } from "../../services/merchantService";

const navItems = [
  { to: "/merchant", label: "Overview" },
  { to: "/merchant/products", label: "Products" },
  { to: "/merchant/orders", label: "Orders" },
  { to: "/merchant/analytics", label: "Analytics" }
];

function hasDashboardData(data) {
  return data && Object.keys(data).length > 0;
}

export default function MerchantDashboardPage() {
  const { data, loading, error, reload } = useApiResource(() => merchantService.dashboard(), []);
  const hasData = hasDashboardData(data);

  return (
    <DashboardLayout title="Merchant" description="Store operations" navItems={navItems}>
      <h1 className="title-md">Merchant Dashboard</h1>
      {loading ? <StatusState type="loading" title="Loading merchant dashboard" /> : null}
      {error ? <StatusState type="error" title="We couldn't load your merchant dashboard right now" message="Please try again later." actionLabel="Retry" onAction={reload} /> : null}
      {!loading && !error && !hasData ? <StatusState title="No merchant dashboard data yet" message="Your store metrics will appear here when they're available." /> : null}
      {!loading && !error && hasData ? (
        <DashboardOverview
          metrics={[
            { icon: "inventory_2", label: "Products", value: data?.productsCount, detail: "Catalog count" },
            { icon: "orders", label: "Open Orders", value: data?.openOrders, detail: "Fulfillment queue" },
            { icon: "monitoring", label: "Revenue", value: data?.revenue, detail: "Store performance" }
          ]}
        />
      ) : null}
    </DashboardLayout>
  );
}
