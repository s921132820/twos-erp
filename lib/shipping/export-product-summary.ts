import * as XLSX from "xlsx";
import { protectExcelText } from "./excel-utils";
import { normalizeProductNameForGrouping } from "./product-summary";

export type ProductSummaryExportRow = { productName: string; quantity: number };

export function prepareProductSummaryExportRows(rows: ProductSummaryExportRow[]): ProductSummaryExportRow[] {
  const merged = new Map<string, ProductSummaryExportRow>();
  for (const row of rows) {
    const productName = normalizeProductNameForGrouping(row.productName);
    const quantity = Number(row.quantity);
    if (!productName || !Number.isInteger(quantity) || quantity < 0) continue;
    const key = productName.toLocaleLowerCase("ko-KR"); const existing = merged.get(key);
    if (existing) existing.quantity += quantity; else merged.set(key, { productName, quantity });
  }
  return [...merged.values()];
}

export function createProductSummaryWorkbook(rows: ProductSummaryExportRow[]): XLSX.WorkBook {
  const prepared = prepareProductSummaryExportRows(rows);
  const data: Array<Array<string | number>> = prepared.map((row, index) => [index + 1, protectExcelText(row.productName), row.quantity]);
  const worksheet = XLSX.utils.aoa_to_sheet([["번호", "물품명", "개수"], ...data]);
  const productNameWidth = Math.min(80, Math.max(20, ...prepared.map((row) => row.productName.length + 4)));
  worksheet["!cols"] = [{ wch: 8 }, { wch: productNameWidth }, { wch: 12 }];
  const workbook = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(workbook, worksheet, "물품별 집계"); return workbook;
}

export function formatLocalDateForFileName(date = new Date()): string {
  return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
}

export function getProductSummaryFileName(date = new Date()): string { return `물품별 집계_${formatLocalDateForFileName(date)}.xlsx`; }

export function exportProductSummaryExcel(rows: ProductSummaryExportRow[], date = new Date()): void {
  const prepared = prepareProductSummaryExportRows(rows); if (!prepared.length) return;
  XLSX.writeFile(createProductSummaryWorkbook(prepared), getProductSummaryFileName(date), { compression: true });
}
