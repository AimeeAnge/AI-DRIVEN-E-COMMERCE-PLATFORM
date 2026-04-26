import React from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import ProductGrid from "../../components/product/ProductGrid";
import useApiResource from "../../hooks/useApiResource";
import { productService } from "../../services/productService";

const navItems = [
  { to: "/dashboard", label: "Overview" },
  { to: "/dashboard/orders", label: "Orders" },
  { to: "/dashboard/wishlist", label: "Wishlist" }
];

export default function WishlistPage() {
  const { data, loading, error, reload } = useApiResource(() => productService.wishlist(), []);

  return (
    <DashboardLayout title="Customer" description="Shopping account" navItems={navItems}>
      <h1 className="title-md">Wishlist</h1>
      <ProductGrid products={data} loading={loading} error={error} onRetry={reload} />
    </DashboardLayout>
  );
}
