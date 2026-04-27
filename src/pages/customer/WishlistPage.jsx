import React from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import ProductGrid from "../../components/product/ProductGrid";
import useCartActions from "../../hooks/useCartActions";
import useWishlistActions from "../../hooks/useWishlistActions";

const navItems = [
  { to: "/dashboard", label: "Overview" },
  { to: "/dashboard/orders", label: "Orders" },
  { to: "/dashboard/wishlist", label: "Wishlist" }
];

export default function WishlistPage() {
  const { addProductToCart, cartMessage, cartError } = useCartActions();
  const {
    products,
    loading,
    error,
    message,
    savedProductIds,
    refreshWishlist,
    toggleWishlist
  } = useWishlistActions();

  return (
    <DashboardLayout title="Customer" description="Shopping account" navItems={navItems}>
      <h1 className="title-md">Wishlist</h1>
      {cartError ? <p className="form-error" role="alert">{cartError}</p> : null}
      {cartMessage ? <p className="form-status" role="status">{cartMessage}</p> : null}
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      {message ? <p className="form-status" role="status">{message}</p> : null}
      <ProductGrid
        products={products}
        loading={loading}
        error={null}
        onRetry={refreshWishlist}
        onAddToCart={addProductToCart}
        onWishlistToggle={toggleWishlist}
        savedProductIds={savedProductIds}
        emptyMessage="No saved products yet. Products you save will appear here."
      />
    </DashboardLayout>
  );
}
