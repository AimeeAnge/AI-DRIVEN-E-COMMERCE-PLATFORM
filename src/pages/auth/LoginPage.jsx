import React from "react";
import { Link } from "../../routes/router.jsx";
import AuthForm from "../../components/forms/AuthForm";

const authImage = "https://lh3.googleusercontent.com/aida-public/AB6AXuAsS-zT87l1V8PQY7JPySPLhcVpm_Q8mcgNpMm9PEBHBcv8961gEXNm_3e3okPdWxc7mk-XV5sqXaOTQi7kXerhZkCtxhwMWf1R9LDLdYRy-coaUXoauh_MH_9-kPM60DuwpQXyAY4VeQv4WTGKyrE-u3GnfHNCj9RDomKEZuAYto5qaaexn10u5kNZVoL_kr_UaLucOZyHBbMdTCFxMHtoyTYVKXdM5bWjEJCFLLf9A5LnfLXdPv7TpMN7FlglUQrWhZcRZP90t-Lk";

export default function LoginPage() {
  return (
    <section className="container auth-layout">
      <div className="auth-art">
        <img src={authImage} alt="Modern retail access experience" />
        <div>
          <h2>Elevate Your Commerce Journey</h2>
          <p>Secure access for shoppers and merchants.</p>
        </div>
      </div>
      <div className="auth-copy">
        <span className="eyebrow">Secure access</span>
        <h1 className="title-lg">Welcome Back</h1>
        <p className="muted">Welcome back. Sign in to continue.</p>
        <AuthForm mode="login" allowedRoles={["customer", "merchant"]} />
        <p className="auth-switch">Need an account? <Link to="/register">Create one</Link></p>
      </div>
    </section>
  );
}
