import { normalizePackageQuantity } from "./manual-shipping";
import type { ConvertedShippingRow, ProductQuantitySummary } from "./types";

const EMPTY_PRODUCT_KEY = "__EMPTY_PRODUCT_NAME__";
const EMPTY_PRODUCT_LABEL = "물품명 미입력";

export function normalizeProductNameForGrouping(value: unknown): string {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

export function groupShippingRowsByProduct(rows: ConvertedShippingRow[]): ProductQuantitySummary[] {
  const groups = new Map<string, ProductQuantitySummary>();
  for (const row of rows) {
    const normalizedName = normalizeProductNameForGrouping(row.productName);
    const key = normalizedName ? normalizedName.toLocaleLowerCase("ko-KR") : EMPTY_PRODUCT_KEY;
    const quantity = normalizePackageQuantity(row.packageQuantity);
    const existing = groups.get(key);
    if (existing) { existing.quantity += quantity; continue; }
    groups.set(key, { key, productName: normalizedName || EMPTY_PRODUCT_LABEL, quantity });
  }
  return [...groups.values()].sort((a, b) => b.quantity - a.quantity || a.productName.localeCompare(b.productName, "ko-KR"));
}
