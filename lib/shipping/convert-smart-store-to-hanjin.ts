import { normalizePhoneNumber, normalizePostalCode, toSafeString } from "./excel-utils";
import type { HanjinShippingRow, SmartStoreOrderRow } from "./types";

export function convertSmartStoreRowToHanjinRow(row: SmartStoreOrderRow): HanjinShippingRow {
  return {
    receiverName: toSafeString(row.receiverName), postalCode: normalizePostalCode(row.postalCode),
    address: toSafeString(row.integratedAddress), phone: "", mobilePhone: normalizePhoneNumber(row.buyerPhoneNumber),
    packageQuantity: 1, emptyColumn1: "", emptyColumn2: "", productName: toSafeString(row.productName),
    emptyColumn3: "", deliveryMessage: toSafeString(row.deliveryMessage), shippingFareType: "",
  };
}
