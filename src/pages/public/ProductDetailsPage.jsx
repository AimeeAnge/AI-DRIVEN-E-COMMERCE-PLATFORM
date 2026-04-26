import React from "react";
import PageHeader from "../../components/common/PageHeader";
import ProductGallery from "../../components/product/ProductGallery";
import ProductSummary from "../../components/product/ProductSummary";
import RecommendationGrid from "../../components/recommendation/RecommendationGrid";
import StatusState from "../../components/common/StatusState";
import useApiResource from "../../hooks/useApiResource";
import useCartActions from "../../hooks/useCartActions";
import { productService } from "../../services/productService";

export default function ProductDetailsPage({ params }) {
  const { addProductToCart, cartMessage, cartError } = useCartActions();
  const { data, loading, error, reload } = useApiResource(() => productService.getById(params.id), [params.id]);
  const product = data?.product || data;

  if (loading) return <div className="container page-section"><StatusState type="loading" title="Loading product" message="We're getting the product details ready." /></div>;
  if (error) return <div className="container page-section"><StatusState type="error" title="We couldn't load this product right now" message="Please try again later." actionLabel="Retry" onAction={reload} /></div>;

  return (
    <div className="container page-section">
      <PageHeader eyebrow="Product" title={product?.name || "Product details"} description="Explore details, availability, and helpful recommendations." />
      {cartError ? <p className="form-error" role="alert">{cartError}</p> : null}
      {cartMessage ? <p className="form-status" role="status">{cartMessage}</p> : null}
      <div className="product-detail-layout">
        <ProductGallery product={product} />
        <ProductSummary product={product} onAddToCart={addProductToCart} />
      </div>
      <RecommendationGrid productId={params.id} title="Complete the experience" />
    </div>
  );
}
