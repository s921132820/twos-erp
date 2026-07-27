import type { ConvertedShippingRow, HanjinShippingRow, MarketplaceSource } from "./types";

export function getMissingReviewFields(row: HanjinShippingRow): string[] {
  return [!row.receiverName && "수화인명", !row.address && "주소", !row.mobilePhone && "휴대폰번호", !row.productName && "물품명"].filter((value): value is string => Boolean(value));
}

export function withShippingSource(row: HanjinShippingRow, source: MarketplaceSource, sourceFileName: string, sourceRowNumber: number): ConvertedShippingRow {
  const missingFields = getMissingReviewFields(row);
  return { ...row, rowKey: `${source}:${sourceFileName}:${sourceRowNumber}`, source, sourceFileName, sourceRowNumber, validation: { isValid: missingFields.length === 0, missingFields } };
}

export function validateShippingRow(row: HanjinShippingRow) {
  const missingFields = getMissingReviewFields(row);
  return { isValid: missingFields.length === 0, missingFields };
}
