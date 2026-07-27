import { normalizeDeliveryMessage, normalizePhoneNumber, normalizePostalCode, toSafeString } from "./excel-utils";
import type { HanjinShippingRow, SmartStoreOrderRow } from "./types";

export function convertSmartStoreRowToHanjinRow(row: SmartStoreOrderRow): HanjinShippingRow {
  const contact = normalizePhoneNumber(row.buyerPhoneNumber);
  return {
    receiverName: toSafeString(row.receiverName), postalCode: normalizePostalCode(row.postalCode),
    address: toSafeString(row.integratedAddress), phone: contact, mobilePhone: contact,
    packageQuantity: 1, emptyColumn1: "", emptyColumn2: "", productName: toSafeString(row.productName),
    emptyColumn3: "", deliveryMessage: normalizeDeliveryMessage(row.deliveryMessage), shippingFareType: "",
  };
}
