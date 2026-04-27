import React from "react";
import { formatCurrency } from "../../utils/formatters";
import Icon from "../common/Icon";

export default function ProductSummary({ product, onAddToCart, onWishlistToggle, isWishlisted = false }) {
  const id = product?.id || product?._id || product?.slug;

  return (
    <section className="product-summary">
      {product?.category ? <span className="badge">{product.category.name || product.category}</span> : null}
      <h1 className="title-lg">{product?.name || "Product details"}</h1>
      <strong className="product-summary__price">{formatCurrency(product?.price, product?.currency_code || product?.currency)}</strong>
      {product?.description ? <p className="muted">{product.description}</p> : null}
      <div className="product-summary__actions">
        <button className="primary-button" type="button" disabled={!id} onClick={() => onAddToCart?.(id)}>
          <Icon name="shopping_bag" />
          Add to Cart
        </button>
        <button className="secondary-button" type="button" onClick={() => onWishlistToggle?.(product)}>
          <Icon name="favorite" filled={isWishlisted} />
          {isWishlisted ? "Saved" : "Wishlist"}
        </button>
      </div>
      <div className="soft-panel product-summary__promise">
        <p><Icon name="local_shipping" /> Delivery, warranty, and availability details will appear here when available.</p>
      </div>
    </section>
  );
}
