import { normalizeProductNameForGrouping } from "./product-summary";
import type { EditableProductSummary, ProductQuantitySummary } from "./types";

export function createEditableProductSummaries(groups: ProductQuantitySummary[]): EditableProductSummary[] {
  return groups.map((group) => ({ id: `product-summary:${group.key}`, originalProductKey: group.key, productName: group.productName, lastValidProductName: group.productName, quantity: group.quantity }));
}

export function normalizeSummaryQuantity(value: string, fallback: number): number {
  if (value.trim() === "") return fallback;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback;
}

export function commitProductSummaryName(rows: EditableProductSummary[], id: string): EditableProductSummary[] {
  const current = rows.find((row) => row.id === id); if (!current) return rows;
  const normalized = normalizeProductNameForGrouping(current.productName);
  if (!normalized) return rows.map((row) => row.id === id ? { ...row, productName: row.lastValidProductName } : row);
  const normalizedKey = normalized.toLocaleLowerCase("ko-KR");
  const duplicate = rows.find((row) => row.id !== id && normalizeProductNameForGrouping(row.productName).toLocaleLowerCase("ko-KR") === normalizedKey);
  if (duplicate) return rows.filter((row) => row.id !== id).map((row) => row.id === duplicate.id ? { ...row, quantity: row.quantity + current.quantity } : row);
  return rows.map((row) => row.id === id ? { ...row, productName: normalized, lastValidProductName: normalized } : row);
}
