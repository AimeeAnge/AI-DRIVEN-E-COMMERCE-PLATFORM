import React from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import DashboardOverview from "../../components/dashboard/DashboardOverview";
import StatusState from "../../components/common/StatusState";
import useApiResource from "../../hooks/useApiResource";
import { analyticsService } from "../../services/analyticsService";

const navItems = [
  { to: "/admin", label: "Overview" },
  { to: "/admin/users", label: "Users" },
  { to: "/admin/chatbot", label: "Chatbot" },
  { to: "/admin/recommendations", label: "Recommendations" }
];

function hasDashboardData(data) {
  return data && Object.keys(data).length > 0;
}

export default function AdminDashboardPage() {
  const { data, loading, error, reload } = useApiResource(() => analyticsService.admin(), []);
  const hasData = hasDashboardData(data);

  return (
    <DashboardLayout title="Admin" description="Platform governance" navItems={navItems}>
      <h1 className="title-md">Admin Dashboard</h1>
      {loading ? <StatusState type="loading" title="Loading admin dashboard" /> : null}
      {error ? <StatusState type="error" title="We couldn't load the admin dashboard right now" message="Please try again later." actionLabel="Retry" onAction={reload} /> : null}
      {!loading && !error && !hasData ? <StatusState title="No admin dashboard data yet" message="Platform metrics will appear here when they're available." /> : null}
      {!loading && !error && hasData ? (
        <DashboardOverview
          metrics={[
            { icon: "group", label: "Users", value: data?.usersCount, detail: "Platform accounts" },
            { icon: "smart_toy", label: "Conversations", value: data?.chatbotConversations, detail: "Assistant usage" },
            { icon: "auto_awesome", label: "Recommendation CTR", value: data?.recommendationCtr, detail: "AI performance" }
          ]}
        />
      ) : null}
    </DashboardLayout>
  );
}
