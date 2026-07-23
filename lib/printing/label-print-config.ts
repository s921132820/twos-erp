export type LabelFieldKey =
  | "productName"
  | "frozenText"
  | "weight"
  | "weightUnit"
  | "productSpec"
  | "reportNumber"
  | "importHistoryNumber"
  | "origin"
  | "today"
  | "expiryDate"
  | "material"
  | "materialLabel"
  | "storageMethod"
  | "foodType"
  | "packagingMaterial"
  | "notice"
  | "barcodeNumber"
  | "manufacturer"
  | "manufacturerAddress"
  | "manufacturerPhone";

export type LabelFieldLayout = {
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontWeight?: number;
  lineHeight: number;
  paddingX: number;
  paddingY: number;
  align: "left" | "center" | "right";
  verticalAlign?: "top" | "middle" | "bottom";
  visible: boolean;
  maxLines?: number;
  autoFit?: boolean;
  rotation?: number;
};

export type LabelPrintConfig = {
  dpi: number;
  widthMm: number;
  heightMm: number;
  contentOffsetX: number;
  contentOffsetY: number;
  manufacturerGroupOffsetX: number;
  manufacturerGroupOffsetY: number;
  fields: Record<LabelFieldKey, LabelFieldLayout>;
};

export type LabelTemplate = "box20kg" | "vacuum" | "meatboxInbound";
export const TSC_203_DOTS_PER_MM = 8;

const field = (
  x: number,
  y: number,
  width: number,
  height: number,
  fontSize: number,
  align: LabelFieldLayout["align"],
  lineHeight = Math.round(fontSize * 1.25),
): LabelFieldLayout => ({
  x, y, width, height, fontSize, fontWeight: 800, lineHeight,
  paddingX: 4, paddingY: 3, align, verticalAlign: "middle",
  visible: true, maxLines: 1, autoFit: false, rotation: 0,
});

export const LABEL_PRINT_CONFIGS: Record<LabelTemplate, LabelPrintConfig> = {
  box20kg: {
    dpi: 203,
    widthMm: 60,
    heightMm: 90,
    contentOffsetX: 0,
    contentOffsetY: -40,
    manufacturerGroupOffsetX: 0,
    manufacturerGroupOffsetY: 0,
    fields: {
      // contentOffsetY(-40) 적용 후 실제 Y가 12/14가 되도록 보정한다.
      productName: field(80, 52, 280, 44, 34, "center"),
      frozenText: { ...field(380, 54, 80, 40, 27, "center"), fontWeight: 900, autoFit: true },
      weight: { ...field(115, 122, 90, 40, 31, "right"), fontWeight: 900, autoFit: true },
      weightUnit: { ...field(208, 122, 45, 40, 31, "left"), fontWeight: 900, autoFit: true },
      productSpec: { ...field(24, 390, 300, 24, 15, "left"), fontWeight: 700, autoFit: true },
      reportNumber: field(50, 170, 380, 36, 27, "center"),
      importHistoryNumber: { ...field(105, 202, 270, 20, 14, "center"), autoFit: true },
      barcodeNumber: { ...field(105, 225, 270, 65, 14, "center"), autoFit: true },
      origin: field(330, 65, 130, 30, 22, "right"),
      today: field(330, 99, 130, 26, 19, "right"),
      expiryDate: field(300, 129, 160, 26, 19, "right"),
      material: { ...field(145, 312, 310, 72, 14, "left", 18), fontWeight: 400, maxLines: 4 },
      materialLabel: { ...field(24, 312, 118, 24, 15, "left", 18), fontWeight: 700, autoFit: true },
      storageMethod: { ...field(24, 418, 420, 22, 14, "left"), fontWeight: 700, autoFit: true },
      foodType: { ...field(24, 442, 420, 22, 14, "left"), fontWeight: 700, autoFit: true },
      packagingMaterial: { ...field(165, 466, 280, 48, 15, "left", 22), fontWeight: 700, maxLines: 2 },
      notice: { ...field(24, 515, 430, 30, 12, "left", 16), fontWeight: 400, maxLines: 2, autoFit: true },
      manufacturer: { ...field(28, 536, 417, 48, 38, "left", 44), fontWeight: 900, autoFit: true },
      manufacturerAddress: { ...field(28, 590, 430, 30, 11, "left", 14), fontWeight: 700, maxLines: 2, autoFit: true },
      manufacturerPhone: { ...field(28, 622, 430, 22, 11, "left", 14), fontWeight: 700, autoFit: true },
    },
  },
  vacuum: {
    dpi: 203, widthMm: 60, heightMm: 90,
    contentOffsetX: 0, contentOffsetY: 0, manufacturerGroupOffsetX: 0, manufacturerGroupOffsetY: 0,
    fields: {
      productName: field(0, 0, 480, 40, 30, "center"),
      frozenText: field(380, 0, 80, 40, 27, "center"),
      weight: field(100, 40, 100, 40, 28, "right"),
      weightUnit: field(205, 40, 60, 40, 28, "left"),
      productSpec: field(20, 290, 440, 30, 16, "left"),
      reportNumber: field(0, 50, 480, 30, 20, "center"),
      importHistoryNumber: field(100, 100, 280, 80, 14, "center"),
      barcodeNumber: field(100, 100, 280, 80, 14, "center"),
      origin: field(0, 190, 480, 30, 18, "center"),
      today: field(0, 230, 480, 30, 18, "center"),
      expiryDate: field(0, 270, 480, 30, 18, "center"),
      material: field(20, 320, 440, 100, 14, "left", 18),
      materialLabel: field(20, 292, 180, 24, 14, "left"),
      storageMethod: field(20, 425, 440, 24, 14, "left"),
      foodType: field(20, 452, 440, 24, 14, "left"),
      packagingMaterial: field(20, 480, 440, 45, 14, "left"),
      notice: field(20, 528, 440, 30, 12, "left"),
      manufacturer: field(20, 540, 440, 40, 24, "left"),
      manufacturerAddress: field(20, 590, 440, 36, 12, "left"),
      manufacturerPhone: field(20, 632, 440, 24, 12, "left"),
    },
  },
  meatboxInbound: {
    dpi: 203, widthMm: 60, heightMm: 90,
    contentOffsetX: 0, contentOffsetY: 0, manufacturerGroupOffsetX: 0, manufacturerGroupOffsetY: 0,
    fields: {
      productName: field(0, 0, 480, 40, 30, "center"),
      frozenText: field(380, 0, 80, 40, 27, "center"),
      weight: field(100, 40, 100, 40, 28, "right"),
      weightUnit: field(205, 40, 60, 40, 28, "left"),
      productSpec: field(20, 290, 440, 30, 16, "left"),
      reportNumber: field(0, 50, 480, 30, 20, "center"),
      importHistoryNumber: field(100, 100, 280, 80, 14, "center"),
      barcodeNumber: field(100, 100, 280, 80, 14, "center"),
      origin: field(0, 190, 480, 30, 18, "center"),
      today: field(0, 230, 480, 30, 18, "center"),
      expiryDate: field(0, 270, 480, 30, 18, "center"),
      material: field(20, 320, 440, 100, 14, "left", 18),
      materialLabel: field(20, 292, 180, 24, 14, "left"),
      storageMethod: field(20, 425, 440, 24, 14, "left"),
      foodType: field(20, 452, 440, 24, 14, "left"),
      packagingMaterial: field(20, 480, 440, 45, 14, "left"),
      notice: field(20, 528, 440, 30, 12, "left"),
      manufacturer: field(20, 540, 440, 40, 24, "left"),
      manufacturerAddress: field(20, 590, 440, 36, 12, "left"),
      manufacturerPhone: field(20, 632, 440, 24, 12, "left"),
    },
  },
};

