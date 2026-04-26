import React from "react";
import { Link } from "../../routes/router.jsx";
import useApiResource from "../../hooks/useApiResource";
import { productService } from "../../services/productService";
import ProductGrid from "../../components/product/ProductGrid";
import RecommendationCarousel from "../../components/recommendation/RecommendationCarousel";
import Icon from "../../components/common/Icon";

const heroImage = "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1600&q=80";
const categories = [
  ["Electronics", "Next-gen tech gear", "https://images.unsplash.com/photo-1491553895911-0055eca6402d?auto=format&fit=crop&w=900&q=80"],
  ["Fashion", "Adaptive retail style", "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=900&q=80"],
  ["Home Decor", "Clean modern spaces", "https://images.unsplash.com/photo-1583847268964-b28dc2f51f92?auto=format&fit=crop&w=900&q=80"],
  ["Wellness", "Daily care essentials", "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=900&q=80"]
];

export default function HomePage() {
  const { data, loading, error, reload } = useApiResource(() => productService.list({ featured: true }), []);

  return (
    <>
      <section className="hero-section container">
        <img src={heroImage} alt="Modern workspace with high-tech gadgets" />
        <div>
          <span className="eyebrow">AI-driven commerce</span>
          <h1 className="title-xl">Smart Shopping Redefined.</h1>
          <p>Experience a mobile-first marketplace prepared for AI recommendations, real catalog data, and role-based commerce workflows.</p>
          <div className="hero-actions">
            <Link className="primary-button" to="/products">Shop Products</Link>
            <Link className="secondary-button" to="/register">Join AIDEP</Link>
          </div>
        </div>
      </section>
      <section className="page-section container">
        <div className="section-heading">
          <div>
            <h2 className="title-md">Explore Categories</h2>
            <p className="muted">Curated collections for every shopping moment.</p>
          </div>
          <Link className="ghost-button" to="/products">View All <Icon name="arrow_forward" size={18} /></Link>
        </div>
        <div className="category-grid">
          {categories.map(([name, description, image]) => (
            <Link key={name} to={`/products?category=${encodeURIComponent(name)}`} className="category-tile">
              <img src={image} alt={`${name} category`} />
              <div>
                <h3>{name}</h3>
                <p>{description}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
      <section className="page-section container">
        <div className="section-heading">
          <div>
            <h2 className="title-md">Featured Products</h2>
            <p className="muted">Fresh finds and popular picks will appear here.</p>
          </div>
        </div>
        <ProductGrid products={data} loading={loading} error={error} onRetry={reload} />
      </section>
      <div className="container">
        <RecommendationCarousel context="home" title="Personalized discovery" />
      </div>
    </>
  );
}
