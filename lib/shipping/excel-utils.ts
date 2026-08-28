import type { CellObject } from "xlsx";
import * as XLSX from "xlsx";
import { DEFAULT_DELIVERY_MESSAGE } from "./constants";

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

export function normalizeDeliveryMessage(value: unknown): string {
  return toSafeString(value) || DEFAULT_DELIVERY_MESSAGE;
}

export function normalizeHeader(value: unknown): string {
  return toSafeString(value).replace(/\r?\n/g, " ").replace(/\s+/g, " ").trim();
}

export function cellDisplayValue(cell: CellObject | undefined): string {
  if (!cell) return "";
  if (typeof cell.w === "string") return toSafeString(cell.w);
  return toSafeString(cell.v);
}

function validDateParts(year: number, month: number, day: number): string | null {
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Normalizes Excel dates without converting through UTC. Time values are intentionally ignored. */
export function normalizeExcelDate(value: unknown): string | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return validDateParts(value.getFullYear(), value.getMonth() + 1, value.getDate());
  if (typeof value === "number" && Number.isFinite(value)) {
    const parts = XLSX.SSF.parse_date_code(value);
    return parts ? validDateParts(parts.y, parts.m, parts.d) : null;
  }
  const text = toSafeString(value);
  if (!text) return null;
  if (/^\d+(?:\.\d+)?$/.test(text)) return normalizeExcelDate(Number(text));
  const match = text.match(/^(\d{4})[-./](\d{1,2})[-./](\d{1,2})(?:[ T].*)?$/);
  return match ? validDateParts(Number(match[1]), Number(match[2]), Number(match[3])) : null;
}

export function formatLocalDate(date = new Date()): string {
  return validDateParts(date.getFullYear(), date.getMonth() + 1, date.getDate())!;
}

export function protectExcelText(value: unknown): string {
  const text = toSafeString(value);
  return /^[=+\-@]/.test(text) ? `'${text}` : text;
}
