import React from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import DashboardOverview from "../../components/dashboard/DashboardOverview";
import RecommendationCarousel from "../../components/recommendation/RecommendationCarousel";
import StatusState from "../../components/common/StatusState";
import useApiResource from "../../hooks/useApiResource";
import { orderService } from "../../services/orderService";
import { productService } from "../../services/productService";
import { recommendationService } from "../../services/recommendationService";
import { paginationTotal } from "../../utils/apiData";
import { asArray } from "../../utils/formatters";

const navItems = [
  { to: "/dashboard", label: "Overview" },
  { to: "/dashboard/orders", label: "Orders" },
  { to: "/dashboard/wishlist", label: "Wishlist" }
];

export default function DashboardPage() {
  const { data, loading, error, reload } = useApiResource(async () => {
    const [orders, wishlist, recommendations] = await Promise.all([
      orderService.list(),
      productService.wishlist(),
      recommendationService.list({ context: "user" })
    ]);

    return {
      ordersCount: paginationTotal(orders),
      wishlistCount: asArray(wishlist?.data || wishlist).length,
      recommendationsCount: asArray(recommendations?.data || recommendations).length
    };
  }, []);

  return (
    <DashboardLayout title="Customer" description="Shopping account" navItems={navItems}>
      <div className="dashboard-stack">
        {loading ? <StatusState type="loading" title="Loading customer dashboard" /> : null}
        {error ? (
          <StatusState
            type="error"
            title="We couldn't load your customer dashboard right now"
            message="Please try again later."
            actionLabel="Retry"
            onAction={reload}
          />
        ) : null}
        {!loading && !error ? (
          <DashboardOverview
            metrics={[
              { icon: "shopping_bag", label: "Orders", value: data?.ordersCount ?? 0, detail: "Recent purchases" },
              { icon: "favorite", label: "Wishlist", value: data?.wishlistCount ?? 0, detail: "Saved products" },
              { icon: "auto_awesome", label: "Recommendations", value: data?.recommendationsCount ?? 0, detail: "Personal picks" }
            ]}
          />
        ) : null}
        <RecommendationCarousel context="dashboard" title="Dashboard recommendations" />
      </div>
    </DashboardLayout>
  );
}
