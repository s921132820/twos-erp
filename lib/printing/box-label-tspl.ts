import JsBarcode from "jsbarcode";
import type { LabelFieldLayout, LabelPrintConfig } from "@/lib/printing/label-print-config";
import { normalizeLabelPrintConfig } from "@/lib/printing/label-print-config";

export type BoxLabelPrintData = {
  productName: string;
  reportNumber: string;
  historyNumber: string;
  countryOfOrigin: string;
  manufactureDate: string;
  expirationDate: string;
  material: string;
};

export type TsplPrintSettings = { density: number; speed: number };

const WIDTH = 480;
const HEIGHT = 640;

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
  context.save();
  context.beginPath();
  context.rect(layout.x, layout.y, layout.width, layout.height);
  context.clip();
  context.fillStyle = "#000";
  const availableWidth = Math.max(1, layout.width - layout.paddingX * 2);
  const availableHeight = Math.max(1, layout.height - layout.paddingY * 2);
  let fontSize = layout.fontSize;
  context.font = `${weight} ${fontSize}px Arial, 'Malgun Gothic', sans-serif`;
  if (fitSingleLine) {
    while (fontSize > 16 && context.measureText(text).width > availableWidth) {
      fontSize -= 1;
      context.font = `${weight} ${fontSize}px Arial, 'Malgun Gothic', sans-serif`;
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
  const maxLines = fitSingleLine && context.measureText(text).width <= availableWidth
    ? 1
    : Math.max(1, Math.floor(availableHeight / lineHeight));
  const lines = maxLines === 1 ? [text] : wrapLines(context, text, availableWidth, maxLines);
  const blockHeight = lines.length * lineHeight;
  const firstLineY = layout.y + layout.paddingY + (availableHeight - blockHeight) / 2 + lineHeight / 2;
  lines.forEach((line, index) => {
    context.fillText(line, x, firstLineY + index * lineHeight);
  });
  context.restore();
}

function drawBarcode(context: CanvasRenderingContext2D, value: string, layout: LabelFieldLayout) {
  if (!layout.visible || !value) return;
  const barcodeCanvas = document.createElement("canvas");
  JsBarcode(barcodeCanvas, value, {
    format: "CODE128",
    width: 2,
    height: Math.max(24, layout.height - 24),
    displayValue: true,
    fontSize: layout.fontSize,
    textMargin: 2,
    margin: 0,
    background: "#ffffff",
    lineColor: "#000000",
  });
  context.drawImage(barcodeCanvas, layout.x, layout.y, layout.width, layout.height);
}

export async function renderBoxLabelCanvas(data: BoxLabelPrintData, printConfig: LabelPrintConfig) {
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
  drawField(context, data.productName || "제품명", config.fields.productName, 900, true);
  drawField(context, "냉동", config.fields.storage, 900, true);
  drawField(context, "20 kg", { x: 105, y: 82, width: 130, height: 40, fontSize: 31, lineHeight: 34, paddingX: 4, paddingY: 4, align: "center", visible: true }, 900);
  drawField(context, data.countryOfOrigin || "원산지", config.fields.origin);
  drawField(context, data.manufactureDate, config.fields.today);
  drawField(context, data.expirationDate ? `${data.expirationDate}까지` : "소비기한", config.fields.expiryDate);
  drawField(context, data.reportNumber || "품목보고번호", config.fields.reportNumber, 900);
  drawBarcode(context, data.historyNumber, config.fields.importHistoryNumber);
  drawField(context, "■ 원료 및 함량:", { x: 24, y: 312, width: 118, height: 24, fontSize: 15, lineHeight: 18, paddingX: 0, paddingY: 0, align: "left", visible: true }, 700);
  drawField(context, data.material, config.fields.material, 400);
  drawField(context, "■ 제품규격: 20 kg", { x: 24, y: 390, width: 220, height: 22, fontSize: 15, lineHeight: 18, paddingX: 0, paddingY: 0, align: "left", visible: true }, 700);
  drawField(context, "- HDPE\n- 골판지 / 진공포장", { x: 165, y: 430, width: 260, height: 48, fontSize: 15, lineHeight: 22, paddingX: 0, paddingY: 0, align: "left", visible: true }, 700);
  drawField(context, "■ 본 제품은 등록된 제조시설에서 제조하고 있습니다.", { x: 24, y: 495, width: 430, height: 22, fontSize: 12, lineHeight: 16, paddingX: 0, paddingY: 0, align: "left", visible: true }, 400);
  context.restore();

  context.save();
  context.translate(config.manufacturerOffsetX, config.manufacturerOffsetY);
  drawField(context, "제조원:", { x: 28, y: 550, width: 90, height: 34, fontSize: 24, lineHeight: 28, paddingX: 0, paddingY: 0, align: "left", visible: true }, 400);
  drawField(context, "(주)투에스푸드", { x: 115, y: 536, width: 330, height: 48, fontSize: 38, lineHeight: 44, paddingX: 0, paddingY: 0, align: "left", visible: true }, 900);
  drawField(context, "경기도 광주시 도척면 도척로 699번길 30-8. TEL:031-8027-2650", { x: 28, y: 600, width: 430, height: 18, fontSize: 11, lineHeight: 14, paddingX: 0, paddingY: 0, align: "left", visible: true }, 700);
  context.restore();
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
