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

const routes = [
  { path: "/", component: HomePage, layout: PublicLayout },
  { path: "/products", component: ProductListPage, layout: PublicLayout },
  { path: "/products/:id", component: ProductDetailsPage, layout: PublicLayout },
  { path: "/cart", component: CartPage, layout: PublicLayout },
  { path: "/checkout", component: CheckoutPage, layout: PublicLayout },
  { path: "/checkout/success", component: CheckoutSuccessPage, layout: PublicLayout },
  { path: "/login", component: LoginPage, layout: PublicLayout },
  { path: "/register", component: RegisterPage, layout: PublicLayout },
  { path: "/dashboard", component: DashboardPage },
  { path: "/dashboard/orders", component: OrderHistoryPage },
  { path: "/dashboard/wishlist", component: WishlistPage },
  { path: "/merchant", component: MerchantDashboardPage },
  { path: "/merchant/products", component: MerchantProductsPage },
  { path: "/merchant/orders", component: MerchantOrdersPage },
  { path: "/merchant/analytics", component: MerchantAnalyticsPage },
  { path: "/admin", component: AdminDashboardPage },
  { path: "/admin/users", component: AdminUsersPage },
  { path: "/admin/chatbot", component: AdminChatbotPage },
  { path: "/admin/recommendations", component: AdminRecommendationsPage }
];

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
  const page = <Component params={match.params} />;

  return (
    <RouterContext.Provider value={value}>
      {Layout ? <Layout>{page}</Layout> : page}
    </RouterContext.Provider>
  );
}
