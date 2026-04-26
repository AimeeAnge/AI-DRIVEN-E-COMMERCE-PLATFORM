import React from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import DashboardOverview from "../../components/dashboard/DashboardOverview";
import StatusState from "../../components/common/StatusState";
import useApiResource from "../../hooks/useApiResource";
import { recommendationService } from "../../services/recommendationService";

const navItems = [
  { to: "/admin", label: "Overview" },
  { to: "/admin/users", label: "Users" },
  { to: "/admin/chatbot", label: "Chatbot" },
  { to: "/admin/recommendations", label: "Recommendations" }
];

function hasPerformanceData(data) {
  return data && Object.keys(data).length > 0;
}

export default function AdminRecommendationsPage() {
  const { data, loading, error, reload } = useApiResource(() => recommendationService.performance(), []);
  const hasData = hasPerformanceData(data);

  return (
    <DashboardLayout title="Admin" description="Platform governance" navItems={navItems}>
      <h1 className="title-md">Recommendation Performance</h1>
      {loading ? <StatusState type="loading" title="Loading recommendation performance" /> : null}
      {error ? <StatusState type="error" title="We couldn't load recommendation performance right now" message="Please try again later." actionLabel="Retry" onAction={reload} /> : null}
      {!loading && !error && !hasData ? <StatusState title="No recommendation performance yet" message="Recommendation insights will appear here when they're available." /> : null}
      {!loading && !error && hasData ? (
        <>
          <DashboardOverview
            metrics={[
              { icon: "ads_click", label: "Click rate", value: data?.clickRate, detail: "Recommendation engagement" },
              { icon: "shopping_cart", label: "Cart adds", value: data?.cartAdds, detail: "Attributed actions" },
              { icon: "model_training", label: "Model version", value: data?.modelVersion, detail: "Backend supplied" }
            ]}
          />
          <div className="soft-panel analytics-placeholder">Performance charts will appear here when recommendations are active.</div>
        </>
      ) : null}
    </DashboardLayout>
  );
}
