import React from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import DashboardOverview from "../../components/dashboard/DashboardOverview";
import StatusState from "../../components/common/StatusState";
import useApiResource from "../../hooks/useApiResource";
import { analyticsService } from "../../services/analyticsService";

const navItems = [
  { to: "/merchant", label: "Overview" },
  { to: "/merchant/products", label: "Products" },
  { to: "/merchant/orders", label: "Orders" },
  { to: "/merchant/analytics", label: "Analytics" }
];

function hasAnalyticsData(data) {
  return data && Object.keys(data).length > 0;
}

export default function MerchantAnalyticsPage() {
  const { data, loading, error, reload } = useApiResource(() => analyticsService.merchant(), []);
  const hasData = hasAnalyticsData(data);

  return (
    <DashboardLayout title="Merchant" description="Store operations" navItems={navItems}>
      <h1 className="title-md">Analytics</h1>
      {loading ? <StatusState type="loading" title="Loading merchant analytics" /> : null}
      {error ? <StatusState type="error" title="We couldn't load merchant analytics right now" message="Please try again later." actionLabel="Retry" onAction={reload} /> : null}
      {!loading && !error && !hasData ? <StatusState title="No merchant analytics yet" message="Store insights will appear here when they're available." /> : null}
      {!loading && !error && hasData ? (
        <>
          <DashboardOverview
            metrics={[
              { icon: "trending_up", label: "Conversion", value: data?.conversionRate, detail: "Merchant analytics" },
              { icon: "visibility", label: "Views", value: data?.views, detail: "Product traffic" },
              { icon: "payments", label: "Average Order", value: data?.averageOrderValue, detail: "Revenue quality" }
            ]}
          />
          <div className="soft-panel analytics-placeholder">Charts and trends will appear here as your store grows.</div>
        </>
      ) : null}
    </DashboardLayout>
  );
}
