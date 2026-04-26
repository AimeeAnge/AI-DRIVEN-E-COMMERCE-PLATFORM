import React from "react";
import { Link } from "../../routes/router.jsx";
import { formatCurrency } from "../../utils/formatters";
import { getEntityId } from "../../utils/entity";
import Icon from "../common/Icon";

export default function ProductCard({ product, onAddToCart }) {
  const image = product?.imageUrl || product?.image || product?.images?.[0]?.url;
  const id = getEntityId(product);

  return (
    <article className="product-card">
      <div className="product-card__media">
        <Link to={id ? `/products/${id}` : "/products"} className="product-card__image">
          {image ? (
            <img src={image} alt={product?.name || "Product"} />
          ) : (
            <div className="product-card__placeholder">
              <Icon name="image" />
            </div>
          )}
        </Link>
        <button className="product-card__favorite" type="button" aria-label="Add to wishlist">
          <Icon name="favorite" size={20} />
        </button>
      </div>
      <div className="product-card__body">
        <div>
          <h3>
            <Link to={id ? `/products/${id}` : "/products"}>{product?.name || "Unnamed product"}</Link>
          </h3>
          {product?.description ? <p>{product.description}</p> : null}
        </div>
        <div className="product-card__footer">
          <strong>{formatCurrency(product?.price, product?.currency)}</strong>
          <button className="primary-button" type="button" disabled={!id} onClick={() => onAddToCart?.(id)}>
            <Icon name="shopping_cart" size={18} />
            Add
          </button>
        </div>
      </div>
    </article>
  );
}
