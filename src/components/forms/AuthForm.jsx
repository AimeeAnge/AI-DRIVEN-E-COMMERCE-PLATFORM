import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import Icon from "../common/Icon";
import TextField from "./TextField";

export default function AuthForm({ mode = "login" }) {
  const { login, register, loading, error, role, setRole } = useAuth();
  const [status, setStatus] = useState("");
  const roles = mode === "register" ? ["customer", "merchant"] : ["customer", "merchant", "admin"];

  useEffect(() => {
    if (mode === "register" && role === "admin") {
      setRole("customer");
    }
  }, [mode, role, setRole]);

  async function handleSubmit(event) {
    event.preventDefault();
    const form = Object.fromEntries(new FormData(event.currentTarget).entries());
    setStatus("");
    try {
      const selectedRole = mode === "register" && role === "admin" ? "customer" : role;
      if (mode === "register") {
        await register({ ...form, role: selectedRole });
        setStatus("Your account request was submitted. You can sign in once it is approved.");
      } else {
        await login({ ...form, role: selectedRole });
        setStatus("Welcome back.");
      }
    } catch (authError) {
      console.log(authError);
      setStatus("");
    }
  }

  return (
    <form className="auth-form panel" onSubmit={handleSubmit}>
      <div className="role-toggle" role="group" aria-label="Account role">
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
      {mode === "register" && role === "merchant" ? <TextField label="Store name" id="storeName" name="storeName" /> : null}
      {error ? <p className="form-error" role="alert">{mode === "register" ? "We couldn't create your account right now. Please try again later." : "We couldn't sign you in right now. Please check your details and try again."}</p> : null}
      {status ? <p className="form-status" role="status">{status}</p> : null}
      <button className="primary-button" type="submit" disabled={loading}>
        {loading ? "Please wait..." : mode === "register" ? "Create Account" : "Sign In"}
      </button>
    </form>
  );
}
