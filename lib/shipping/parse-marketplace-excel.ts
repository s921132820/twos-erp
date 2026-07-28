import * as XLSX from "xlsx";
import { convertCoupangWingRowToHanjinRow } from "./convert-coupang-wing-to-hanjin";
import { convertMeatboxRowToHanjinRow } from "./convert-meatbox-to-hanjin";
import { convertMeatfriendsRowToHanjinRow } from "./convert-meatfriends-to-hanjin";
import { detectMarketplace, MARKETPLACE_LABELS } from "./marketplace-detector";
import { parseCoupangWingWorkbook } from "./parse-coupang-wing-excel";
import { parseMeatboxWorkbook } from "./parse-meatbox-excel";
import { parseMeatfriendsWorkbook } from "./parse-meatfriends-excel";
import type { ConvertedShippingRow, MarketplaceType } from "./types";
import { withShippingSource } from "./validation";

function assertNever(value: never): never {
  throw new Error(`지원하지 않는 판매처입니다: ${String(value)}`);
}

export function parseMarketplaceExcel(data: ArrayBuffer, marketplace: MarketplaceType, sourceFileName: string): ConvertedShippingRow[] {
  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(data, { type: "array", cellText: true, cellDates: false, raw: true });
  } catch {
    throw new Error("엑셀 파일을 읽지 못했습니다. 파일 형식과 손상 여부를 확인해주세요.");
  }
  const detected = detectMarketplace(workbook);
  if (detected && detected !== marketplace) {
    throw new Error(`업로드한 파일은 ${MARKETPLACE_LABELS[detected]} 주문 파일로 보입니다.\n${MARKETPLACE_LABELS[detected]} 업로드 영역에 등록해주세요.`);
  }
  switch (marketplace) {
    case "meatbox": return parseMeatboxWorkbook(workbook).map(({ row, sourceRowNumber }) => withShippingSource(convertMeatboxRowToHanjinRow(row), marketplace, sourceFileName, sourceRowNumber));
    case "coupang-wing": return parseCoupangWingWorkbook(workbook).map(({ row, sourceRowNumber }) => withShippingSource(convertCoupangWingRowToHanjinRow(row), marketplace, sourceFileName, sourceRowNumber));
    case "meatfriends": return parseMeatfriendsWorkbook(workbook).map(({ row, sourceRowNumber }) => withShippingSource(convertMeatfriendsRowToHanjinRow(row), marketplace, sourceFileName, sourceRowNumber));
    case "smart-store": throw new Error("스마트스토어 파일은 암호화 전용 파서를 사용해야 합니다.");
    default: return assertNever(marketplace);
  }
}
