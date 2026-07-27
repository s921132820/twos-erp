import * as XLSX from "xlsx";
import { convertSmartStoreRowToHanjinRow } from "./convert-smart-store-to-hanjin";
import { decryptSmartStoreExcel } from "./decrypt-smart-store-excel";
import { parseSmartStoreWorkbook } from "./parse-smart-store-excel";
import type { ConvertedShippingRow } from "./types";
import { withShippingSource } from "./validation";

export async function parseEncryptedSmartStoreExcel(data: ArrayBuffer, sourceFileName: string, onDecrypted?: () => void): Promise<ConvertedShippingRow[]> {
  const decrypted = await decryptSmartStoreExcel(data);
  onDecrypted?.();
  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(decrypted, { type: "array", cellText: true, cellDates: false, raw: true });
  } catch {
    throw new Error("복호화된 스마트스토어 엑셀 파일을 읽지 못했습니다. 파일이 손상되었는지 확인해주세요.");
  }
  return parseSmartStoreWorkbook(workbook).map(({ row, sourceRowNumber }) => withShippingSource(convertSmartStoreRowToHanjinRow(row), "smart-store", sourceFileName, sourceRowNumber));
}
