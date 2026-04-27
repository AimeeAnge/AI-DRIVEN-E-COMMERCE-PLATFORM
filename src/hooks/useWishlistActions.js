import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext.jsx";
import { useRouter } from "../routes/router.jsx";
import { productService } from "../services/productService";
import { friendlyApiError } from "../utils/apiErrors";
import { getEntityId } from "../utils/entity";
import { asArray } from "../utils/formatters";

const AUTH_NOTICE_KEY = "aidep.auth.notice";

function normalizeWishlist(response) {
  return asArray(response?.data || response);
}

export function wishlistProductFromItem(item) {
  const product = item?.product || {};
  return {
    ...product,
    id: product.id || item.product_id,
    product_id: item.product_id,
    wishlist_item_id: item.id,
    images: product.primary_image ? [product.primary_image] : product.images || []
  };
}

export default function useWishlistActions({ autoload = true } = {}) {
  const { token, role } = useAuth();
  const { navigate } = useRouter();
  const { showToast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function refreshWishlist() {
    if (!token || role !== "customer") {
      setItems([]);
      return [];
    }

    setLoading(true);
    setError("");
    try {
      const response = await productService.wishlist();
      const nextItems = normalizeWishlist(response);
      setItems(nextItems);
      return nextItems;
    } catch (wishlistError) {
      console.log(wishlistError);
      setError(friendlyApiError(wishlistError, "We couldn't load your wishlist right now."));
      return [];
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (autoload) {
      refreshWishlist();
    }
  }, [autoload, token, role]);

  const itemIdsByProduct = useMemo(() => {
    const ids = new Map();
    items.forEach((item) => {
      if (item?.product_id && item?.id) ids.set(item.product_id, item.id);
      if (item?.product?.id && item?.id) ids.set(item.product.id, item.id);
    });
    return ids;
  }, [items]);

  const savedProductIds = useMemo(() => new Set(itemIdsByProduct.keys()), [itemIdsByProduct]);

  async function addToWishlist(product) {
    const productId = typeof product === "string" ? product : getEntityId(product);
    setMessage("");
    setError("");

    if (!productId) return null;
    if (!token) {
      window.sessionStorage.setItem(AUTH_NOTICE_KEY, "Please sign in to save products.");
      navigate("/login");
      return null;
    }
    if (role !== "customer") {
      setError("Please use a customer account to save products.");
      showToast("Please use a customer account to save products.", "error");
      return null;
    }
    if (product?.status && product.status !== "active") {
      setError("This product is no longer available.");
      showToast("This product is no longer available.", "error");
      return null;
    }
    if (savedProductIds.has(productId)) {
      setMessage("This product is already in your wishlist.");
      showToast("This product is already in your wishlist.");
      return itemIdsByProduct.get(productId);
    }

    setLoading(true);
    try {
      const response = await productService.addWishlistItem(productId);
      const item = response?.data?.item || response?.item;
      setItems((current) => {
        if (current.some((currentItem) => currentItem.product_id === productId || currentItem.product?.id === productId)) {
          return current;
        }
        return [{ id: item?.id, product_id: productId, product }, ...current];
      });
      setMessage("Product saved to your wishlist.");
      showToast("Product saved to your wishlist.");
      await refreshWishlist();
      return item?.id;
    } catch (wishlistError) {
      console.log(wishlistError);
      const message = friendlyApiError(wishlistError, "We couldn't save this product right now.");
      setError(message);
      showToast(message, "error");
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function removeWishlistItem(itemId) {
    setMessage("");
    setError("");
    if (!itemId) return false;

    const previousItems = items;
    setItems((current) => current.filter((item) => item.id !== itemId));
    try {
      await productService.removeWishlistItem(itemId);
      setMessage("Product removed from your wishlist.");
      showToast("Product removed from your wishlist.");
      return true;
    } catch (wishlistError) {
      console.log(wishlistError);
      setItems(previousItems);
      const message = friendlyApiError(wishlistError, "We couldn't remove this product right now.");
      setError(message);
      showToast(message, "error");
      return false;
    }
  }

  async function toggleWishlist(product) {
    const productId = getEntityId(product);
    const itemId = product?.wishlist_item_id || itemIdsByProduct.get(productId);
    if (itemId) {
      return removeWishlistItem(itemId);
    }
    return addToWishlist(product);
  }

  return {
    items,
    products: items.map(wishlistProductFromItem),
    loading,
    error,
    message,
    savedProductIds,
    itemIdsByProduct,
    refreshWishlist,
    addToWishlist,
    removeWishlistItem,
    toggleWishlist,
    setMessage,
    setError
  };
}
