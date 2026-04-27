import React, { useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import ProductFilters from "../../components/product/ProductFilters";
import ProductGrid from "../../components/product/ProductGrid";
import useApiResource from "../../hooks/useApiResource";
import useCartActions from "../../hooks/useCartActions";
import useWishlistActions from "../../hooks/useWishlistActions";
import { productService } from "../../services/productService";
import { eventService } from "../../services/eventService";
import { getEntityId } from "../../utils/entity";

export default function ProductListPage() {
  const [filters, setFilters] = useState({});
  const { addProductToCart, cartMessage, cartError } = useCartActions();
  const { toggleWishlist, savedProductIds, message: wishlistMessage, error: wishlistError } = useWishlistActions();
  const { data, loading, error, reload } = useApiResource(() => productService.list(filters), [JSON.stringify(filters)]);

  function trackProductClick(product) {
    eventService.safelyTrack({
      product_id: getEntityId(product),
      source_context: "search",
      event_type: "click"
    });
  }

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
          {wishlistError ? <p className="form-error" role="alert">{wishlistError}</p> : null}
          {wishlistMessage ? <p className="form-status" role="status">{wishlistMessage}</p> : null}
          <ProductGrid
            products={data}
            loading={loading}
            error={error}
            onRetry={reload}
            onAddToCart={addProductToCart}
            onProductClick={trackProductClick}
            onWishlistToggle={toggleWishlist}
            savedProductIds={savedProductIds}
          />
        </div>
      </div>
    </div>
  );
}
