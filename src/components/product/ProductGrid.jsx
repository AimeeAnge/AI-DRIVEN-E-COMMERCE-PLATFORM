import React from "react";
import { asArray } from "../../utils/formatters";
import { getEntityId } from "../../utils/entity";
import StatusState from "../common/StatusState";
import ProductCard from "./ProductCard";

export default function ProductGrid({ products, loading, error, onRetry, onAddToCart }) {
  if (loading) {
    return <StatusState type="loading" title="Loading products" message="We're finding the latest products for you." />;
  }

  if (error) {
    return (
      <StatusState
        type="error"
        title="We couldn't load products right now"
        message="Please try again later."
        actionLabel="Try again"
        onAction={onRetry}
      />
    );
  }

  const items = asArray(products);
  if (!items.length) {
    return <StatusState title="No products yet" message="New products will appear here as they become available." />;
  }

  return (
    <div className="product-grid">
      {items.map((product, index) => (
        <ProductCard key={getEntityId(product) || index} product={product} onAddToCart={onAddToCart} />
      ))}
    </div>
  );
}
