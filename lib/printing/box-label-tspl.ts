import JsBarcode from "jsbarcode";
import type { LabelFieldKey, LabelFieldLayout, LabelPrintConfig } from "@/lib/printing/label-print-config";
import { normalizeLabelPrintConfig } from "@/lib/printing/label-print-config";

export type BoxLabelPrintData = {
  productName: string;
  frozenText: string;
  weight: string;
  weightUnit: string;
  productSpec: string;
  reportNumber: string;
  historyNumber: string;
  barcodeNumber: string;
  countryOfOrigin: string;
  manufactureDate: string;
  expirationDate: string;
  material: string;
  materialLabel: string;
  storageMethod: string;
  foodType: string;
  packagingMaterial: string;
  notice: string;
  manufacturer: string;
  manufacturerAddress: string;
  manufacturerPhone: string;
};

export type TsplPrintSettings = { density: number; speed: number };

const WIDTH = 480;
const HEIGHT = 720;
export const BARCODE_MIN_BARS_HEIGHT = 24;

export function minimumBarcodeHeight() {
  return BARCODE_MIN_BARS_HEIGHT;
}

function wrapLines(context: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number) {
  const lines: string[] = [];
  for (const paragraph of text.replace(/\r/g, "").split("\n")) {
    let line = "";
    for (const character of paragraph) {
      const candidate = line + character;
      if (line && context.measureText(candidate).width > maxWidth) {
        lines.push(line);
        line = character;
      } else line = candidate;
      if (lines.length >= maxLines) break;
    }
    if (lines.length < maxLines && line) lines.push(line);
    if (lines.length >= maxLines) break;
  }
  return lines;
}

function drawField(context: CanvasRenderingContext2D, text: string, layout: LabelFieldLayout, weight = 800, fitSingleLine = false) {
  if (!layout.visible || !text) return;
  if (layout.rotation) {
    context.save();
    context.translate(layout.x + layout.width / 2, layout.y + layout.height / 2);
    context.rotate(layout.rotation * Math.PI / 180);
    drawField(context, text, { ...layout, x: -layout.width / 2, y: -layout.height / 2, rotation: 0 }, weight, fitSingleLine);
    context.restore();
    return;
  }
  context.save();
  context.beginPath();
  context.rect(layout.x, layout.y, layout.width, layout.height);
  context.clip();
  context.fillStyle = "#000";
  const availableWidth = Math.max(1, layout.width - layout.paddingX * 2);
  const availableHeight = Math.max(1, layout.height - layout.paddingY * 2);
  let fontSize = layout.fontSize;
  const fontWeight = layout.fontWeight ?? weight;
  const autoFit = layout.autoFit ?? fitSingleLine;
  const minimumFontSize = Math.max(6, Math.min(16, layout.fontSize));
  context.font = `${fontWeight} ${fontSize}px Arial, 'Malgun Gothic', sans-serif`;
  if (autoFit) {
    while (fontSize > minimumFontSize && context.measureText(text).width > availableWidth) {
      fontSize -= 1;
      context.font = `${fontWeight} ${fontSize}px Arial, 'Malgun Gothic', sans-serif`;
    }
  }
  context.textAlign = layout.align;
  context.textBaseline = "middle";
  const x = layout.align === "left"
    ? layout.x + layout.paddingX
    : layout.align === "right"
      ? layout.x + layout.width - layout.paddingX
      : layout.x + layout.width / 2;
  const lineHeight = Math.max(fontSize, layout.lineHeight);
  const maxLines = autoFit && context.measureText(text).width <= availableWidth
    ? 1
    : Math.min(layout.maxLines ?? Number.POSITIVE_INFINITY, Math.max(1, Math.floor(availableHeight / lineHeight)));
  const lines = maxLines === 1 ? [text] : wrapLines(context, text, availableWidth, maxLines);
  const blockHeight = lines.length * lineHeight;
  const verticalOffset = layout.verticalAlign === "top"
    ? 0
    : layout.verticalAlign === "bottom"
      ? availableHeight - blockHeight
      : (availableHeight - blockHeight) / 2;
  const firstLineY = layout.y + layout.paddingY + verticalOffset + lineHeight / 2;
  lines.forEach((line, index) => {
    context.fillText(line, x, firstLineY + index * lineHeight);
  });
  context.restore();
}

function drawBarcode(context: CanvasRenderingContext2D, value: string, layout: LabelFieldLayout) {
  if (!layout.visible || !value) return;
  if (layout.rotation) {
    context.save();
    context.translate(layout.x + layout.width / 2, layout.y + layout.height / 2);
    context.rotate(layout.rotation * Math.PI / 180);
    drawBarcode(context, value, { ...layout, x: -layout.width / 2, y: -layout.height / 2, rotation: 0 });
    context.restore();
    return;
  }
  const makeBarcode = (moduleWidth: number) => {
    const barcodeCanvas = document.createElement("canvas");
    JsBarcode(barcodeCanvas, value, {
      format: "CODE128",
      width: moduleWidth,
      height: Math.max(BARCODE_MIN_BARS_HEIGHT, Math.round(layout.height)),
      displayValue: false,
      margin: 0,
      background: "#ffffff",
      lineColor: "#000000",
    });
    return barcodeCanvas;
  };
  let barcodeCanvas = makeBarcode(2);
  if (barcodeCanvas.width > layout.width) barcodeCanvas = makeBarcode(1);
  const drawX = Math.round(layout.x + (layout.width - barcodeCanvas.width) / 2);
  const drawY = Math.round(layout.y + (layout.height - barcodeCanvas.height) / 2);
  context.save();
  context.beginPath();
  context.rect(layout.x, layout.y, layout.width, layout.height);
  context.clip();
  context.imageSmoothingEnabled = false;
  context.drawImage(barcodeCanvas, drawX, drawY);
  context.restore();
}

