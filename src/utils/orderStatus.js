export const customerOrderStatusLabels = {
  pending: "Waiting for merchant",
  processing: "Order accepted",
  shipped: "On the way",
  delivered: "Completed",
  cancelled: "Cancelled",
  paid: "Paid",
  refunded: "Refunded"
};

export const merchantOrderStatusLabels = {
  pending: "Pending",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  paid: "Paid",
  refunded: "Refunded"
};

export const orderTimelineSteps = [
  { status: "pending", label: "Pending", detail: "Waiting for merchant" },
  { status: "processing", label: "Processing", detail: "Order accepted" },
  { status: "shipped", label: "Shipped", detail: "On the way" },
  { status: "delivered", label: "Delivered", detail: "Completed" }
];

export function nextMerchantOrderAction(status) {
  if (status === "pending") return { status: "processing", label: "Approve" };
  if (status === "processing") return { status: "shipped", label: "Mark shipped" };
  if (status === "shipped") return { status: "delivered", label: "Mark delivered" };
  return null;
}

export function formatOrderStatus(status, labels = customerOrderStatusLabels) {
  return labels[status] || status || "";
}
