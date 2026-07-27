import { normalizeDeliveryMessage, normalizePhoneNumber, toIdentifierString, toSafeString } from "./excel-utils";
import type { HanjinShippingRow, MeatboxOrderRow } from "./types";
import { getMissingReviewFields } from "./validation";

export const MEATBOX_PRODUCT_LABEL_MAP: Readonly<Record<string, string>> = {
  "285058": "(박피)",
  "285055": "(암)",
  "217548": "(수)",
  "285059": "(박피)",
  "285057": "(암)",
  "210436": "(수)",
};

export function normalizeProductNumber(value: unknown): string {
  return String(value ?? "").trim();
}

export function getMeatboxProductLabel(productNumber: unknown): string {
  return MEATBOX_PRODUCT_LABEL_MAP[normalizeProductNumber(productNumber)] ?? "";
}

export function combineProductNameAndWeight(productName: unknown, measuredWeight: unknown, productNumber?: unknown): string {
  const safeProductName = toSafeString(productName);
  const safeMeasuredWeight = toSafeString(measuredWeight);
  const label = getMeatboxProductLabel(productNumber);
  const labeledWeight = label && safeMeasuredWeight ? `${label} ${safeMeasuredWeight}` : safeMeasuredWeight;
  if (safeProductName && labeledWeight) return `${safeProductName} / ${labeledWeight}`;
  return safeProductName || labeledWeight;
}

export function convertMeatboxRowToHanjinRow(row: MeatboxOrderRow): HanjinShippingRow {
  const contact = normalizePhoneNumber(row.receiverContact);
  return {
    receiverName: toSafeString(row.receiverName),
    postalCode: toIdentifierString(row.postalCode),
    address: toSafeString(row.shippingAddress),
    phone: contact,
    mobilePhone: contact,
    packageQuantity: 1,
    emptyColumn1: "",
    emptyColumn2: "",
    productName: combineProductNameAndWeight(row.productName, row.measuredWeight, row.productNumber),
    emptyColumn3: "",
    deliveryMessage: normalizeDeliveryMessage(row.deliveryPrecautions),
    shippingFareType: "",
  };
}

export function needsReview(row: HanjinShippingRow): boolean {
  return getMissingReviewFields(row).length > 0;
}