export async function renderBoxLabelCanvas(data: BoxLabelPrintData, printConfig: LabelPrintConfig, options?: { selectedField?: LabelFieldKey }) {
  const config = normalizeLabelPrintConfig(printConfig);
  await document.fonts.ready;
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("라벨 이미지를 생성하지 못했습니다.");
  context.fillStyle = "#fff";
  context.fillRect(0, 0, WIDTH, HEIGHT);
  context.fillStyle = "#000";
  context.textBaseline = "top";

  context.save();
  context.translate(config.contentOffsetX, config.contentOffsetY);
  drawField(context, data.productName, config.fields.productName, 900, true);
  drawField(context, data.frozenText, config.fields.frozenText);
  drawField(context, data.weight, config.fields.weight);
  drawField(context, data.weightUnit, config.fields.weightUnit);
  drawField(context, data.countryOfOrigin, config.fields.origin);
  drawField(context, data.manufactureDate, config.fields.today);
  drawField(context, data.expirationDate, config.fields.expiryDate);
  drawField(context, data.reportNumber, config.fields.reportNumber, 900);
  const barcodeValue = data.barcodeNumber || data.historyNumber;
  drawBarcode(context, barcodeValue, config.fields.barcodeNumber);
  drawField(context, barcodeValue, config.fields.importHistoryNumber);
  drawField(context, data.materialLabel, config.fields.materialLabel);
  drawField(context, data.material, config.fields.material, 400);
  const productSpecText = `■제품규격:${data.productSpec.trim() ? ` ${data.productSpec.trim()}` : ""}`;
  drawField(context, productSpecText, config.fields.productSpec);
  drawField(context, data.storageMethod, config.fields.storageMethod);
  drawField(context, data.foodType, config.fields.foodType);
  drawField(context, data.packagingMaterial, config.fields.packagingMaterial);
  drawField(context, data.notice, config.fields.notice);
  context.restore();

  context.save();
  context.translate(config.manufacturerGroupOffsetX, config.manufacturerGroupOffsetY);
  drawField(context, data.manufacturer, config.fields.manufacturer);
  drawField(context, data.manufacturerAddress, config.fields.manufacturerAddress);
  drawField(context, data.manufacturerPhone, config.fields.manufacturerPhone);
  context.restore();

  if (options?.selectedField) {
    const key = options.selectedField;
    const layout = config.fields[key];
    const manufacturerField = key === "manufacturer" || key === "manufacturerAddress" || key === "manufacturerPhone";
    const offsetX = manufacturerField ? config.manufacturerGroupOffsetX : config.contentOffsetX;
    const offsetY = manufacturerField ? config.manufacturerGroupOffsetY : config.contentOffsetY;
    context.save();
    context.strokeStyle = "#2563eb";
    context.lineWidth = 2;
    context.setLineDash([6, 4]);
    context.strokeRect(layout.x + offsetX, layout.y + offsetY, layout.width, layout.height);
    context.restore();
  }
  return { canvas, config };
}

export function packMonochromeRgba(pixels: Uint8ClampedArray, width: number, height: number, threshold = 96) {
  const widthBytes = Math.ceil(width / 8);
  const bitmap = new Uint8Array(widthBytes * height);
  bitmap.fill(0xff);
  let blackPixels = 0;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const pixel = (y * width + x) * 4;
      const luminance = pixels[pixel] * 0.299 + pixels[pixel + 1] * 0.587 + pixels[pixel + 2] * 0.114;
      if (pixels[pixel + 3] > 0 && luminance < threshold) {
        bitmap[y * widthBytes + Math.floor(x / 8)] &= ~(0x80 >> (x % 8));
        blackPixels += 1;
      }
    }
  }
  return { bitmap, widthBytes, blackPixels };
}

export async function createBoxLabelTspl(data: BoxLabelPrintData, settings: TsplPrintSettings, printConfig: LabelPrintConfig) {
  const { canvas, config } = await renderBoxLabelCanvas(data, printConfig);
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("라벨 비트맵을 읽지 못했습니다.");
  const { bitmap, widthBytes, blackPixels } = packMonochromeRgba(context.getImageData(0, 0, WIDTH, HEIGHT).data, WIDTH, HEIGHT);
  const encoder = new TextEncoder();
  const density = Math.min(15, Math.max(0, Math.round(settings.density)));
  const speed = Math.min(10, Math.max(1, settings.speed));
  const header = encoder.encode(`SIZE ${config.widthMm} mm,${config.heightMm} mm\r\nDIRECTION 1\r\nREFERENCE 0,0\r\nSPEED ${speed}\r\nDENSITY ${density}\r\nCLS\r\nBITMAP 0,0,${widthBytes},${HEIGHT},0,`);
  const footer = encoder.encode("\r\nPRINT 1,1\r\n");
  const command = new Uint8Array(header.length + bitmap.length + footer.length);
  command.set(header, 0);
  command.set(bitmap, header.length);
  command.set(footer, header.length + bitmap.length);
  return {
    command, canvas, bitmap,
    debug: {
      width: WIDTH, height: HEIGHT, widthBytes, threshold: 96,
      polarity: "1=white, 0=black" as const, bitOrder: "MSB-first" as const,
      bitmapMode: 0 as const, blackPixels, whitePixels: WIDTH * HEIGHT - blackPixels,
      printConfig: config,
    },
  };
}
