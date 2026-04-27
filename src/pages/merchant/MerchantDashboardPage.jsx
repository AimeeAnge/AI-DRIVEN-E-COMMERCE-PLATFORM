import React from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import DashboardOverview from "../../components/dashboard/DashboardOverview";
import DataTable from "../../components/dashboard/DataTable";
import StatusState from "../../components/common/StatusState";
import useApiResource from "../../hooks/useApiResource";
import { Link } from "../../routes/router.jsx";
import { merchantService } from "../../services/merchantService";
import { paginationTotal, unwrapData } from "../../utils/apiData";
import { asArray, formatCurrency } from "../../utils/formatters";
import { formatOrderStatus, merchantOrderStatusLabels } from "../../utils/orderStatus";

const navItems = [
  { to: "/merchant", label: "Overview" },
  { to: "/merchant/products", label: "Products" },
  { to: "/merchant/orders", label: "Orders" },
  { to: "/merchant/analytics", label: "Analytics" }
];

export default function MerchantDashboardPage() {
  const { data, loading, error, reload } = useApiResource(async () => {
    const [orders, products, analytics] = await Promise.all([
      merchantService.orders(),
      merchantService.products(),
      merchantService.analytics()
    ]);
    const analyticsData = unwrapData(analytics);
    const summary = analyticsData?.summary || {};

    return {
      ordersCount: paginationTotal(orders),
      productsCount: paginationTotal(products),
      grossSales: summary.gross_sales ?? 0,
      currency: summary.currency_code || "USD",
      recentOrders: asArray(orders).slice(0, 5)
    };
  }, []);

  return (
    <DashboardLayout title="Merchant" description="Store operations" navItems={navItems}>
      <div className="section-heading">
        <div>
          <h1 className="title-md">Merchant Dashboard</h1>
          <p className="muted">Track your catalog, orders, and sales from one place.</p>
        </div>
        <div className="page-header__actions">
          <Link className="primary-button" to="/merchant/products">Add product</Link>
          <Link className="secondary-button" to="/merchant/orders">View orders</Link>
          <Link className="secondary-button" to="/merchant/analytics">View analytics</Link>
        </div>
      </div>
      {loading ? <StatusState type="loading" title="Loading merchant dashboard" /> : null}
      {error ? <StatusState type="error" title="We couldn't load your merchant dashboard right now" message="Please try again later." actionLabel="Retry" onAction={reload} /> : null}
      {!loading && !error ? (
        <div className="dashboard-stack">
          <DashboardOverview
            metrics={[
              { icon: "orders", label: "Orders", value: data?.ordersCount ?? 0, detail: "Fulfillment queue" },
              { icon: "inventory_2", label: "Products", value: data?.productsCount ?? 0, detail: "Catalog count" },
              { icon: "monitoring", label: "Revenue", value: formatCurrency(data?.grossSales ?? 0, data?.currency || "USD"), detail: "Store analytics" }
            ]}
          />
          <div className="section-heading dashboard-subheading">
            <div>
              <h2 className="title-md">Recent Merchant Orders</h2>
              <p className="muted">Latest customer orders for your store.</p>
            </div>
          </div>
          <DataTable
            data={data?.recentOrders || []}
            emptyMessage="No merchant orders yet."
            columns={[
              { key: "order_number", label: "Order" },
              { key: "customer", label: "Customer", render: (row) => row.customer?.full_name || "Customer" },
              { key: "merchant_total", label: "Total", render: (row) => formatCurrency(row.merchant_total, row.currency_code || "USD") },
              { key: "order_status", label: "Status", render: (row) => formatOrderStatus(row.order_status, merchantOrderStatusLabels) }
            ]}
          />
        </div>
      ) : null}
    </DashboardLayout>
  );
}
