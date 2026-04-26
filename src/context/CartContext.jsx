import React, { createContext, useContext, useMemo, useState } from "react";
import { cartService } from "../services/cartService";

const CartContext = createContext(null);

function normalizeCart(response) {
  return response?.data?.cart || response?.cart || response?.data || response || null;
}

export function CartProvider({ children }) {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function refreshCart() {
    setLoading(true);
    setError(null);
    try {
      const response = await cartService.getCart();
      const nextCart = normalizeCart(response);
      setCart(nextCart);
      return nextCart;
    } catch (cartError) {
      console.log(cartError);
      setError(cartError);
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function addToCart(productId, quantity = 1) {
    const response = await cartService.addItem(productId, quantity);
    const nextCart = normalizeCart(response);
    setCart(nextCart);
    return response;
  }

  async function updateCartItem(itemId, quantity) {
    const response = await cartService.updateItem(itemId, quantity);
    const nextCart = normalizeCart(response);
    setCart(nextCart);
    return response;
  }

  async function removeCartItem(itemId) {
    const response = await cartService.removeItem(itemId);
    const nextCart = normalizeCart(response);
    setCart(nextCart);
    return response;
  }

  function clearCart() {
    setCart((current) => current ? { ...current, items: [], summary: { ...(current.summary || {}), item_count: 0, subtotal_amount: "0.00" } } : current);
  }

  const itemCount = cart?.summary?.item_count || cart?.itemCount || cart?.items?.reduce((total, item) => total + Number(item.quantity || 0), 0) || 0;

  const value = useMemo(
    () => ({ cart, itemCount, loading, error, refreshCart, addToCart, updateCartItem, removeCartItem, clearCart }),
    [cart, itemCount, loading, error]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  return useContext(CartContext);
}
