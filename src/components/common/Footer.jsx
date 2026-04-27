import React from "react";
import { Link } from "../../routes/router.jsx";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container site-footer__inner">
        <div>
          <strong>AIDEP</strong>
          <p>AI-driven commerce UI prepared for real products, orders, recommendations, and support.</p>
        </div>
        <nav aria-label="Footer navigation">
          <Link to="/products">Products</Link>
          <Link to="/about">About</Link>
          <Link to="/merchant">Merchant</Link>
          <Link to="/admin-login">Admin Portal</Link>
        </nav>
      </div>
    </footer>
  );
}
