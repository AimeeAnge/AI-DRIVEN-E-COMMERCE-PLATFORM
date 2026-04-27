const ERROR_MESSAGES = {
  invalid_credentials: "Incorrect email or password.",
  missing_token: "Please sign in to continue.",
  invalid_token: "Your session expired. Please sign in again.",
  token_expired: "Your session expired. Please sign in again.",
  role_not_allowed: "This role is not allowed here.",
  permission_denied: "This account cannot access that area.",
  role_forbidden: "Please use a customer account to shop.",
  forbidden: "Please use a customer account to shop.",
  database_schema_missing: "This feature is not ready yet. Please contact the platform administrator.",
  email_already_registered: "An account with this email already exists.",
  duplicate_email: "An account with this email already exists.",
  role_mismatch: "This account does not match the selected role.",
  account_disabled: "This account has been disabled. Please contact support.",
  account_not_active: "This account is not active. Please contact support.",
  weak_password: "Password must be at least 8 characters.",
  invalid_email: "Enter a valid email address.",
  store_name_required: "Store name is required for merchant accounts.",
  slug_already_exists: "A product with this slug already exists.",
  invalid_name: "Product name must be between 2 and 255 characters.",
  invalid_slug: "Product slug must use lowercase letters, numbers, and hyphens.",
  price_required: "Product price is required.",
  invalid_price: "Product price must be a valid number.",
  invalid_currency_code: "Currency must use a three-letter code.",
  invalid_stock_quantity: "Stock quantity must be a valid whole number.",
  invalid_available_country_codes: "Available countries must use two-letter country codes.",
  invalid_country_of_origin: "Country of origin must use a two-letter country code.",
  invalid_images: "Images must be provided as image files or URL metadata.",
  invalid_image_url: "Image URL must be a valid web URL.",
  image_url_required: "Each image needs an image URL.",
  image_source_required: "Each image needs a file or image URL.",
  invalid_image_type: "Image must be JPEG, PNG, or WebP.",
  image_too_large: "Image file is too large.",
  empty_image: "Image file is empty.",
  category_not_found: "Selected category was not found.",
  insufficient_stock: "This product does not have enough stock.",
  product_not_found: "This product is no longer available.",
  product_unavailable: "This product is no longer available.",
  cart_empty: "Your cart is empty.",
  empty_cart: "Your cart is empty.",
  cart_item_not_found: "This cart item is no longer available.",
};

function firstFieldMessage(data) {
  if (!data || typeof data !== "object") return "";
  if (typeof data.message === "string") return data.message;
  if (Array.isArray(data.errors)) return data.errors.filter(Boolean).join(" ");
  const value = Object.values(data).find(Boolean);
  if (Array.isArray(value)) return value.filter(Boolean).join(" ");
  return typeof value === "string" ? value : "";
}

export function friendlyApiError(error, fallback = "Something went wrong. Please try again later.") {
  const code = error?.details?.error?.code;
  const backendMessage = error?.details?.error?.message || error?.details?.message || "";
  const fieldMessage = firstFieldMessage(error?.details?.data);
  const message = fieldMessage || ERROR_MESSAGES[code];

  if (message) {
    if (code === "permission_denied" && /cart|order|shop/i.test(error?.config?.url || "")) {
      return "Please use a customer account to shop.";
    }
    if (code === "permission_denied" && /wishlist/i.test(error?.config?.url || "")) {
      return "Please use a customer account to save products.";
    }
    return message;
  }
  if (error?.status === 409 && /email|duplicate/i.test(backendMessage || error?.message || "")) {
    return "An account with this email already exists.";
  }
  if (backendMessage && !/request failed|status code|\/api\/v1/i.test(backendMessage)) {
    return backendMessage;
  }
  return fallback;
}

export function roleMismatchMessage(selectedRole, actualRole) {
  if (!selectedRole || !actualRole || selectedRole === actualRole) return "";
  if (selectedRole === "admin") return "This account is not an admin account.";
  if (selectedRole === "merchant") return "This account is not a merchant account.";
  if (selectedRole === "customer") return "This account is not a customer account.";
  return "This account does not match the selected role.";
}
