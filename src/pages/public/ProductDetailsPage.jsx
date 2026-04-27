import React, { useEffect } from "react";
import PageHeader from "../../components/common/PageHeader";
import ProductGallery from "../../components/product/ProductGallery";
import ProductSummary from "../../components/product/ProductSummary";
import RecommendationGrid from "../../components/recommendation/RecommendationGrid";
import StatusState from "../../components/common/StatusState";
import useApiResource from "../../hooks/useApiResource";
import useCartActions from "../../hooks/useCartActions";
import useWishlistActions from "../../hooks/useWishlistActions";
import { productService } from "../../services/productService";
import { eventService } from "../../services/eventService";
import { getEntityId } from "../../utils/entity";

export default function ProductDetailsPage({ params }) {
  const { addProductToCart, cartMessage, cartError } = useCartActions();
  const { toggleWishlist, savedProductIds, message: wishlistMessage, error: wishlistError } = useWishlistActions();
  const { data, loading, error, reload } = useApiResource(() => productService.getById(params.id), [params.id]);
  const product = data?.data?.product || data?.product || data;
  const productId = getEntityId(product);

  useEffect(() => {
    if (params.id) {
      eventService.safelyTrack({
        product_id: params.id,
        source_context: "product",
        event_type: "click",
        metadata: { action: "view_product" }
      });
    }
  }, [params.id]);

  if (loading) return <div className="container page-section"><StatusState type="loading" title="Loading product" message="We're getting the product details ready." /></div>;
  if (error) return <div className="container page-section"><StatusState type="error" title="We couldn't load this product right now" message="Please try again later." actionLabel="Retry" onAction={reload} /></div>;

  return (
    <div className="container page-section">
      <PageHeader eyebrow="Product" title={product?.name || "Product details"} description="Explore details, availability, and helpful recommendations." />
      {cartError ? <p className="form-error" role="alert">{cartError}</p> : null}
      {cartMessage ? <p className="form-status" role="status">{cartMessage}</p> : null}
      {wishlistError ? <p className="form-error" role="alert">{wishlistError}</p> : null}
      {wishlistMessage ? <p className="form-status" role="status">{wishlistMessage}</p> : null}
      <div className="product-detail-layout">
        <ProductGallery product={product} />
        <ProductSummary
          product={product}
          onAddToCart={addProductToCart}
          onWishlistToggle={toggleWishlist}
          isWishlisted={savedProductIds.has(productId)}
        />
      </div>
      <RecommendationGrid productId={params.id} title="Complete the experience" />
    </div>
  );
}
