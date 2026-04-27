import React from "react";
import useApiResource from "../../hooks/useApiResource";
import useCartActions from "../../hooks/useCartActions";
import useWishlistActions from "../../hooks/useWishlistActions";
import { recommendationService } from "../../services/recommendationService";
import { eventService } from "../../services/eventService";
import { getEntityId } from "../../utils/entity";
import ProductGrid from "../product/ProductGrid";

export default function RecommendationGrid({ context, productId, title = "Recommended for you" }) {
  const loader = () => (productId ? recommendationService.forProduct(productId) : recommendationService.list({ context }));
  const { data, loading, error, reload } = useApiResource(loader, [context, productId]);
  const { addProductToCart, cartMessage, cartError } = useCartActions();
  const { toggleWishlist, savedProductIds, message: wishlistMessage, error: wishlistError } = useWishlistActions();

  function trackRecommendationClick(product) {
    eventService.safelyTrack({
      product_id: getEntityId(product),
      source_context: context || "recommendation",
      event_type: "click",
      metadata: { recommendation_context: context, source_product_id: productId }
    });
  }

  return (
    <section className="page-section">
      <div className="section-heading">
        <div>
          <h2 className="title-md">{title}</h2>
          <p className="muted">Recommendations will appear as you explore products.</p>
        </div>
      </div>
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
        onProductClick={trackRecommendationClick}
        onWishlistToggle={toggleWishlist}
        savedProductIds={savedProductIds}
      />
    </section>
  );
}
