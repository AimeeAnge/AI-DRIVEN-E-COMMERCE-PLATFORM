import React, { useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import ProductFilters from "../../components/product/ProductFilters";
import ProductGrid from "../../components/product/ProductGrid";
import useApiResource from "../../hooks/useApiResource";
import { productService } from "../../services/productService";
import { useCart } from "../../context/CartContext";

export default function ProductListPage() {
  const [filters, setFilters] = useState({});
  const { addToCart } = useCart();
  const { data, loading, error, reload } = useApiResource(() => productService.list(filters), [JSON.stringify(filters)]);

  return (
    <div className="container page-section">
      <PageHeader
        eyebrow="Marketplace"
        title="Premium Collection"
        description="Filters and cards refactored from the Stitch shop screen."
      />
      <div className="catalog-layout">
        <ProductFilters onChange={setFilters} />
        <ProductGrid products={data} loading={loading} error={error} onRetry={reload} onAddToCart={addToCart} />
      </div>
    </div>
  );
}
