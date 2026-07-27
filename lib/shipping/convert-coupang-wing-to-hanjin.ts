import { normalizePhoneNumber, normalizePostalCode, toSafeString } from "./excel-utils";
import type { CoupangWingOrderRow, HanjinShippingRow } from "./types";

export function convertCoupangWingRowToHanjinRow(row: CoupangWingOrderRow): HanjinShippingRow {
  return {
    receiverName: toSafeString(row.receiverName),
    postalCode: normalizePostalCode(row.postalCode),
    address: toSafeString(row.receiverAddress),
    phone: "",
    mobilePhone: normalizePhoneNumber(row.receiverPhoneNumber),
    packageQuantity: 1,
    emptyColumn1: "",
    emptyColumn2: "",
    productName: toSafeString(row.exposedProductName),
    emptyColumn3: "",
    deliveryMessage: toSafeString(row.deliveryMessage),
    shippingFareType: "",
  };
}
