import { DEFAULT_DELIVERY_MESSAGE } from "./constants";
import { normalizePhoneNumber, toIdentifierString, toSafeString } from "./excel-utils";
import type { HanjinShippingRow, MeatfriendsOrderRow } from "./types";

export function joinAddressParts(address: unknown, detailAddress: unknown): string {
  return [address, detailAddress].map((value) => toSafeString(value).replace(/\s+/g, " ").trim()).filter(Boolean).join(" ");
}

export function convertMeatfriendsRowToHanjinRow(row: MeatfriendsOrderRow): HanjinShippingRow {
  const contact = normalizePhoneNumber(row.basicContact);
  return { receiverName: toSafeString(row.recipientName), postalCode: toIdentifierString(row.postalCode), address: joinAddressParts(row.address, row.detailAddress), phone: contact, mobilePhone: contact, packageQuantity: 1, emptyColumn1: "", emptyColumn2: "", productName: toSafeString(row.productName), emptyColumn3: "", deliveryMessage: DEFAULT_DELIVERY_MESSAGE, shippingFareType: "" };
}
