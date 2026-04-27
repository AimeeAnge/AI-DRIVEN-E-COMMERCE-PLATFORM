import React, { useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import DataTable from "../../components/dashboard/DataTable";
import StatusState from "../../components/common/StatusState";
import TextField from "../../components/forms/TextField";
import useApiResource from "../../hooks/useApiResource";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext.jsx";
import { merchantService } from "../../services/merchantService";
import { productService } from "../../services/productService";
import { friendlyApiError } from "../../utils/apiErrors";
import { asArray, formatCurrency } from "../../utils/formatters";

const navItems = [
  { to: "/merchant", label: "Overview" },
  { to: "/merchant/products", label: "Products" },
  { to: "/merchant/orders", label: "Orders" },
  { to: "/merchant/analytics", label: "Analytics" }
];

function optionalText(value) {
  const text = String(value || "").trim();
  return text || null;
}

function productPayload(form) {
  const payload = new FormData();
  payload.append("name", optionalText(form.name) || "");
  payload.append("description", optionalText(form.description) || "");
  payload.append("price", form.price || "");
  payload.append("currency_code", String(form.currency_code || "USD").trim().toUpperCase());
  payload.append("stock_quantity", form.stock_quantity || "0");
  payload.append("status", form.status || "draft");
  if (optionalText(form.category_id)) payload.append("category_id", optionalText(form.category_id));
  if (form.image?.size) payload.append("image", form.image);
  return payload;
}

export default function MerchantProductsPage() {
  const { role, token, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const { data, loading, error, reload } = useApiResource(() => merchantService.products(), []);
  const { data: categoryData } = useApiResource(() => productService.categories(), []);
  const categories = asArray(categoryData);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [formStatus, setFormStatus] = useState("");

  async function handleCreateProduct(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = Object.fromEntries(new FormData(form).entries());
    const payload = productPayload({
      ...fields,
      image: form.elements.image?.files?.[0]
    });

    setSaving(true);
    setFormError("");
    setFormStatus("");
    try {
      await merchantService.createProduct(payload);
      form.reset();
      setFormStatus("Product created successfully.");
      showToast("Product created successfully.");
      await reload();
    } catch (productError) {
      console.log(productError);
      const message = friendlyApiError(productError, "We couldn't create the product right now. Please check the form and try again.");
      setFormError(message);
      showToast(message, "error");
    } finally {
      setSaving(false);
    }
  }

  if (!authLoading && token && role !== "merchant") {
    return (
      <DashboardLayout title="Merchant" description="Store operations" navItems={navItems}>
        <StatusState
          type="error"
          title="Merchant account required"
          message="Sign in with a merchant account to manage products."
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Merchant" description="Store operations" navItems={navItems}>
      <div className="section-heading">
        <div>
          <h1 className="title-md">Product Management</h1>
          <p className="muted">Manage products and keep your catalog organized.</p>
        </div>
        <button className="primary-button" type="button" onClick={() => setShowForm((current) => !current)}>
          {showForm ? "Close Form" : "Add Product"}
        </button>
      </div>

      {showForm ? (
        <form className="product-form panel" onSubmit={handleCreateProduct}>
          <div className="form-grid product-form-grid">
            <TextField label="Product name" id="name" name="name" required helper="Use a clear name customers can search for." />
            <TextField label="Price" id="price" name="price" type="number" min="0" step="0.01" required />
            <TextField label="Currency" id="currency_code" name="currency_code" defaultValue="USD" maxLength={3} required helper="Three-letter currency code." />
            <TextField label="Stock quantity" id="stock_quantity" name="stock_quantity" type="number" min="0" step="1" defaultValue="0" />
            <div className="field">
              <label htmlFor="status">Status</label>
              <select className="select" id="status" name="status" defaultValue="draft">
                <option value="draft">Draft</option>
                <option value="active">Active</option>
              </select>
            </div>
            {categories.length ? (
              <div className="field">
                <label htmlFor="category_id">Category</label>
                <select className="select" id="category_id" name="category_id" defaultValue="">
                  <option value="">No category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>
            ) : null}
            <TextField label="Product image" id="image" name="image" type="file" accept="image/jpeg,image/png,image/webp" />
            <TextField label="Description" id="description" name="description" as="textarea" helper="Highlight key features, condition, and what is included." />
          </div>
          {formError ? <p className="form-error" role="alert">{formError}</p> : null}
          {formStatus ? <p className="form-status" role="status">{formStatus}</p> : null}
          <div className="form-actions">
            <button className="primary-button is-loading-aware" type="submit" disabled={saving} aria-busy={saving}>
              {saving ? "Creating..." : "Create Product"}
            </button>
            <button className="secondary-button" type="button" onClick={() => setShowForm(false)}>
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      <DataTable
        data={data}
        loading={loading}
        error={error}
        onRetry={reload}
        emptyMessage="Your products will appear here when they're available."
        columns={[
          { key: "name", label: "Product" },
          { key: "price", label: "Price", render: (row) => formatCurrency(row.price, row.currency_code || "USD") },
          { key: "stock_quantity", label: "Stock" },
          { key: "status", label: "Status" }
        ]}
      />
    </DashboardLayout>
  );
}
