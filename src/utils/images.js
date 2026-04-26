export function resolveImageUrl(image) {
  const url = image?.url || image?.image_url || image?.imageEndpoint || image?.image_endpoint || image;
  if (!url || typeof url !== "string") return "";
  if (/^https?:\/\//i.test(url) || url.startsWith("data:")) return url;
  const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
  return `${baseUrl}${url.startsWith("/") ? url : `/${url}`}`;
}
