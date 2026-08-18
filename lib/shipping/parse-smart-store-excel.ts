import * as XLSX from "xlsx";
import { cellDisplayValue, normalizeHeader, normalizePhoneNumber, normalizePostalCode, toSafeString } from "./excel-utils";
import type { ParsedOrderRow, SmartStoreOrderRow } from "./types";

const HEADER_ALIASES = {
  receiverName: ["수취인명", "수취인 명"], productName: ["상품명"], optionInfo: ["옵션정보", "옵션 정보"],
  integratedAddress: ["통합배송지", "통합 배송지"], buyerPhoneNumber: ["구매자연락처", "구매자 연락처"],
  postalCode: ["우편번호"], deliveryMessage: ["배송메세지", "배송 메시지"],
} as const;
type HeaderKey = keyof typeof HEADER_ALIASES;
const REQUIRED: HeaderKey[] = ["receiverName", "productName", "integratedAddress", "buyerPhoneNumber"];

function keyFor(value: unknown): HeaderKey | undefined {
  const normalized = normalizeHeader(value);
  return (Object.keys(HEADER_ALIASES) as HeaderKey[]).find((key) => HEADER_ALIASES[key].some((alias) => alias === normalized));
}

function cell(sheet: XLSX.WorkSheet, row: number, column: number | undefined): string {
  return column === undefined ? "" : cellDisplayValue(sheet[XLSX.utils.encode_cell({ r: row, c: column })]);
}

function findOrderHeader(workbook: XLSX.WorkBook) {
  let best: { sheet: XLSX.WorkSheet; row: number; columns: Map<HeaderKey, number>; dataRows: number } | null = null;
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;
    const range = XLSX.utils.decode_range(sheet["!ref"] ?? "A1:A1");
    for (let row = range.s.r; row <= range.e.r; row += 1) {
      const columns = new Map<HeaderKey, number>();
      for (let column = range.s.c; column <= range.e.c; column += 1) {
        const key = keyFor(cell(sheet, row, column)); if (key) columns.set(key, column);
      }
      if (!REQUIRED.every((key) => columns.has(key))) continue;
      let dataRows = 0;
      for (let dataRow = row + 1; dataRow <= range.e.r; dataRow += 1) {
        if (REQUIRED.some((key) => toSafeString(cell(sheet, dataRow, columns.get(key))))) dataRows += 1;
      }
      if (!best || dataRows > best.dataRows) best = { sheet, row, columns, dataRows };
    }
  }
  return best;
}

export function parseSmartStoreWorkbook(workbook: XLSX.WorkBook): ParsedOrderRow<SmartStoreOrderRow>[] {
  const header = findOrderHeader(workbook);
  if (!header) throw new Error("스마트스토어 주문 엑셀에서 필요한 컬럼을 찾을 수 없습니다.\n\n필수 컬럼:\n수취인명, 상품명, 통합배송지, 구매자연락처");
  const range = XLSX.utils.decode_range(header.sheet["!ref"] ?? "A1:A1");
  const rows: ParsedOrderRow<SmartStoreOrderRow>[] = [];
  const read = (row: number, key: HeaderKey) => cell(header.sheet, row, header.columns.get(key));
  for (let rowIndex = header.row + 1; rowIndex <= range.e.r; rowIndex += 1) {
    const row: SmartStoreOrderRow = {
      receiverName: toSafeString(read(rowIndex, "receiverName")), productName: toSafeString(read(rowIndex, "productName")), optionInfo: toSafeString(read(rowIndex, "optionInfo")),
      integratedAddress: toSafeString(read(rowIndex, "integratedAddress")), buyerPhoneNumber: normalizePhoneNumber(read(rowIndex, "buyerPhoneNumber")),
      postalCode: normalizePostalCode(read(rowIndex, "postalCode")), deliveryMessage: toSafeString(read(rowIndex, "deliveryMessage")),
    };
    if ([row.receiverName, row.productName, row.integratedAddress, row.buyerPhoneNumber].some(Boolean)) rows.push({ row, sourceRowNumber: rowIndex + 1 });
  }
  return rows;
}
