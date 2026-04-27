import React from "react";
import { Link } from "../../routes/router.jsx";
import AuthForm from "../../components/forms/AuthForm";

export default function AdminLoginPage() {
  return (
    <section className="container auth-layout">
      <div className="auth-copy auth-copy--wide">
        <span className="eyebrow">Admin Portal</span>
        <h1 className="title-lg">AIDEP Admin Access</h1>
        <p className="muted">Sign in with an administrator account to manage platform operations.</p>
        <AuthForm mode="login" allowedRoles={["admin"]} />
        <p className="auth-switch">Shopping or selling? <Link to="/login">Use public login</Link></p>
      </div>
    </section>
  );
}
