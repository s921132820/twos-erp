import { normalizeDeliveryMessage, normalizePhoneNumber, normalizePostalCode, toSafeString } from "./excel-utils";
import type { HanjinShippingRow, SmartStoreOrderRow } from "./types";

export function buildSmartStoreProductName(productName: unknown, optionInfo: unknown): string {
  const name = toSafeString(productName).trim();
  const option = toSafeString(optionInfo).trim();
  if (!option) return name;
  if (!name) return option;
  return `${name} / ${option}`;
}

export function convertSmartStoreRowToHanjinRow(row: SmartStoreOrderRow): HanjinShippingRow {
  const contact = normalizePhoneNumber(row.buyerPhoneNumber);
  return {
    receiverName: toSafeString(row.receiverName), postalCode: normalizePostalCode(row.postalCode),
    address: toSafeString(row.integratedAddress), phone: contact, mobilePhone: contact,
    packageQuantity: 1, emptyColumn1: "", emptyColumn2: "", productName: buildSmartStoreProductName(row.productName, row.optionInfo),
    emptyColumn3: "", deliveryMessage: normalizeDeliveryMessage(row.deliveryMessage), shippingFareType: "",
  };
}
