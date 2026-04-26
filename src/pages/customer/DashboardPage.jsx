import React from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import DashboardOverview from "../../components/dashboard/DashboardOverview";
import RecommendationCarousel from "../../components/recommendation/RecommendationCarousel";

const navItems = [
  { to: "/dashboard", label: "Overview" },
  { to: "/dashboard/orders", label: "Orders" },
  { to: "/dashboard/wishlist", label: "Wishlist" }
];

export default function DashboardPage() {
  return (
    <DashboardLayout title="Customer" description="Shopping account" navItems={navItems}>
      <div className="dashboard-stack">
        <DashboardOverview
          metrics={[
            { icon: "shopping_bag", label: "Orders", value: "-", detail: "Recent purchases" },
            { icon: "favorite", label: "Wishlist", value: "-", detail: "Saved products" },
            { icon: "auto_awesome", label: "Recommendations", value: "-", detail: "Personal picks" }
          ]}
        />
        <RecommendationCarousel context="dashboard" title="Dashboard recommendations" />
      </div>
    </DashboardLayout>
  );
}
