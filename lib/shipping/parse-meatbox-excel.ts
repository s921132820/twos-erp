import * as XLSX from "xlsx";
import { cellDisplayValue, normalizeHeader, toIdentifierString, toSafeString } from "./excel-utils";
import type { MeatboxOrderRow, ParsedOrderRow } from "./types";

const REQUIRED_HEADERS = ["상품명", "받는사람", "받는사람연락처", "배송지 주소"] as const;
const ALL_HEADERS = [...REQUIRED_HEADERS, "상품번호", "계근중량", "우편번호", "배송시주의사항"] as const;
type Header = (typeof ALL_HEADERS)[number];

function findHeaderRow(sheet: XLSX.WorkSheet): { row: number; columns: Map<Header, number> } | null {
  const range = XLSX.utils.decode_range(sheet["!ref"] ?? "A1:A1");
  for (let row = range.s.r; row <= range.e.r; row += 1) {
    const columns = new Map<Header, number>();
    for (let column = range.s.c; column <= range.e.c; column += 1) {
      const value = normalizeHeader(cellDisplayValue(sheet[XLSX.utils.encode_cell({ r: row, c: column })]));
      const header = ALL_HEADERS.find((candidate) => candidate === value);
      if (header) columns.set(header, column);
    }
    if (REQUIRED_HEADERS.every((header) => columns.has(header))) return { row, columns };
  }
  return null;
}

function readCell(sheet: XLSX.WorkSheet, row: number, column: number | undefined): string {
  return column === undefined ? "" : cellDisplayValue(sheet[XLSX.utils.encode_cell({ r: row, c: column })]);
}

export function parseMeatboxWorkbook(workbook: XLSX.WorkBook): ParsedOrderRow<MeatboxOrderRow>[] {
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;
    const header = findHeaderRow(sheet);
    if (!header) continue;
    const range = XLSX.utils.decode_range(sheet["!ref"] ?? "A1:A1");
    const rows: ParsedOrderRow<MeatboxOrderRow>[] = [];
    for (let rowIndex = header.row + 1; rowIndex <= range.e.r; rowIndex += 1) {
      const value = (name: Header) => readCell(sheet, rowIndex, header.columns.get(name));
      const row: MeatboxOrderRow = {
        productNumber: toIdentifierString(value("상품번호")),
        productName: toSafeString(value("상품명")),
        measuredWeight: toSafeString(value("계근중량")),
        receiverName: toSafeString(value("받는사람")),
        receiverContact: toIdentifierString(value("받는사람연락처")),
        postalCode: toIdentifierString(value("우편번호")),
        shippingAddress: toSafeString(value("배송지 주소")),
        deliveryPrecautions: toSafeString(value("배송시주의사항")),
      };
      if ([row.productName, row.receiverName, row.receiverContact, row.shippingAddress].some(Boolean)) rows.push({ row, sourceRowNumber: rowIndex + 1 });
    }
    return rows;
  }
  throw new Error("필수 헤더를 찾을 수 없습니다. 미트박스 주문 엑셀인지 확인해주세요.");
}

export function parseMeatboxExcel(data: ArrayBuffer): ParsedOrderRow<MeatboxOrderRow>[] {
  try {
    return parseMeatboxWorkbook(XLSX.read(data, { type: "array", cellText: true, cellDates: false, raw: true }));
  } catch (cause) {
    if (cause instanceof Error && cause.message.includes("필수 헤더")) throw cause;
    throw new Error("엑셀 파일을 읽지 못했습니다. 파일 형식과 손상 여부를 확인해주세요.");
  }
}
