const IMPORT_TRACE_CATEGORIES = new Set(["소", "돼지"]);
const DOMESTIC_ORIGINS = new Set(["국내", "국내산", "대한민국", "한국", "한국산"]);

export function isImportedOrigin(countryOfOrigin: string | null | undefined) {
  const origin = countryOfOrigin?.trim().replace(/\s+/g, "") ?? "";
  return origin.length > 0 && !DOMESTIC_ORIGINS.has(origin);
}

/** 수입산 소·돼지에만 수입축산물 이력번호가 필요합니다. */
export function requiresImportTraceNumber({
  category,
  countryOfOrigin,
}: {
  category: string;
  countryOfOrigin: string | null | undefined;
}) {
  return IMPORT_TRACE_CATEGORIES.has(category.trim()) && isImportedOrigin(countryOfOrigin);
}
