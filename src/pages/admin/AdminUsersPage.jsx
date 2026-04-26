import React from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import DataTable from "../../components/dashboard/DataTable";
import useApiResource from "../../hooks/useApiResource";
import { analyticsService } from "../../services/analyticsService";

const navItems = [
  { to: "/admin", label: "Overview" },
  { to: "/admin/users", label: "Users" },
  { to: "/admin/chatbot", label: "Chatbot" },
  { to: "/admin/recommendations", label: "Recommendations" }
];

export default function AdminUsersPage() {
  const { data, loading, error, reload } = useApiResource(() => analyticsService.users(), []);

  return (
    <DashboardLayout title="Admin" description="Platform governance" navItems={navItems}>
      <h1 className="title-md">Users Management</h1>
      <DataTable
        data={data}
        loading={loading}
        error={error}
        onRetry={reload}
        emptyMessage="User accounts will appear here when they're available."
        columns={[
          { key: "name", label: "Name" },
          { key: "email", label: "Email" },
          { key: "role", label: "Role" },
          { key: "status", label: "Status" }
        ]}
      />
    </DashboardLayout>
  );
}
