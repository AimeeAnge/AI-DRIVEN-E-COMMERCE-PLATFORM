import React from "react";
import useApiResource from "../../hooks/useApiResource";
import { recommendationService } from "../../services/recommendationService";
import ProductGrid from "../product/ProductGrid";

export default function RecommendationGrid({ context, productId, title = "Recommended for you" }) {
  const loader = () => (productId ? recommendationService.forProduct(productId) : recommendationService.list({ context }));
  const { data, loading, error, reload } = useApiResource(loader, [context, productId]);

  return (
    <section className="page-section">
      <div className="section-heading">
        <div>
          <h2 className="title-md">{title}</h2>
          <p className="muted">Recommendations will appear as you explore products.</p>
        </div>
      </div>
      <ProductGrid products={data} loading={loading} error={error} onRetry={reload} />
    </section>
  );
}
