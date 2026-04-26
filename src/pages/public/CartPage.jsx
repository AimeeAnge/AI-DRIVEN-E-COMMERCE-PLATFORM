import React, { useEffect } from "react";
import CartItem from "../../components/cart/CartItem";
import OrderSummary from "../../components/cart/OrderSummary";
import PageHeader from "../../components/common/PageHeader";
import StatusState from "../../components/common/StatusState";
import RecommendationCarousel from "../../components/recommendation/RecommendationCarousel";
import { useCart } from "../../context/CartContext";
import { cartService } from "../../services/cartService";
import { asArray } from "../../utils/formatters";
import { getEntityId } from "../../utils/entity";

export default function CartPage() {
  const { cart, loading, error, refreshCart } = useCart();
  const items = asArray(cart);

  useEffect(() => {
    refreshCart();
  }, []);

  async function updateItem(itemId, quantity) {
    await cartService.updateItem(itemId, quantity);
    refreshCart();
  }

  async function removeItem(itemId) {
    await cartService.removeItem(itemId);
    refreshCart();
  }

  return (
    <div className="container page-section">
      <PageHeader eyebrow="Commerce" title="Your Cart" description="Review your selected items before checkout." />
      {loading ? <StatusState type="loading" title="Loading cart" message="We're getting your cart ready." /> : null}
      {error ? <StatusState type="error" title="We couldn't load your cart right now" message="Please try again later." actionLabel="Retry" onAction={refreshCart} /> : null}
      {!loading && !error && !items.length ? <StatusState title="Your cart is empty" message="Items you add will appear here." /> : null}
      {items.length ? (
        <div className="cart-layout">
          <div className="cart-list">
            {items.map((item) => <CartItem key={getEntityId(item)} item={item} onUpdate={updateItem} onRemove={removeItem} />)}
          </div>
          <OrderSummary cart={cart} />
        </div>
      ) : null}
      <RecommendationCarousel context="cart" title="Ideas for this cart" />
    </div>
  );
}
