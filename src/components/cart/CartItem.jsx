import React from "react";
import { formatCurrency } from "../../utils/formatters";
import { getEntityId } from "../../utils/entity";
import { resolveImageUrl } from "../../utils/images";
import Icon from "../common/Icon";

export default function CartItem({ item, onUpdate, onRemove }) {
  const product = item.product || item;
  const image = resolveImageUrl(product.primary_image) || resolveImageUrl(product.images?.[0]) || resolveImageUrl(product.imageUrl) || product.image;
  const itemId = getEntityId(item);

  return (
    <article className="cart-item panel">
      <div className="cart-item__image">
        {image ? <img src={image} alt={product.name || "Cart item"} /> : <Icon name="image" />}
      </div>
      <div className="cart-item__details">
        <h3>{product.name || "Cart item"}</h3>
        {product.variant ? <p className="muted">{product.variant}</p> : null}
        <div className="quantity-control" aria-label="Quantity controls">
          <button type="button" aria-label={`Decrease quantity for ${product.name || "cart item"}`} onClick={() => onUpdate?.(itemId, Math.max(1, Number(item.quantity || 1) - 1))}>
            <Icon name="remove" size={18} />
          </button>
          <span>{item.quantity || 1}</span>
          <button type="button" aria-label={`Increase quantity for ${product.name || "cart item"}`} onClick={() => onUpdate?.(itemId, Number(item.quantity || 1) + 1)}>
            <Icon name="add" size={18} />
          </button>
        </div>
      </div>
      <div className="cart-item__price">
        <strong>{formatCurrency(item.line_total || item.total || product.price, product.currency_code || product.currency)}</strong>
        <button className="ghost-button danger" type="button" onClick={() => onRemove?.(itemId)}>
          <Icon name="delete" size={18} />
          Remove
        </button>
      </div>
    </article>
  );
}
