export function formatCurrency(value, currency = "USD") {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency
  }).format(Number(value));
}

export function asArray(payload, key = "items") {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.[key])) return payload[key];
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}
