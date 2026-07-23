export type LabelFieldKey =
  | "productName"
  | "storage"
  | "reportNumber"
  | "importHistoryNumber"
  | "origin"
  | "today"
  | "expiryDate"
  | "material";

export type LabelFieldLayout = {
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  lineHeight: number;
  paddingX: number;
  paddingY: number;
  align: "left" | "center" | "right";
  visible: boolean;
};

export type LabelPrintConfig = {
  dpi: number;
  widthMm: number;
  heightMm: number;
  contentOffsetX: number;
  contentOffsetY: number;
  manufacturerOffsetX: number;
  manufacturerOffsetY: number;
  fields: Record<LabelFieldKey, LabelFieldLayout>;
};

export type LabelTemplate = "box20kg" | "vacuum" | "meatboxInbound";

const field = (
  x: number,
  y: number,
  width: number,
  height: number,
  fontSize: number,
  align: LabelFieldLayout["align"],
  lineHeight = Math.round(fontSize * 1.25),
): LabelFieldLayout => ({ x, y, width, height, fontSize, lineHeight, paddingX: 4, paddingY: 3, align, visible: true });

export const LABEL_PRINT_CONFIGS: Record<LabelTemplate, LabelPrintConfig> = {
  box20kg: {
    dpi: 203,
    widthMm: 60,
    heightMm: 80,
    contentOffsetX: 0,
    contentOffsetY: -40,
    manufacturerOffsetX: 0,
    manufacturerOffsetY: 0,
    fields: {
      // contentOffsetY(-40) 적용 후 실제 Y가 12/14가 되도록 보정한다.
      productName: field(80, 52, 280, 44, 34, "center"),
      storage: field(380, 54, 80, 40, 27, "center"),
      reportNumber: field(50, 170, 380, 36, 27, "center"),
      importHistoryNumber: field(105, 210, 270, 78, 14, "center"),
      origin: field(330, 65, 130, 30, 22, "right"),
      today: field(330, 99, 130, 26, 19, "right"),
      expiryDate: field(300, 129, 160, 26, 19, "right"),
      material: field(145, 312, 310, 72, 14, "left", 18),
    },
  },
  vacuum: {
    dpi: 203, widthMm: 60, heightMm: 80,
    contentOffsetX: 0, contentOffsetY: 0, manufacturerOffsetX: 0, manufacturerOffsetY: 0,
    fields: {
      productName: field(0, 0, 480, 40, 30, "center"),
      storage: field(380, 0, 80, 40, 27, "center"),
      reportNumber: field(0, 50, 480, 30, 20, "center"),
      importHistoryNumber: field(100, 100, 280, 80, 14, "center"),
      origin: field(0, 190, 480, 30, 18, "center"),
      today: field(0, 230, 480, 30, 18, "center"),
      expiryDate: field(0, 270, 480, 30, 18, "center"),
      material: field(20, 320, 440, 100, 14, "left", 18),
    },
  },
  meatboxInbound: {
    dpi: 203, widthMm: 60, heightMm: 80,
    contentOffsetX: 0, contentOffsetY: 0, manufacturerOffsetX: 0, manufacturerOffsetY: 0,
    fields: {
      productName: field(0, 0, 480, 40, 30, "center"),
      storage: field(380, 0, 80, 40, 27, "center"),
      reportNumber: field(0, 50, 480, 30, 20, "center"),
      importHistoryNumber: field(100, 100, 280, 80, 14, "center"),
      origin: field(0, 190, 480, 30, 18, "center"),
      today: field(0, 230, 480, 30, 18, "center"),
      expiryDate: field(0, 270, 480, 30, 18, "center"),
      material: field(20, 320, 440, 100, 14, "left", 18),
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
  return dots * 25.4 / dpi;
}

export function normalizeLabelPrintConfig(config: LabelPrintConfig): LabelPrintConfig {
  const widthDots = Math.round(60 * config.dpi / 25.4);
  const heightDots = Math.round(80 * config.dpi / 25.4);
  const fields = Object.fromEntries(Object.entries(config.fields).map(([key, value]) => [key, {
    ...value,
    x: Math.round(Math.min(widthDots, Math.max(-widthDots, value.x))),
    y: Math.round(Math.min(heightDots, Math.max(-heightDots, value.y))),
    width: Math.round(Math.min(widthDots, Math.max(1, value.width))),
    height: Math.round(Math.min(heightDots, Math.max(1, value.height))),
    fontSize: Math.round(Math.min(80, Math.max(6, value.fontSize))),
    lineHeight: Math.round(Math.min(100, Math.max(6, value.lineHeight))),
    paddingX: Math.round(Math.min(40, Math.max(0, value.paddingX))),
    paddingY: Math.round(Math.min(40, Math.max(0, value.paddingY))),
  }])) as LabelPrintConfig["fields"];
  return {
    ...config,
    dpi: 203,
    widthMm: 60,
    heightMm: 80,
    contentOffsetX: Math.round(Math.min(80, Math.max(-80, config.contentOffsetX))),
    contentOffsetY: Math.round(Math.min(100, Math.max(-100, config.contentOffsetY))),
    manufacturerOffsetX: Math.round(Math.min(80, Math.max(-80, config.manufacturerOffsetX))),
    manufacturerOffsetY: Math.round(Math.min(100, Math.max(-100, config.manufacturerOffsetY))),
    fields,
  };
}
