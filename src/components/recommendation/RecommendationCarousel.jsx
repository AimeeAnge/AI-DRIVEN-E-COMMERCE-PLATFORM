import React from "react";
import useApiResource from "../../hooks/useApiResource";
import { recommendationService } from "../../services/recommendationService";
import { asArray } from "../../utils/formatters";
import StatusState from "../common/StatusState";
import ProductCard from "../product/ProductCard";

export default function RecommendationCarousel({ context, productId, title = "AI recommendations" }) {
  const loader = () => (productId ? recommendationService.forProduct(productId) : recommendationService.list({ context }));
  const { data, loading, error, reload } = useApiResource(loader, [context, productId]);
  const items = asArray(data);

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
      {!loading && !error && !items.length ? (
        <StatusState title="No recommendations yet" message="Recommendations will appear as you explore products." />
      ) : null}
      {items.length ? (
        <div className="recommendation-strip">
          {items.map((product) => (
            <ProductCard key={product.id || product._id || product.slug} product={product} />
          ))}
        </div>
      ) : null}
    </section>
  );
}
