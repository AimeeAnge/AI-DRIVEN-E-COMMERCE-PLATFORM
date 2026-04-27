import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useRouter } from "../routes/router.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { eventService } from "../services/eventService";
import { friendlyApiError } from "../utils/apiErrors";

const PENDING_CART_PRODUCT_KEY = "aidep.pendingCartProductId";
const AUTH_NOTICE_KEY = "aidep.auth.notice";

export function savePendingCartProduct(productId) {
  if (productId) {
    window.sessionStorage.setItem(PENDING_CART_PRODUCT_KEY, productId);
  }
  window.sessionStorage.setItem(AUTH_NOTICE_KEY, "Please sign in to add products to your cart.");
}

export function takePendingCartProduct() {
  const productId = window.sessionStorage.getItem(PENDING_CART_PRODUCT_KEY);
  window.sessionStorage.removeItem(PENDING_CART_PRODUCT_KEY);
  return productId;
}

export function takeAuthNotice() {
  const notice = window.sessionStorage.getItem(AUTH_NOTICE_KEY);
  window.sessionStorage.removeItem(AUTH_NOTICE_KEY);
  return notice;
}

export default function useCartActions() {
  const { token, role } = useAuth();
  const { addToCart } = useCart();
  const { navigate } = useRouter();
  const { showToast } = useToast();
  const [cartMessage, setCartMessage] = useState("");
  const [cartError, setCartError] = useState("");
  const [cartBusy, setCartBusy] = useState(false);

  async function addProductToCart(productId, quantity = 1) {
    setCartMessage("");
    setCartError("");

    if (!productId) return;
    if (!token) {
      savePendingCartProduct(productId);
      navigate("/login");
      return;
    }
    if (role !== "customer") {
      setCartError("Please use a customer account to shop.");
      showToast("Please use a customer account to shop.", "error");
      return;
    }

    setCartBusy(true);
    try {
      await addToCart(productId, quantity);
      eventService.safelyTrack({
        product_id: productId,
        source_context: "cart",
        event_type: "add_to_cart",
        metadata: { quantity }
      });
      setCartMessage("Added to your cart.");
      showToast("Added to your cart.");
    } catch (cartActionError) {
      console.log(cartActionError);
      const message = friendlyApiError(cartActionError, "We couldn't add this product to your cart right now.");
      setCartError(message);
      showToast(message, "error");
    } finally {
      setCartBusy(false);
    }
  }

  return { addProductToCart, cartMessage, cartError, cartBusy, setCartMessage, setCartError };
}
