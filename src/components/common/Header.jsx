import React, { useState } from "react";
import { Link } from "../../routes/router.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useCart } from "../../context/CartContext";
import Icon from "./Icon";

export default function Header() {
  const { token, role } = useAuth();
  const { itemCount } = useCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navLinks = [
    { to: "/", label: "Home" },
    { to: "/products", label: "Products" },
    { to: "/cart", label: "Cart" },
    ...(token
      ? [
          { to: "/dashboard", label: "Dashboard" },
          ...(role === "merchant" ? [{ to: "/merchant", label: "Merchant" }] : []),
          ...(role === "admin" ? [{ to: "/admin", label: "Admin" }] : [])
        ]
      : [
          { to: "/login", label: "Login" },
          { to: "/register", label: "Register" }
        ])
  ];

  function closeMenu() {
    setIsMenuOpen(false);
  }

  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Link to="/" className="brand" aria-label="AIDEP home">
          AIDEP
        </Link>
        <nav id="mobile-main-navigation" className={`site-nav ${isMenuOpen ? "is-open" : ""}`} aria-label="Main navigation">
          {navLinks.map((link) => (
            <Link key={link.to} to={link.to} onClick={closeMenu}>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="header-actions">
          <label className="header-search">
            <span className="sr-only">Search products</span>
            <Icon name="search" size={19} />
            <input type="search" placeholder="Search products..." />
          </label>
          <Link to="/login" className="icon-button" aria-label="Account" onClick={closeMenu}>
            <Icon name="person" />
          </Link>
          <Link to="/cart" className="icon-button cart-link" aria-label="Cart" onClick={closeMenu}>
            <Icon name="shopping_cart" />
            {itemCount > 0 ? <span className="cart-link__badge">{itemCount}</span> : null}
          </Link>
          <button
            className="icon-button menu-toggle"
            type="button"
            aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-main-navigation"
            onClick={() => setIsMenuOpen((open) => !open)}
          >
            <Icon name={isMenuOpen ? "close" : "menu"} />
          </button>
        </div>
      </div>
    </header>
  );
}
