import { DEFAULT_DELIVERY_MESSAGE } from "./constants";
import type { HanjinShippingRow, ManualShippingForm, ManualShippingRow } from "./types";
import { validateShippingRow } from "./validation";

export function createInitialManualForm(): ManualShippingForm {
  return { receiverName: "", postalCode: "", address: "", phone: "", mobilePhone: "", packageQuantity: 1, productName: "", deliveryMessage: DEFAULT_DELIVERY_MESSAGE, shippingFareType: "", selectedClientId: null, phoneWasManuallyEdited: false };
}

export function normalizePackageQuantity(value: unknown): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

export function normalizeEditableShippingRow(row: HanjinShippingRow): HanjinShippingRow {
  return { ...row, receiverName: row.receiverName.trim(), postalCode: row.postalCode.trim(), address: row.address.trim(), phone: row.phone.trim(), mobilePhone: row.mobilePhone.trim(), packageQuantity: normalizePackageQuantity(row.packageQuantity), productName: row.productName.trim(), deliveryMessage: row.deliveryMessage.trim() || DEFAULT_DELIVERY_MESSAGE, shippingFareType: row.shippingFareType.trim(), emptyColumn1: "", emptyColumn2: "", emptyColumn3: "" };
}

export function isManualCoreEmpty(form: ManualShippingForm): boolean {
  return !form.receiverName.trim() && !form.address.trim() && !form.mobilePhone.trim() && !form.productName.trim();
}

export function createManualShippingRow(form: ManualShippingForm, id = createStableId()): ManualShippingRow | null {
  if (isManualCoreEmpty(form)) return null;
  const row = normalizeEditableShippingRow({ ...form, phone: form.phone.trim() || form.mobilePhone.trim(), emptyColumn1: "", emptyColumn2: "", emptyColumn3: "" });
  return { ...row, id, rowKey: `manual:${id}`, source: "manual", sourceFileName: "수동 입력", sourceRowNumber: 0, selectedClientId: form.selectedClientId, validation: validateShippingRow(row) };
}

export function createStableId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}
