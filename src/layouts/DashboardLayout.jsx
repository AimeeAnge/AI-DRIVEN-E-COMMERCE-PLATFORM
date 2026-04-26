import React from "react";
import Header from "../components/common/Header";
import { Link } from "../routes/router.jsx";

export default function DashboardLayout({ title, description, navItems, children }) {
  return (
    <>
      <Header />
      <main className="app-shell dashboard-layout">
        <div className="container dashboard-grid">
          <aside className="dashboard-sidebar panel">
            <strong>{title}</strong>
            <p>{description}</p>
            <nav>
              {navItems.map((item) => (
                <Link key={item.to} to={item.to}>
                  {item.label}
                </Link>
              ))}
            </nav>
          </aside>
          <section className="dashboard-content">{children}</section>
        </div>
      </main>
    </>
  );
}
