import "server-only";

import { XMLParser } from "fast-xml-parser";
import { load } from "cheerio";

type TraceItem = Record<string, unknown>;

export type AnimalTraceLookup = {
  historyNumber: string;
  importDate: string;
  countryOfOrigin: string;
  supplierName: string;
  itemName: string;
  billOfLadingNumber: string;
  exporterName: string;
  foreignSlaughterhouse: string;
  foreignProcessingPlant: string;
  partNameCode: string;
  foreignSlaughterDate: string;
  memo: string;
  dateSource: string | null;
  supplierSource: string | null;
  missingFields: Array<"importDate" | "countryOfOrigin" | "supplierName">;
};

const parser = new XMLParser({ ignoreAttributes: false, trimValues: true });

function asItems(value: unknown): TraceItem[] {
  if (!value || typeof value !== "object") return [];
  const root = value as Record<string, unknown>;
  const response = root.response as Record<string, unknown> | undefined;
  const body = response?.body as Record<string, unknown> | undefined;
  const items = body?.items as Record<string, unknown> | undefined;
  const item = items?.item;
  if (Array.isArray(item)) return item.filter((row): row is TraceItem => Boolean(row) && typeof row === "object");
  return item && typeof item === "object" ? [item as TraceItem] : [];
}

function firstString(items: TraceItem[], keys: string[]) {
  for (const key of keys) {
    for (const item of items) {
      const value = item[key];
      if (typeof value === "string" && value.trim()) return { value: value.trim(), source: key };
      if (typeof value === "number") return { value: String(value), source: key };
    }
  }
  return { value: "", source: null };
}

function dateValue(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.length === 8 ? `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}` : "";
}

export function startDateValue(value: string) {
  const match = value.trim().match(/^(\d{4}-\d{2}-\d{2})/);
  if (!match) return "";
  const date = new Date(`${match[1]}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === match[1] ? match[1] : "";
}

async function requestOption(traceNo: string, optionNo: string) {
  const apiKey = process.env.ANIMAL_TRACE_API_KEY;
  const apiUrl = process.env.ANIMAL_TRACE_API_URL;
  if (!apiKey || !apiUrl) throw new Error("축산물 이력 API 환경변수가 설정되지 않았습니다.");

  const url = new URL(apiUrl);
  url.searchParams.set("serviceKey", apiKey);
  url.searchParams.set("traceNo", traceNo);
  url.searchParams.set("optionNo", optionNo);

  const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(10_000) });
  if (!response.ok) throw new Error(`축산물 이력 API가 HTTP ${response.status}를 반환했습니다.`);
  const xml = parser.parse(await response.text()) as unknown;
  return asItems(xml);
}

async function lookupMeatwatch(traceNo: string): Promise<AnimalTraceLookup | null> {
  const endpoint = process.env.MEATWATCH_LOOKUP_URL;
  if (!endpoint) throw new Error("MeatWatch 조회 URL이 설정되지 않았습니다.");
  const url = new URL(endpoint);
  url.searchParams.set("searchWrd2", traceNo);
  const response = await fetch(url, {
    cache: "no-store",
    headers: { "User-Agent": "twosfood-erp/1.0" },
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`MeatWatch가 HTTP ${response.status}를 반환했습니다.`);

  const html = await response.text();
  if (html.includes("정보를 찾을 수 없습니다")) return null;
  const $ = load(html);
  const fields = new Map<string, string>();
  $("tr").each((_index, row) => {
    let label = "";
    $(row).children("th,td").each((_cellIndex, cell) => {
      const value = $(cell).text().replace(/\s+/g, " ").trim();
      if (cell.tagName.toLowerCase() === "th") label = value;
      else if (label && value) { fields.set(label, value); label = ""; }
    });
  });

  const returnedNumber = fields.get("이력번호") ?? "";
  if (!returnedNumber || returnedNumber !== traceNo) return null;
  const importDate = fields.get("수입일자") ?? "";
  const country = fields.get("원산지 국가") ?? "";
  const importer = fields.get("수입업체") ?? "";
  const missingFields: AnimalTraceLookup["missingFields"] = [];
  if (!importDate) missingFields.push("importDate");
  if (!country) missingFields.push("countryOfOrigin");
  if (!importer) missingFields.push("supplierName");

  return {
    historyNumber: returnedNumber,
    importDate,
    countryOfOrigin: country,
    supplierName: importer,
    itemName: fields.get("수입축산물 품목명") ?? "",
    billOfLadingNumber: fields.get("선하증권번호") ?? "",
    exporterName: fields.get("수출업체") ?? "",
    foreignSlaughterhouse: fields.get("수출국 도축장") ?? "",
    foreignProcessingPlant: fields.get("수출국 가공장") ?? "",
    partNameCode: fields.get("부위명(코드)") ?? "",
    foreignSlaughterDate: startDateValue(fields.get("수출국 도축일자") ?? ""),
    memo: "",
    dateSource: importDate ? "MeatWatch 수입일자" : null,
    supplierSource: importer ? "MeatWatch 수입업체" : null,
    missingFields,
  };
}

export async function lookupAnimalTrace(traceNo: string): Promise<AnimalTraceLookup> {
  const normalized = traceNo.trim().replace(/\s/g, "");
  if (/^\d{12}$/.test(normalized)) {
    const imported = await lookupMeatwatch(normalized);
    if (imported) return imported;
  }
  const responses = await Promise.allSettled(["1", "2", "3", "4"].map((option) => requestOption(normalized, option)));
  const items = responses.flatMap((result) => result.status === "fulfilled" ? result.value : []);
  if (items.length === 0) throw new Error("해당 이력번호의 공공데이터를 찾지 못했습니다.");

  const country = firstString(items, ["nationNm"]);
  const date = firstString(items, ["importYmd", "importDt", "regYmd", "issueDt", "processYmd", "butcheryYmd"]);
  const supplier = firstString(items, ["reqerEntrpNm", "entrpNm", "processPlaceNm", "butcheryPlaceNm"]);
  const formattedDate = dateValue(date.value);
  const missingFields: AnimalTraceLookup["missingFields"] = [];
  if (!formattedDate) missingFields.push("importDate");
  if (!country.value) missingFields.push("countryOfOrigin");
  if (!supplier.value) missingFields.push("supplierName");

  return {
    historyNumber: normalized,
    importDate: formattedDate,
    countryOfOrigin: country.value,
    supplierName: supplier.value,
    itemName: "",
    billOfLadingNumber: "",
    exporterName: "",
    foreignSlaughterhouse: "",
    foreignProcessingPlant: "",
    partNameCode: "",
    foreignSlaughterDate: "",
    memo: "",
    dateSource: date.source,
    supplierSource: supplier.source,
    missingFields,
  };
}
