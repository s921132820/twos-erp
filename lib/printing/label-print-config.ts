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
    contentOffsetY: 0,
    manufacturerGroupOffsetX: 0,
    manufacturerGroupOffsetY: 0,
    fields: {
      // BarTender 60×90 mm reference: 203 dpi uses 8 dots per millimetre.
      productName: { ...field(166, 14, 190, 48, 34, "center"), fontWeight: 900, autoFit: true },
      frozenText: { ...field(370, 14, 90, 44, 27, "center"), fontWeight: 900, autoFit: true },
      weight: { ...field(112, 140, 96, 44, 31, "right"), fontWeight: 900, autoFit: true },
      weightUnit: { ...field(208, 140, 52, 44, 31, "left"), fontWeight: 900, autoFit: true },
      productSpec: { ...field(24, 374, 310, 24, 15, "left"), fontWeight: 700, autoFit: true },
      reportNumber: { ...field(202, 222, 250, 38, 27, "center"), fontWeight: 900, autoFit: true },
      importHistoryNumber: { ...field(222, 304, 230, 20, 14, "center"), paddingY: 0, autoFit: true },
      barcodeNumber: { ...field(222, 270, 230, 34, 14, "center"), paddingX: 0, paddingY: 0, autoFit: true },
      origin: { ...field(354, 70, 106, 30, 22, "right"), fontWeight: 900, autoFit: true },
      today: { ...field(350, 116, 110, 28, 19, "right"), fontWeight: 800, autoFit: true },
      expiryDate: { ...field(318, 166, 142, 28, 19, "right"), fontWeight: 800, autoFit: true },
      material: { ...field(142, 348, 314, 48, 14, "left", 18), fontWeight: 400, maxLines: 3, verticalAlign: "top" },
      materialLabel: { ...field(24, 348, 118, 24, 14, "left", 18), fontWeight: 700, autoFit: false, verticalAlign: "top" },
      storageMethod: { ...field(24, 406, 432, 20, 14, "left"), fontWeight: 700, autoFit: true, visible: false },
      foodType: { ...field(24, 428, 432, 20, 14, "left"), fontWeight: 700, autoFit: true, visible: false },
      packagingMaterial: { ...field(160, 474, 296, 46, 15, "left", 22), fontWeight: 700, maxLines: 2 },
      notice: { ...field(24, 526, 432, 30, 12, "left", 16), fontWeight: 400, maxLines: 2, autoFit: true },
      manufacturer: { ...field(26, 606, 430, 48, 38, "left", 44), fontWeight: 900, autoFit: true },
      manufacturerAddress: { ...field(26, 658, 285, 24, 11, "left", 14), fontWeight: 700, autoFit: true },
      manufacturerPhone: { ...field(305, 658, 151, 24, 11, "right", 14), fontWeight: 700, autoFit: true },
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
