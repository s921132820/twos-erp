import { normalizeDeliveryMessage, normalizePhoneNumber, normalizePostalCode, toSafeString } from "./excel-utils";
import type { CoupangWingOrderRow, HanjinShippingRow } from "./types";

export function convertCoupangWingRowToHanjinRow(row: CoupangWingOrderRow): HanjinShippingRow {
  const contact = normalizePhoneNumber(row.receiverPhoneNumber);
  return {
    receiverName: toSafeString(row.receiverName),
    postalCode: normalizePostalCode(row.postalCode),
    address: toSafeString(row.receiverAddress),
    phone: contact,
    mobilePhone: contact,
    packageQuantity: 1,
    emptyColumn1: "",
    emptyColumn2: "",
    productName: toSafeString(row.exposedProductName),
    emptyColumn3: "",
    deliveryMessage: normalizeDeliveryMessage(row.deliveryMessage),
    shippingFareType: "",
  };
}
