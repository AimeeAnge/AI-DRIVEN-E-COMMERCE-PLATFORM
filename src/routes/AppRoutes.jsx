import React, { useEffect, useMemo, useState } from "react";
import { RouterContext, matchRoute } from "./router.jsx";
import PublicLayout from "../layouts/PublicLayout";
import HomePage from "../pages/public/HomePage";
import ProductListPage from "../pages/public/ProductListPage";
import ProductDetailsPage from "../pages/public/ProductDetailsPage";
import CartPage from "../pages/public/CartPage";
import CheckoutPage from "../pages/public/CheckoutPage";
import CheckoutSuccessPage from "../pages/public/CheckoutSuccessPage";
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";
import DashboardPage from "../pages/customer/DashboardPage";
import OrderHistoryPage from "../pages/customer/OrderHistoryPage";
import WishlistPage from "../pages/customer/WishlistPage";
import MerchantDashboardPage from "../pages/merchant/MerchantDashboardPage";
import MerchantProductsPage from "../pages/merchant/MerchantProductsPage";
import MerchantOrdersPage from "../pages/merchant/MerchantOrdersPage";
import MerchantAnalyticsPage from "../pages/merchant/MerchantAnalyticsPage";
import AdminDashboardPage from "../pages/admin/AdminDashboardPage";
import AdminUsersPage from "../pages/admin/AdminUsersPage";
import AdminChatbotPage from "../pages/admin/AdminChatbotPage";
import AdminRecommendationsPage from "../pages/admin/AdminRecommendationsPage";
import { Link } from "./router.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const routes = [
  { path: "/", component: HomePage, layout: PublicLayout },
  { path: "/products", component: ProductListPage, layout: PublicLayout },
  { path: "/products/:id", component: ProductDetailsPage, layout: PublicLayout },
  { path: "/cart", component: CartPage, layout: PublicLayout, roles: ["customer"] },
  { path: "/checkout", component: CheckoutPage, layout: PublicLayout, roles: ["customer"] },
  { path: "/checkout/success", component: CheckoutSuccessPage, layout: PublicLayout },
  { path: "/login", component: LoginPage, layout: PublicLayout },
  { path: "/register", component: RegisterPage, layout: PublicLayout },
  { path: "/dashboard", component: DashboardPage, roles: ["customer"] },
  { path: "/dashboard/orders", component: OrderHistoryPage, roles: ["customer"] },
  { path: "/dashboard/wishlist", component: WishlistPage, roles: ["customer"] },
  { path: "/merchant", component: MerchantDashboardPage, roles: ["merchant"] },
  { path: "/merchant/products", component: MerchantProductsPage, roles: ["merchant"] },
  { path: "/merchant/orders", component: MerchantOrdersPage, roles: ["merchant"] },
  { path: "/merchant/analytics", component: MerchantAnalyticsPage, roles: ["merchant"] },
  { path: "/admin", component: AdminDashboardPage, roles: ["admin"] },
  { path: "/admin/users", component: AdminUsersPage, roles: ["admin"] },
  { path: "/admin/chatbot", component: AdminChatbotPage, roles: ["admin"] },
  { path: "/admin/recommendations", component: AdminRecommendationsPage, roles: ["admin"] }
];

function fallbackPath(role) {
  if (role === "admin") return "/admin";
  if (role === "merchant") return "/merchant";
  return "/dashboard";
}

function Redirect({ to, router }) {
  useEffect(() => {
    router.replace(to);
  }, [router, to]);

  return null;
}

function NotFound() {
  return (
    <PublicLayout>
      <section className="container page-section success-page">
        <div className="panel">
          <h1 className="title-lg">Page not found</h1>
          <p className="muted">That AIDEP route does not exist.</p>
          <Link className="primary-button" to="/">Return Home</Link>
        </div>
      </section>
    </PublicLayout>
  );
}

export default function AppRoutes() {
  const [path, setPath] = useState(window.location.pathname);
  const { token, role, loading } = useAuth();

  useEffect(() => {
    function handlePopState() {
      setPath(window.location.pathname);
    }
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const value = useMemo(
    () => ({
      path,
      navigate(to) {
        window.history.pushState({}, "", to);
        setPath(window.location.pathname);
        window.scrollTo({ top: 0, behavior: "smooth" });
      },
      replace(to) {
        window.history.replaceState({}, "", to);
        setPath(window.location.pathname);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }),
    [path]
  );

  const match = routes
    .map((route) => ({ route, params: matchRoute(route.path, path) }))
    .find((entry) => entry.params !== null);

  if (!match) {
    return (
      <RouterContext.Provider value={value}>
        <NotFound />
      </RouterContext.Provider>
    );
  }

  const Component = match.route.component;
  const Layout = match.route.layout;

  if (match.route.roles?.length) {
    if (loading && token) {
      return (
        <RouterContext.Provider value={value}>
          <PublicLayout>
            <section className="container page-section">
              <div className="state-box">Checking your session...</div>
            </section>
          </PublicLayout>
        </RouterContext.Provider>
      );
    }

    if (!token) {
      return (
        <RouterContext.Provider value={value}>
          <Redirect to="/login" router={value} />
        </RouterContext.Provider>
      );
    }

    if (!match.route.roles.includes(role)) {
      return (
        <RouterContext.Provider value={value}>
          <Redirect to={fallbackPath(role)} router={value} />
        </RouterContext.Provider>
      );
    }
  }

  const page = <Component params={match.params} />;

  return (
    <RouterContext.Provider value={value}>
      {Layout ? <Layout>{page}</Layout> : page}
    </RouterContext.Provider>
  );
}
