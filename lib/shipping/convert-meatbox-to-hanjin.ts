import { toIdentifierString, toSafeString } from "./excel-utils";
import type { HanjinShippingRow, MeatboxOrderRow } from "./types";
import { getMissingReviewFields } from "./validation";

export function combineProductNameAndWeight(productName: unknown, measuredWeight: unknown): string {
  const safeProductName = toSafeString(productName);
  const safeMeasuredWeight = toSafeString(measuredWeight);
  if (safeProductName && safeMeasuredWeight) return `${safeProductName} / ${safeMeasuredWeight}`;
  return safeProductName || safeMeasuredWeight;
}

export function convertMeatboxRowToHanjinRow(row: MeatboxOrderRow): HanjinShippingRow {
  return {
    receiverName: toSafeString(row.receiverName),
    postalCode: toIdentifierString(row.postalCode),
    address: toSafeString(row.shippingAddress),
    phone: "",
    mobilePhone: toIdentifierString(row.receiverContact),
    packageQuantity: 1,
    emptyColumn1: "",
    emptyColumn2: "",
    productName: combineProductNameAndWeight(row.productName, row.measuredWeight),
    emptyColumn3: "",
    deliveryMessage: toSafeString(row.deliveryPrecautions),
    shippingFareType: "",
  };
}

export function needsReview(row: HanjinShippingRow): boolean {
  return getMissingReviewFields(row).length > 0;
}
