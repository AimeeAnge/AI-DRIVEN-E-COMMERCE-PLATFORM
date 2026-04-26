import React, { useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import ProductFilters from "../../components/product/ProductFilters";
import ProductGrid from "../../components/product/ProductGrid";
import useApiResource from "../../hooks/useApiResource";
import useCartActions from "../../hooks/useCartActions";
import { productService } from "../../services/productService";

export default function ProductListPage() {
  const [filters, setFilters] = useState({});
  const { addProductToCart, cartMessage, cartError } = useCartActions();
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
        <div className="catalog-content">
          {cartError ? <p className="form-error" role="alert">{cartError}</p> : null}
          {cartMessage ? <p className="form-status" role="status">{cartMessage}</p> : null}
          <ProductGrid products={data} loading={loading} error={error} onRetry={reload} onAddToCart={addProductToCart} />
        </div>
      </div>
    </div>
  );
}