export function cloneLabelPrintConfig(config: LabelPrintConfig): LabelPrintConfig {
  return {
    ...config,
    fields: Object.fromEntries(
      Object.entries(config.fields).map(([key, value]) => [key, { ...value }]),
    ) as LabelPrintConfig["fields"],
  };
}

export function dotsToMm(dots: number, dpi = 203) {
  return dpi === 203 ? dots / TSC_203_DOTS_PER_MM : dots * 25.4 / dpi;
}

export function mmToDots(mm: number, dpi = 203) {
  return Math.round(dpi === 203 ? mm * TSC_203_DOTS_PER_MM : mm * dpi / 25.4);
}

export function normalizeLabelPrintConfig(config: LabelPrintConfig): LabelPrintConfig {
  const widthDots = mmToDots(60, config.dpi);
  const heightDots = mmToDots(90, config.dpi);
  const legacyFields = config.fields as LabelPrintConfig["fields"] & { storage?: LabelFieldLayout };
  const fields = Object.fromEntries(Object.entries(LABEL_PRINT_CONFIGS.box20kg.fields).map(([key, fallback]) => {
    const migrated = key === "frozenText" && !config.fields?.frozenText
      ? legacyFields.storage
      : key === "barcodeNumber" && !config.fields?.barcodeNumber
        ? config.fields?.importHistoryNumber
        : undefined;
    const value = { ...fallback, ...migrated, ...config.fields?.[key as LabelFieldKey] };
    return [key, {
    ...value,
    x: Math.round(Math.min(widthDots, Math.max(-widthDots, value.x))),
    y: Math.round(Math.min(heightDots, Math.max(-heightDots, value.y))),
    width: Math.round(Math.min(widthDots, Math.max(1, value.width))),
    height: Math.round(Math.min(heightDots, Math.max(1, value.height))),
    fontSize: Math.round(Math.min(80, Math.max(6, value.fontSize))),
    lineHeight: Math.round(Math.min(100, Math.max(6, value.lineHeight))),
    paddingX: Math.round(Math.min(40, Math.max(0, value.paddingX))),
    paddingY: Math.round(Math.min(40, Math.max(0, value.paddingY))),
    fontWeight: Math.round(Math.min(900, Math.max(100, value.fontWeight ?? 800))),
    rotation: Math.round(Math.min(360, Math.max(-360, value.rotation ?? 0))),
  }];
  })) as LabelPrintConfig["fields"];
  return {
    ...config,
    dpi: 203,
    widthMm: 60,
    heightMm: 90,
    contentOffsetX: Math.round(Math.min(80, Math.max(-80, config.contentOffsetX))),
    contentOffsetY: Math.round(Math.min(100, Math.max(-100, config.contentOffsetY))),
    manufacturerGroupOffsetX: Math.round(Math.min(80, Math.max(-80, config.manufacturerGroupOffsetX ?? (config as LabelPrintConfig & { manufacturerOffsetX?: number }).manufacturerOffsetX ?? 0))),
    manufacturerGroupOffsetY: Math.round(Math.min(100, Math.max(-100, config.manufacturerGroupOffsetY ?? (config as LabelPrintConfig & { manufacturerOffsetY?: number }).manufacturerOffsetY ?? 0))),
    fields,
  };
}
