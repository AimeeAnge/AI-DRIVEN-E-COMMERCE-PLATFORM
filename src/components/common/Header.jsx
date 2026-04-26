import React, { useEffect, useRef, useState } from "react";
import { Link, useRouter } from "../../routes/router.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useCart } from "../../context/CartContext";
import Icon from "./Icon";

function dashboardPath(role) {
  if (role === "admin") return "/admin";
  if (role === "merchant") return "/merchant";
  return "/dashboard";
}

export default function Header() {
  const headerRef = useRef(null);
  const { token, role, user, logout } = useAuth();
  const { navigate } = useRouter();
  const { itemCount } = useCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
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
    setIsAccountOpen(false);
  }

  function handleLogout() {
    logout();
    closeMenu();
    navigate("/login");
  }

  const accountLabel = user?.full_name || user?.email || "Account";
  const accountDestination = dashboardPath(role);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return undefined;

    function updateHeaderHeight() {
      document.documentElement.style.setProperty("--site-header-height", `${header.offsetHeight}px`);
    }

    updateHeaderHeight();
    const resizeObserver = new ResizeObserver(updateHeaderHeight);
    resizeObserver.observe(header);
    window.addEventListener("resize", updateHeaderHeight);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateHeaderHeight);
    };
  }, []);

  return (
    <header className="site-header" ref={headerRef}>
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
          {token ? (
            <div className="account-menu">
              <button
                className="icon-button"
                type="button"
                aria-label="Open account menu"
                aria-haspopup="menu"
                aria-expanded={isAccountOpen}
                onClick={() => {
                  setIsAccountOpen((open) => !open);
                  setIsMenuOpen(false);
                }}
              >
                <Icon name="person" />
              </button>
              {isAccountOpen ? (
                <div className="account-menu__panel" role="menu">
                  <div className="account-menu__identity">
                    <strong>{accountLabel}</strong>
                    <span>{role}</span>
                  </div>
                  <Link to={accountDestination} role="menuitem" onClick={closeMenu}>
                    Dashboard
                  </Link>
                  <button type="button" role="menuitem" onClick={handleLogout}>
                    Logout
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <Link to="/login" className="icon-button" aria-label="Account" onClick={closeMenu}>
              <Icon name="person" />
            </Link>
          )}
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
