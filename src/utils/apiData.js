import { asArray } from "./formatters";

export function unwrapData(response) {
  return response?.data || response || {};
}

export function paginationTotal(response) {
  const data = unwrapData(response);
  return Number(data?.pagination?.total ?? data?.total ?? asArray(data).length ?? 0);
}
