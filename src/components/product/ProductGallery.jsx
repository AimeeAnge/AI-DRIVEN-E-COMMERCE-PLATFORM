import React from "react";
import { resolveImageUrl } from "../../utils/images";
import Icon from "../common/Icon";

export default function ProductGallery({ product }) {
  const images = product?.images || (product?.primary_image ? [product.primary_image] : product?.imageUrl ? [{ url: product.imageUrl, alt: product.name }] : []);
  const mainImage = resolveImageUrl(images[0]) || resolveImageUrl(product?.primary_image) || resolveImageUrl(product?.imageUrl) || product?.image;

  return (
    <div className="product-gallery">
      <div className="product-gallery__main panel">
        {mainImage ? (
          <img src={mainImage} alt={images[0]?.alt || images[0]?.alt_text || product?.name || "Product"} />
        ) : (
          <div className="product-card__placeholder">
            <Icon name="image" size={42} />
          </div>
        )}
      </div>
      {images.length > 1 ? (
        <div className="product-gallery__thumbs">
          {images.slice(0, 4).map((image, index) => (
            <img key={image.url || image.image_url || index} src={resolveImageUrl(image)} alt={image.alt || image.alt_text || `${product?.name || "Product"} view ${index + 1}`} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
