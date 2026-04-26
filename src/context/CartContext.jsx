import React, { createContext, useContext, useMemo, useState } from "react";
import { cartService } from "../services/cartService";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function refreshCart() {
    setLoading(true);
    setError(null);
    try {
      const response = await cartService.getCart();
      setCart(response);
      return response;
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
    await refreshCart();
    return response;
  }

  const itemCount = cart?.itemCount || cart?.items?.reduce((total, item) => total + Number(item.quantity || 0), 0) || 0;

  const value = useMemo(
    () => ({ cart, itemCount, loading, error, refreshCart, addToCart }),
    [cart, itemCount, loading, error]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  return useContext(CartContext);
}
