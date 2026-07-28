import * as XLSX from "xlsx";
import { cellDisplayValue, normalizeHeader, toIdentifierString, toSafeString } from "./excel-utils";
import type { MeatfriendsOrderRow, ParsedOrderRow } from "./types";

const REQUIRED_HEADERS = ["수취인명", "기본연락처", "우편번호", "주소", "상품명"] as const;
const ALL_HEADERS = [...REQUIRED_HEADERS, "상세주소"] as const;
type Header = (typeof ALL_HEADERS)[number];

function normalizeMeatfriendsHeader(value: unknown): string {
  return normalizeHeader(value).replace(/\s+/g, "");
}

function findHeaderRow(sheet: XLSX.WorkSheet): { row: number; columns: Map<Header, number> } | null {
  const range = XLSX.utils.decode_range(sheet["!ref"] ?? "A1:A1");
  for (let row = range.s.r; row <= range.e.r; row += 1) {
    const columns = new Map<Header, number>();
    for (let column = range.s.c; column <= range.e.c; column += 1) {
      const value = normalizeMeatfriendsHeader(cellDisplayValue(sheet[XLSX.utils.encode_cell({ r: row, c: column })]));
      const header = ALL_HEADERS.find((candidate) => candidate === value);
      if (header) columns.set(header, column);
    }
    if (REQUIRED_HEADERS.every((header) => columns.has(header))) return { row, columns };
  }
  return null;
}

function missingHeaders(workbook: XLSX.WorkBook): string[] {
  const found = new Set<string>();
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName]; if (!sheet) continue;
    const range = XLSX.utils.decode_range(sheet["!ref"] ?? "A1:A1");
    for (let row = range.s.r; row <= range.e.r; row += 1) for (let column = range.s.c; column <= range.e.c; column += 1) found.add(normalizeMeatfriendsHeader(cellDisplayValue(sheet[XLSX.utils.encode_cell({ r: row, c: column })])));
  }
  return REQUIRED_HEADERS.filter((header) => !found.has(header));
}

export function parseMeatfriendsWorkbook(workbook: XLSX.WorkBook): ParsedOrderRow<MeatfriendsOrderRow>[] {
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName]; if (!sheet) continue;
    const header = findHeaderRow(sheet); if (!header) continue;
    const range = XLSX.utils.decode_range(sheet["!ref"] ?? "A1:A1");
    const rows: ParsedOrderRow<MeatfriendsOrderRow>[] = [];
    for (let rowIndex = header.row + 1; rowIndex <= range.e.r; rowIndex += 1) {
      const value = (name: Header) => { const column = header.columns.get(name); return column === undefined ? "" : cellDisplayValue(sheet[XLSX.utils.encode_cell({ r: rowIndex, c: column })]); };
      const row: MeatfriendsOrderRow = { recipientName: toSafeString(value("수취인명")), basicContact: toIdentifierString(value("기본연락처")), postalCode: toIdentifierString(value("우편번호")), address: toSafeString(value("주소")), detailAddress: toSafeString(value("상세주소")), productName: toSafeString(value("상품명")) };
      if (Object.values(row).some(Boolean)) rows.push({ row, sourceRowNumber: rowIndex + 1 });
    }
    return rows;
  }
  const missing = missingHeaders(workbook);
  throw new Error(`미트프렌즈 엑셀 형식을 확인해 주세요.\n필수 컬럼이 없습니다: ${missing.join(", ")}`);
}
