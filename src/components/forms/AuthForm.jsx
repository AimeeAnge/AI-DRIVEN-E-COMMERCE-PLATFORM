import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useToast } from "../../context/ToastContext.jsx";
import { takeAuthNotice, takePendingCartProduct } from "../../hooks/useCartActions";
import { useRouter } from "../../routes/router.jsx";
import { friendlyApiError, roleMismatchMessage } from "../../utils/apiErrors";
import Icon from "../common/Icon";
import TextField from "./TextField";

function destinationForRole(nextRole) {
  if (nextRole === "admin") return "/admin";
  if (nextRole === "merchant") return "/merchant";
  return "/dashboard";
}

export default function AuthForm({ mode = "login", allowedRoles }) {
  const { login, register, logout, loading, role, setRole } = useAuth();
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const { navigate } = useRouter();
  const [status, setStatus] = useState("");
  const [formError, setFormError] = useState("");
  const roles = allowedRoles || (mode === "register" ? ["customer", "merchant"] : ["customer", "merchant"]);

  useEffect(() => {
    if (!roles.includes(role)) {
      setRole(roles[0] || "customer");
    }
  }, [role, roles, setRole]);

  useEffect(() => {
    if (mode === "login") {
      const notice = takeAuthNotice();
      if (notice) setStatus(notice);
    }
  }, [mode]);

  async function handleSubmit(event) {
    event.preventDefault();
    const form = Object.fromEntries(new FormData(event.currentTarget).entries());
    setStatus("");
    setFormError("");
    try {
      const selectedRole = roles.includes(role) ? role : roles[0] || "customer";
      let response;
      if (mode === "register") {
        response = await register({ ...form, role: selectedRole });
        setStatus("Your account request was submitted. You can sign in once it is approved.");
      } else {
        response = await login(form);
        setStatus("Welcome back.");
      }
      const authData = response?.data || response || {};
      const nextRole = authData?.user?.role;
      if (!nextRole) {
        logout();
        setRole(selectedRole);
        setStatus("");
        setFormError("This account does not match the selected role.");
        showToast("This account does not match the selected role.", "error");
        return;
      }
      const mismatch = mode === "login" ? roleMismatchMessage(selectedRole, nextRole) : "";
      if (mismatch) {
        logout();
        setRole(selectedRole);
        setStatus("");
        setFormError("This account does not match the selected role.");
        showToast("This account does not match the selected role.", "error");
        return;
      }
      const pendingCartProductId = mode === "login" && nextRole === "customer" ? takePendingCartProduct() : null;
      if (pendingCartProductId) {
        await addToCart(pendingCartProductId, 1);
        navigate("/cart");
        return;
      }
      if (mode === "login" && nextRole !== "customer") {
        takePendingCartProduct();
      }
      navigate(destinationForRole(nextRole));
    } catch (authError) {
      console.log(authError);
      setStatus("");
      const message = friendlyApiError(
        authError,
        mode === "register"
          ? "We couldn't create your account right now. Please try again later."
          : "We couldn't sign you in right now. Please check your details and try again."
      );
      setFormError(message);
      showToast(message, "error");
    }
  }

  return (
    <form className="auth-form panel" onSubmit={handleSubmit}>
      <div className="role-toggle" role="group" aria-label="Account role" style={{ gridTemplateColumns: `repeat(${roles.length}, minmax(0, 1fr))` }}>
        {roles.map((nextRole) => (
          <button
            key={nextRole}
            type="button"
            className={role === nextRole ? "is-active" : ""}
            onClick={() => setRole(nextRole)}
          >
            <Icon name={nextRole === "merchant" ? "storefront" : nextRole === "admin" ? "admin_panel_settings" : "person"} size={18} />
            {nextRole}
          </button>
        ))}
      </div>
      {mode === "register" ? <TextField label="Full name" id="name" name="name" autoComplete="name" required /> : null}
      <TextField label="Email address" id="email" name="email" type="email" autoComplete="email" required />
      <TextField label="Password" id="password" name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} required />
      {mode === "register" && role === "merchant" ? <TextField label="Store name" id="storeName" name="storeName" helper="Use the public name customers will recognize." /> : null}
      {formError ? <p className="form-error" role="alert">{formError}</p> : null}
      {status ? <p className="form-status" role="status">{status}</p> : null}
      <button className="primary-button is-loading-aware" type="submit" disabled={loading} aria-busy={loading}>
        {loading ? "Please wait..." : mode === "register" ? "Create Account" : "Sign In"}
      </button>
    </form>
  );
}
