import React from "react";
import { Link } from "../../routes/router.jsx";
import AuthForm from "../../components/forms/AuthForm";

export default function RegisterPage() {
  return (
    <section className="container auth-layout">
      <div className="auth-copy auth-copy--wide">
        <span className="eyebrow">Join AIDEP</span>
        <h1 className="title-lg">Create Account</h1>
        <p className="muted">Choose how you want to use AIDEP and create your account.</p>
        <AuthForm mode="register" />
        <p className="auth-switch">Already registered? <Link to="/login">Sign in</Link></p>
      </div>
    </section>
  );
}
