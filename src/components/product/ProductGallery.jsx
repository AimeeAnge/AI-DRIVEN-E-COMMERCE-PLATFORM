import React from "react";
import Icon from "../common/Icon";

export default function ProductGallery({ product }) {
  const images = product?.images || (product?.imageUrl ? [{ url: product.imageUrl, alt: product.name }] : []);
  const mainImage = images[0]?.url || product?.image;

  return (
    <div className="product-gallery">
      <div className="product-gallery__main panel">
        {mainImage ? (
          <img src={mainImage} alt={images[0]?.alt || product?.name || "Product"} />
        ) : (
          <div className="product-card__placeholder">
            <Icon name="image" size={42} />
          </div>
        )}
      </div>
      {images.length > 1 ? (
        <div className="product-gallery__thumbs">
          {images.slice(0, 4).map((image, index) => (
            <img key={image.url || index} src={image.url} alt={image.alt || `${product?.name || "Product"} view ${index + 1}`} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
