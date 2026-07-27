import * as XLSX from "xlsx";
import { protectExcelText } from "./excel-utils";
import type { HanjinShippingRow } from "./types";

export const HANJIN_HEADERS = ["수화인명", "우편번호", "주소", "전화번호", "휴대폰번호", "택배수량", "", "", "물품명", "", "배송메세지", "택배운임타입"] as const;

export function createHanjinWorkbook(orders: HanjinShippingRow[]): XLSX.WorkBook {
  const text = protectExcelText;
  const rows: Array<Array<string | number>> = orders.map((order) => [
    text(order.receiverName), text(order.postalCode), text(order.address), text(order.phone),
    text(order.mobilePhone), order.packageQuantity, "", "", text(order.productName), "",
    text(order.deliveryMessage), text(order.shippingFareType),
  ]);
  const sheet = XLSX.utils.aoa_to_sheet([[...HANJIN_HEADERS], ...rows]);
  sheet["!cols"] = [14, 10, 36, 16, 16, 10, 3, 3, 32, 3, 28, 14].map((wch) => ({ wch }));
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "한진택배");
  return workbook;
}

export function getHanjinFileName(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(now);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `한진택배_통합주문_${values.year}${values.month}${values.day}_${values.hour}${values.minute}.xlsx`;
}

export function downloadHanjinExcel(orders: HanjinShippingRow[]): void {
  XLSX.writeFile(createHanjinWorkbook(orders), getHanjinFileName(), { compression: true });
}
