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

export default function AdminChatbotPage() {
  const { data, loading, error, reload } = useApiResource(() => analyticsService.chatbotConversations(), []);

  return (
    <DashboardLayout title="Admin" description="Platform governance" navItems={navItems}>
      <h1 className="title-md">Chatbot Conversations</h1>
      <DataTable
        data={data}
        loading={loading}
        error={error}
        onRetry={reload}
        emptyMessage="Chatbot conversations will appear here when they're available."
        columns={[
          { key: "id", label: "Conversation" },
          { key: "userEmail", label: "User" },
          { key: "status", label: "Status" },
          { key: "updatedAt", label: "Updated" }
        ]}
      />
    </DashboardLayout>
  );
}
