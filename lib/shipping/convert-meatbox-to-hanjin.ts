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

export function formatMeatboxWeight(value: unknown): string {
  const normalized = toSafeString(value).replace(/\u00a0/g, " ").trim();
  if (!normalized) return "";
  const weightWithoutUnit = normalized.replace(/\s*kg\s*$/i, "").trim();
  return weightWithoutUnit ? `${weightWithoutUnit}kg` : "";
}

export function buildMeatboxProductName({ productName, productLabel, weight }: { productName: unknown; productLabel: string; weight: unknown }): string {
  const normalizedProductName = toSafeString(productName).replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
  return [normalizedProductName, productLabel, formatMeatboxWeight(weight)].filter(Boolean).join(" ");
}

export function combineProductNameAndWeight(productName: unknown, measuredWeight: unknown, productNumber?: unknown): string {
  return buildMeatboxProductName({ productName, productLabel: getMeatboxProductLabel(productNumber), weight: measuredWeight });
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
