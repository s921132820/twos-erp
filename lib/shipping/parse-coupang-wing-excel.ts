import * as XLSX from "xlsx";
import { cellDisplayValue, normalizeHeader, normalizePhoneNumber, normalizePostalCode, toSafeString } from "./excel-utils";
import type { CoupangWingOrderRow, ParsedOrderRow } from "./types";

const HEADER_ALIASES = {
  exposedProductName: ["노출상품명(옵션명)", "노출상품명 (옵션명)", "노출상품명"],
  receiverName: ["수취인이름", "수취인 이름"],
  receiverPhoneNumber: ["수취인전화번호", "수취인 전화번호"],
  postalCode: ["우편번호"],
  receiverAddress: ["수취인 주소", "수취인주소"],
  deliveryMessage: ["배송메세지", "배송 메시지"],
} as const;
type HeaderKey = keyof typeof HEADER_ALIASES;
const REQUIRED_KEYS: HeaderKey[] = ["exposedProductName", "receiverName", "receiverPhoneNumber", "receiverAddress"];

function headerKey(value: unknown): HeaderKey | undefined {
  const normalized = normalizeHeader(value);
  return (Object.keys(HEADER_ALIASES) as HeaderKey[]).find((key) => HEADER_ALIASES[key].some((alias) => alias === normalized));
}

function findBestHeader(workbook: XLSX.WorkBook): { sheet: XLSX.WorkSheet; row: number; columns: Map<HeaderKey, number> } | null {
  let best: { sheet: XLSX.WorkSheet; row: number; columns: Map<HeaderKey, number>; score: number } | null = null;
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;
    const range = XLSX.utils.decode_range(sheet["!ref"] ?? "A1:A1");
    for (let row = range.s.r; row <= range.e.r; row += 1) {
      const columns = new Map<HeaderKey, number>();
      for (let column = range.s.c; column <= range.e.c; column += 1) {
        const key = headerKey(cellDisplayValue(sheet[XLSX.utils.encode_cell({ r: row, c: column })]));
        if (key) columns.set(key, column);
      }
      const score = REQUIRED_KEYS.filter((key) => columns.has(key)).length;
      if (!best || score > best.score) best = { sheet, row, columns, score };
    }
  }
  return best?.score === REQUIRED_KEYS.length ? best : null;
}

export function parseCoupangWingWorkbook(workbook: XLSX.WorkBook): ParsedOrderRow<CoupangWingOrderRow>[] {
  const header = findBestHeader(workbook);
  if (!header) {
    throw new Error("쿠팡윙 주문 엑셀에서 필요한 컬럼을 찾을 수 없습니다.\n\n필수 컬럼:\n노출상품명(옵션명), 수취인이름, 수취인전화번호, 수취인 주소");
  }
  const range = XLSX.utils.decode_range(header.sheet["!ref"] ?? "A1:A1");
  const rows: ParsedOrderRow<CoupangWingOrderRow>[] = [];
  const read = (row: number, key: HeaderKey) => {
    const column = header.columns.get(key);
    return column === undefined ? "" : cellDisplayValue(header.sheet[XLSX.utils.encode_cell({ r: row, c: column })]);
  };
  for (let rowIndex = header.row + 1; rowIndex <= range.e.r; rowIndex += 1) {
    const row: CoupangWingOrderRow = {
      exposedProductName: toSafeString(read(rowIndex, "exposedProductName")),
      receiverName: toSafeString(read(rowIndex, "receiverName")),
      receiverPhoneNumber: normalizePhoneNumber(read(rowIndex, "receiverPhoneNumber")),
      postalCode: normalizePostalCode(read(rowIndex, "postalCode")),
      receiverAddress: toSafeString(read(rowIndex, "receiverAddress")),
      deliveryMessage: toSafeString(read(rowIndex, "deliveryMessage")),
    };
    if ([row.exposedProductName, row.receiverName, row.receiverPhoneNumber, row.receiverAddress].some(Boolean)) rows.push({ row, sourceRowNumber: rowIndex + 1 });
  }
  return rows;
}
