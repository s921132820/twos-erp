export type BoxLabelPrintData = {
  productName: string;
  reportNumber: string;
  historyNumber: string;
  countryOfOrigin: string;
  manufactureDate: string;
  expirationDate: string;
  material: string;
};

export type TsplPrintSettings = {
  density: number;
  speed: number;
};

const WIDTH = 480;
const HEIGHT = 640;

function centeredText(context: CanvasRenderingContext2D, text: string, y: number) {
  context.fillText(text, WIDTH / 2, y);
}

function wrapText(context: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number, maxLines: number) {
  const normalized = text.replace(/\r/g, "").split("\n");
  const lines: string[] = [];
  for (const paragraph of normalized) {
    let line = "";
    for (const character of paragraph) {
      const candidate = line + character;
      if (line && context.measureText(candidate).width > maxWidth) {
        lines.push(line);
        line = character;
      } else {
        line = candidate;
      }
      if (lines.length === maxLines) break;
    }
    if (lines.length < maxLines && line) lines.push(line);
    if (lines.length === maxLines) break;
  }
  lines.slice(0, maxLines).forEach((line, index) => context.fillText(line, x, y + index * lineHeight));
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

function canvasToBitmap(canvas: HTMLCanvasElement) {
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("라벨 비트맵을 읽지 못했습니다.");
  return packMonochromeRgba(context.getImageData(0, 0, WIDTH, HEIGHT).data, WIDTH, HEIGHT);
}

export async function createBoxLabelTspl(data: BoxLabelPrintData, settings: TsplPrintSettings) {
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

  context.font = "900 34px Arial, 'Malgun Gothic', sans-serif";
  context.textAlign = "center";
  context.fillText(data.productName || "제품명", 220, 12, 280);
  context.textAlign = "right";
  context.font = "900 27px Arial, 'Malgun Gothic', sans-serif";
  context.fillText("냉동", 460, 14);

  context.textAlign = "center";
  context.font = "900 31px Arial, 'Malgun Gothic', sans-serif";
  context.fillText("20 kg", 170, 82);
  context.textAlign = "right";
  context.font = "800 22px Arial, 'Malgun Gothic', sans-serif";
  context.fillText(data.countryOfOrigin || "원산지", 460, 65);
  context.font = "800 19px Arial, 'Malgun Gothic', sans-serif";
  context.fillText(data.manufactureDate || "", 460, 99);
  context.fillText(data.expirationDate ? `${data.expirationDate}까지` : "", 460, 129);

  context.textAlign = "center";
  context.font = "900 27px Arial, sans-serif";
  centeredText(context, data.reportNumber || "품목보고번호", 170);

  context.textAlign = "left";
  context.font = "700 15px Arial, 'Malgun Gothic', sans-serif";
  context.fillText("■ 원료 및 함량:", 24, 312);
  context.font = "14px Arial, 'Malgun Gothic', sans-serif";
  wrapText(context, data.material, 145, 312, 310, 18, 4);
  context.font = "700 15px Arial, 'Malgun Gothic', sans-serif";
  context.fillText("■ 제품규격: 20 kg", 24, 390);
  context.fillText("- HDPE", 165, 430);
  context.fillText("- 골판지 / 진공포장", 165, 452);
  context.font = "12px Arial, 'Malgun Gothic', sans-serif";
  context.fillText("■ 본 제품은 등록된 제조시설에서 제조하고 있습니다.", 24, 495);

  context.font = "24px Arial, 'Malgun Gothic', sans-serif";
  context.fillText("제조원:", 28, 550);
  context.font = "900 38px Arial, 'Malgun Gothic', sans-serif";
  context.fillText("(주)투에스푸드", 115, 536);
  context.font = "700 11px Arial, 'Malgun Gothic', sans-serif";
  context.fillText("경기도 광주시 도척면 도척로 699번길 30-8. TEL:031-8027-2650", 28, 600);

  const { bitmap, widthBytes, blackPixels } = canvasToBitmap(canvas);
  const encoder = new TextEncoder();
  const density = Math.min(15, Math.max(0, Math.round(settings.density)));
  const speed = Math.min(10, Math.max(1, settings.speed));
  const header = encoder.encode(`SIZE 60 mm,80 mm\r\nDIRECTION 1\r\nREFERENCE 0,0\r\nSPEED ${speed}\r\nDENSITY ${density}\r\nCLS\r\nBITMAP 0,0,${widthBytes},${HEIGHT},0,`);
  const barcode = data.historyNumber ? `\r\nBARCODE 105,210,"128",54,1,0,2,2,"${data.historyNumber}"` : "";
  const footer = encoder.encode(`${barcode}\r\nPRINT 1,1\r\n`);
  const command = new Uint8Array(header.length + bitmap.length + footer.length);
  command.set(header, 0);
  command.set(bitmap, header.length);
  command.set(footer, header.length + bitmap.length);
  return {
    command,
    canvas,
    bitmap,
    debug: {
      width: WIDTH,
      height: HEIGHT,
      widthBytes,
      threshold: 96,
      polarity: "1=white, 0=black" as const,
      bitOrder: "MSB-first" as const,
      bitmapMode: 0 as const,
      blackPixels,
      whitePixels: WIDTH * HEIGHT - blackPixels,
    },
  };
}
