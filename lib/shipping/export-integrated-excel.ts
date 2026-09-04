import * as XLSX from "xlsx";
import { formatLocalDate } from "./excel-utils";
import { createHanjinWorksheet } from "./export-hanjin-excel";
import { createProductSummaryWorksheet, type ProductSummaryExportRow } from "./export-product-summary";
import type { HanjinShippingRow } from "./types";

export function createIntegratedShippingWorkbook(
  orders: HanjinShippingRow[],
  productSummaryRows: ProductSummaryExportRow[],
): XLSX.WorkBook {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, createHanjinWorksheet(orders), "한진택배 통합");
  XLSX.utils.book_append_sheet(workbook, createProductSummaryWorksheet(productSummaryRows), "물품별 집계");
  return workbook;
}

export function getIntegratedShippingFileName(date = new Date()): string {
  return `택배송장_${formatLocalDate(date)}.xlsx`;
}

export function downloadIntegratedShippingExcel(
  orders: HanjinShippingRow[],
  productSummaryRows: ProductSummaryExportRow[],
  date = new Date(),
): void {
  if (!orders.length) return;
  XLSX.writeFile(createIntegratedShippingWorkbook(orders, productSummaryRows), getIntegratedShippingFileName(date), { compression: true });
}
