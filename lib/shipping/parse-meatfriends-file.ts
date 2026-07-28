import * as XLSX from "xlsx";
import { convertMeatfriendsRowToHanjinRow } from "./convert-meatfriends-to-hanjin";
import { parseMeatfriendsWorkbook } from "./parse-meatfriends-excel";
import type { ConvertedShippingRow } from "./types";
import { withShippingSource } from "./validation";

export function isHtmlTableFile(arrayBuffer: ArrayBuffer): boolean {
  const bytes = new Uint8Array(arrayBuffer.slice(0, 4096));
  const text = new TextDecoder("utf-8").decode(bytes).replace(/^\uFEFF/, "").trimStart().toLowerCase();
  return text.startsWith("<table") || text.startsWith("<html") || text.startsWith("<!doctype html") || text.includes("<table");
}

export function normalizeHtmlCellText(value: unknown): string {
  return String(value ?? "").replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
}

function decodeHtmlEntities(value: string): string {
  const named: Record<string, string> = { nbsp: " ", amp: "&", gt: ">", lt: "<", quot: '"', apos: "'" };
  return value.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (entity, code: string) => {
    if (code[0] !== "#") return named[code.toLowerCase()] ?? entity;
    const point = code[1]?.toLowerCase() === "x" ? Number.parseInt(code.slice(2), 16) : Number.parseInt(code.slice(1), 10);
    return Number.isFinite(point) ? String.fromCodePoint(point) : entity;
  });
}

export function parseHtmlTableRows(html: string): string[][] {
  const normalizedHtml = html.replace(/^\uFEFF/, "");
  const table = normalizedHtml.match(/<table\b[^>]*>[\s\S]*?<\/table>/i)?.[0];
  if (!table) throw new Error("미트프렌즈 파일에서 주문 표를 찾을 수 없습니다.");
  const rows: string[][] = [];
  for (const rowMatch of table.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const cells: string[] = [];
    for (const cellMatch of rowMatch[1].matchAll(/<(?:td|th)\b[^>]*>([\s\S]*?)<\/(?:td|th)>/gi)) {
      const visibleText = cellMatch[1].replace(/<br\s*\/?\s*>/gi, " ").replace(/<[^>]+>/g, "");
      cells.push(normalizeHtmlCellText(decodeHtmlEntities(visibleText)));
    }
    if (cells.length) rows.push(cells);
  }
  if (!rows.length) throw new Error("미트프렌즈 파일에서 주문 표를 찾을 수 없습니다.");
  return rows;
}

export function parseMeatfriendsFile(arrayBuffer: ArrayBuffer, sourceFileName: string): ConvertedShippingRow[] {
  let workbook: XLSX.WorkBook;
  if (isHtmlTableFile(arrayBuffer)) {
    const html = new TextDecoder("utf-8").decode(arrayBuffer).replace(/^\uFEFF/, "");
    const rows = parseHtmlTableRows(html);
    workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(rows), "orders");
  } else {
    try { workbook = XLSX.read(arrayBuffer, { type: "array", cellText: true, cellDates: false, raw: true }); }
    catch { throw new Error("미트프렌즈 파일을 읽지 못했습니다.\n파일 형식을 확인해 주세요."); }
  }
  return parseMeatfriendsWorkbook(workbook).map(({ row, sourceRowNumber }) => withShippingSource(convertMeatfriendsRowToHanjinRow(row), "meatfriends", sourceFileName, sourceRowNumber));
}
