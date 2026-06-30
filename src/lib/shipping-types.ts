export type FreightType = "선불" | "착불" | "신용";
export type FreightGrade = "A" | "C" | "D" | "E";

export interface ShippingOrder {
  id: string;
  createdAt: string;
  recipientName: string;
  zipCode: string;
  address: string;
  phone: string;
  mobile: string;
  quantity: number; // 중량(kg)
  itemName: string;
  message: string;
  freightType: FreightType;
  freightGrade: FreightGrade;
}

export function getFreightGrade(kg: number): FreightGrade {
  if (kg >= 20) return "E";
  if (kg >= 15) return "D";
  if (kg >= 10) return "C";
  return "A";
}

export const emptyOrder = (): Omit<ShippingOrder, "id" | "createdAt"> => ({
  recipientName: "",
  zipCode: "",
  address: "",
  phone: "",
  mobile: "",
  quantity: 1,
  itemName: "",
  message: "",
  freightType: "선불",
  freightGrade: "A",
});

/**
 * Parses pasted text into shipping order fields.
 * Supports:
 *  - Tab/newline separated values (in field order)
 *  - "라벨: 값" or "라벨\t값" lines mixed in any order
 */
export function parsePastedText(text: string): Partial<ShippingOrder> {
  const result: Partial<ShippingOrder> = {};
  const labelMap: Record<string, keyof ShippingOrder> = {
    수화인명: "recipientName",
    수취인명: "recipientName",
    수취인: "recipientName",
    받는분: "recipientName",
    이름: "recipientName",
    우편번호: "zipCode",
    주소: "address",
    전화번호: "phone",
    전화: "phone",
    휴대폰: "mobile",
    휴대폰번호: "mobile",
    핸드폰: "mobile",
    연락처: "mobile",
    수량: "quantity",
    택배수량: "quantity",
    물품명: "itemName",
    품목: "itemName",
    상품명: "itemName",
    메세지: "message",
    메시지: "message",
    배송메세지: "message",
    배송메시지: "message",
    운임: "freightType",
    운임타입: "freightType",
    택배운임타입: "freightType",
  };

  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  let labeledHit = false;
  for (const line of lines) {
    const m = line.match(/^([^\s:：\t]+)\s*[:：\t]\s*(.+)$/);
    if (m) {
      const key = m[1].replace(/\s/g, "");
      const field = labelMap[key];
      if (field) {
        labeledHit = true;
        assignField(result, field, m[2].trim());
      }
    }
  }

  if (labeledHit) return result;

  // Fall back to positional parse (tabs or newlines)
  const tokens = text
    .split(/[\t\n\r]+/)
    .map((t) => t.trim())
    .filter(Boolean);
  const order: (keyof ShippingOrder)[] = [
    "recipientName",
    "zipCode",
    "address",
    "phone",
    "mobile",
    "quantity",
    "itemName",
    "message",
    "freightType",
  ];
  tokens.forEach((val, i) => {
    if (i < order.length) assignField(result, order[i], val);
  });
  return result;
}

function assignField(
  target: Partial<ShippingOrder>,
  field: keyof ShippingOrder,
  value: string,
) {
  if (field === "quantity") {
    const n = parseInt(value.replace(/[^\d]/g, ""), 10);
    if (!Number.isNaN(n)) target.quantity = n;
  } else if (field === "freightType") {
    const v = value.trim();
    if (v.includes("착불")) target.freightType = "착불";
    else if (v.includes("신용")) target.freightType = "신용";
    else target.freightType = "선불";
  } else {
    (target as Record<string, string>)[field] = value;
  }
}
