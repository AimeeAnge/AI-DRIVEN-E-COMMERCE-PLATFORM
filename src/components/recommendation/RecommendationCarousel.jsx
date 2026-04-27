import React from "react";
import useApiResource from "../../hooks/useApiResource";
import useCartActions from "../../hooks/useCartActions";
import useWishlistActions from "../../hooks/useWishlistActions";
import { recommendationService } from "../../services/recommendationService";
import { eventService } from "../../services/eventService";
import { asArray } from "../../utils/formatters";
import { getEntityId } from "../../utils/entity";
import StatusState from "../common/StatusState";
import ProductCard from "../product/ProductCard";

export default function RecommendationCarousel({ context, productId, title = "Recommendations" }) {
  const loader = () => (productId ? recommendationService.forProduct(productId) : recommendationService.list({ context }));
  const { data, loading, error, reload } = useApiResource(loader, [context, productId]);
  const { addProductToCart, cartMessage, cartError } = useCartActions();
  const { toggleWishlist, savedProductIds, message: wishlistMessage, error: wishlistError } = useWishlistActions();
  const items = asArray(data);

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
          <span className="eyebrow">Recommendations</span>
          <h2 className="title-md">{title}</h2>
        </div>
      </div>
      {loading ? <StatusState type="loading" title="Loading recommendations" message="We're preparing ideas for you." /> : null}
      {error ? <StatusState type="error" title="We couldn't load recommendations right now" message="Please try again later." actionLabel="Retry" onAction={reload} /> : null}
      {cartError ? <p className="form-error" role="alert">{cartError}</p> : null}
      {cartMessage ? <p className="form-status" role="status">{cartMessage}</p> : null}
      {wishlistError ? <p className="form-error" role="alert">{wishlistError}</p> : null}
      {wishlistMessage ? <p className="form-status" role="status">{wishlistMessage}</p> : null}
      {!loading && !error && !items.length ? (
        <StatusState title="No recommendations yet" message="Recommendations will appear as you explore products." />
      ) : null}
      {items.length ? (
        <div className="recommendation-strip">
          {items.map((product, index) => (
            <ProductCard
              key={getEntityId(product) || index}
              product={product}
              onAddToCart={addProductToCart}
              onProductClick={trackRecommendationClick}
              onWishlistToggle={toggleWishlist}
              isWishlisted={savedProductIds.has(getEntityId(product))}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
