import * as XLSX from "xlsx";
import { cellDisplayValue, normalizeHeader } from "./excel-utils";
import type { MarketplaceType } from "./types";

export const MARKETPLACE_LABELS: Record<MarketplaceType, string> = {
  meatbox: "미트박스",
  "coupang-wing": "쿠팡윙",
};

const SIGNATURES: Record<MarketplaceType, readonly string[]> = {
  meatbox: ["상품명", "받는사람", "받는사람연락처", "배송지 주소"],
  "coupang-wing": ["노출상품명(옵션명)", "수취인이름", "수취인전화번호", "수취인 주소"],
};

function canonicalHeader(value: string): string {
  if (value === "노출상품명 (옵션명)" || value === "노출상품명") return "노출상품명(옵션명)";
  if (value === "수취인 이름") return "수취인이름";
  if (value === "수취인 전화번호") return "수취인전화번호";
  if (value === "수취인주소") return "수취인 주소";
  return value;
}

function normalizedSheetRows(sheet: XLSX.WorkSheet): string[][] {
  const range = XLSX.utils.decode_range(sheet["!ref"] ?? "A1:A1");
  const rows: string[][] = [];
  for (let row = range.s.r; row <= range.e.r; row += 1) {
    const values: string[] = [];
    for (let column = range.s.c; column <= range.e.c; column += 1) {
      values.push(canonicalHeader(normalizeHeader(cellDisplayValue(sheet[XLSX.utils.encode_cell({ r: row, c: column })]))));
    }
    rows.push(values);
  }
  return rows;
}

export function detectMarketplace(workbook: XLSX.WorkBook): MarketplaceType | null {
  let best: { marketplace: MarketplaceType; score: number } | null = null;
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;
    for (const row of normalizedSheetRows(sheet)) {
      for (const marketplace of Object.keys(SIGNATURES) as MarketplaceType[]) {
        const score = SIGNATURES[marketplace].filter((header) => row.includes(header)).length;
        if (!best || score > best.score) best = { marketplace, score };
      }
    }
  }
  return best && best.score === SIGNATURES[best.marketplace].length ? best.marketplace : null;
}
