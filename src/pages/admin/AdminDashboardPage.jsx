import React, { useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import DashboardOverview from "../../components/dashboard/DashboardOverview";
import DataTable from "../../components/dashboard/DataTable";
import StatusState from "../../components/common/StatusState";
import useApiResource from "../../hooks/useApiResource";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext.jsx";
import { analyticsService } from "../../services/analyticsService";
import { friendlyApiError } from "../../utils/apiErrors";
import { getEntityId } from "../../utils/entity";

const navItems = [
  { to: "/admin", label: "Overview" },
  { to: "/admin/users", label: "Users" },
  { to: "/admin/chatbot", label: "Chatbot" },
  { to: "/admin/recommendations", label: "Recommendations" }
];

const statusLabels = {
  active: "Active",
  pending: "Pending",
  suspended: "Suspended",
  disabled: "Disabled/Banned"
};

function formatDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(value));
}

function displayName(user) {
  return user?.full_name || user?.email || "Unnamed user";
}

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { data, loading, error, reload } = useApiResource(() => analyticsService.admin(), []);
  const [statusMessage, setStatusMessage] = useState("");
  const [statusError, setStatusError] = useState("");
  const [updatingUserId, setUpdatingUserId] = useState("");

  async function handleStatusChange(targetUser, nextStatus) {
    const targetUserId = getEntityId(targetUser);
    if (!targetUserId || targetUser.status === nextStatus) return;

    setUpdatingUserId(targetUserId);
    setStatusError("");
    setStatusMessage("");
    try {
      await analyticsService.updateUserStatus(targetUserId, nextStatus);
      setStatusMessage(`${displayName(targetUser)} is now ${statusLabels[nextStatus]}.`);
      showToast(`${displayName(targetUser)} is now ${statusLabels[nextStatus]}.`);
      await reload();
    } catch (statusUpdateError) {
      console.log(statusUpdateError);
      const message = friendlyApiError(statusUpdateError, "We couldn't update this account right now. Please try again.");
      setStatusError(message);
      showToast(message, "error");
    } finally {
      setUpdatingUserId("");
    }
  }

  return (
    <DashboardLayout title="Admin" description="Platform governance" navItems={navItems}>
      <div className="section-heading">
        <div>
          <h1 className="title-md">Admin Dashboard</h1>
          <p className="muted">Monitor accounts and keep platform access tidy.</p>
        </div>
      </div>
      {loading ? <StatusState type="loading" title="Loading admin dashboard" /> : null}
      {error ? <StatusState type="error" title="We couldn't load the admin dashboard right now" message="Please try again later." actionLabel="Retry" onAction={reload} /> : null}
      {statusError ? <p className="form-error" role="alert">{statusError}</p> : null}
      {statusMessage ? <p className="form-status" role="status">{statusMessage}</p> : null}
      {!loading && !error ? (
        <div className="dashboard-stack">
          <DashboardOverview
            metrics={[
              { icon: "group", label: "Users", value: data?.usersCount ?? 0, detail: "Platform accounts" },
              { icon: "verified_user", label: "Active users", value: data?.activeUsersCount ?? 0, detail: "Enabled access" },
              { icon: "block", label: "Disabled users", value: data?.disabledUsersCount ?? 0, detail: "Restricted access" },
              { icon: "person", label: "Customers", value: data?.customerCount ?? 0, detail: "Shopper accounts" },
              { icon: "storefront", label: "Merchants", value: data?.merchantCount ?? 0, detail: "Seller accounts" }
            ]}
          />
          <div className="section-heading dashboard-subheading">
            <div>
              <h2 className="title-md">Recent Users</h2>
              <p className="muted">Only account fields needed for operations are shown.</p>
            </div>
          </div>
          <DataTable
            data={data?.recentUsers || []}
            emptyMessage="No users yet."
            columns={[
              { key: "full_name", label: "Name", render: (row) => displayName(row) },
              { key: "email", label: "Email" },
              { key: "role", label: "Role", render: (row) => <span className="badge">{row.role}</span> },
              { key: "status", label: "Status", render: (row) => statusLabels[row.status] || row.status },
              { key: "created_at", label: "Created", render: (row) => formatDate(row.created_at) },
              {
                key: "actions",
                label: "Access",
                render: (row) => {
                  const rowId = getEntityId(row);
                  const isCurrentAdmin = rowId && rowId === getEntityId(user);
                  return (
                    <select
                      className="select status-select"
                      aria-label={`Set status for ${displayName(row)}`}
                      value={row.status}
                      disabled={updatingUserId === rowId || isCurrentAdmin}
                      onChange={(event) => handleStatusChange(row, event.target.value)}
                    >
                      {row.status === "pending" ? <option value="pending" disabled>Pending</option> : null}
                      <option value="active">Active</option>
                      <option value="suspended">Suspended</option>
                      <option value="disabled">Disabled/Banned</option>
                    </select>
                  );
                }
              }
            ]}
          />
        </div>
      ) : null}
    </DashboardLayout>
  );
}
