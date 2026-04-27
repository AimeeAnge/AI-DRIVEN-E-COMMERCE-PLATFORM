import React from "react";
import { Link } from "../../routes/router.jsx";
import { formatCurrency } from "../../utils/formatters";
import { getEntityId } from "../../utils/entity";
import { resolveImageUrl } from "../../utils/images";
import Icon from "../common/Icon";

export default function ProductCard({ product, onAddToCart, onProductClick, onWishlistToggle, isWishlisted = false }) {
  const image = resolveImageUrl(product?.images?.[0]) || resolveImageUrl(product?.primary_image) || resolveImageUrl(product?.imageUrl) || product?.image;
  const id = getEntityId(product);

  function handleWishlistClick(event) {
    event.preventDefault();
    event.stopPropagation();
    onWishlistToggle?.(product);
  }

  function handleAddToCartClick(event) {
    event.preventDefault();
    event.stopPropagation();
    onAddToCart?.(id);
  }

  return (
    <article className="product-card">
      <div className="product-card__media">
        <Link to={id ? `/products/${id}` : "/products"} className="product-card__image" onClick={() => onProductClick?.(product)}>
          {image ? (
            <img src={image} alt={product?.name || "Product"} />
          ) : (
            <div className="product-card__placeholder">
              <Icon name="image" />
            </div>
          )}
        </Link>
        <button
          className={`product-card__favorite ${isWishlisted ? "is-active" : ""}`}
          type="button"
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          onClick={handleWishlistClick}
        >
          <Icon name="favorite" size={20} filled={isWishlisted} />
        </button>
      </div>
      <div className="product-card__body">
        <div>
          <h3>
            <Link to={id ? `/products/${id}` : "/products"} onClick={() => onProductClick?.(product)}>{product?.name || "Unnamed product"}</Link>
          </h3>
          {product?.description ? <p>{product.description}</p> : null}
        </div>
        <div className="product-card__footer">
          <strong>{formatCurrency(product?.price, product?.currency_code || product?.currency)}</strong>
          <button className="primary-button" type="button" disabled={!id} onClick={handleAddToCartClick}>
            <Icon name="shopping_cart" size={18} />
            Add
          </button>
        </div>
      </div>
    </article>
  );
}
