import type { CellObject } from "xlsx";

export function toSafeString(value: unknown): string {
  if (value === null || value === undefined) return "";
  const text = String(value).trim();
  return text === "undefined" || text === "null" ? "" : text;
}

export function toIdentifierString(value: unknown): string {
  return toSafeString(value).replace(/\.0$/, "");
}

export const normalizePostalCode = toIdentifierString;
export const normalizePhoneNumber = toIdentifierString;

export function normalizeHeader(value: unknown): string {
  return toSafeString(value).replace(/\r?\n/g, " ").replace(/\s+/g, " ").trim();
}

export function cellDisplayValue(cell: CellObject | undefined): string {
  if (!cell) return "";
  if (typeof cell.w === "string") return toSafeString(cell.w);
  return toSafeString(cell.v);
}

export function protectExcelText(value: unknown): string {
  const text = toSafeString(value);
  return /^[=+\-@]/.test(text) ? `'${text}` : text;
}
