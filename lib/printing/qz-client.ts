import type qzType from "qz-tray";

let qzPromise: Promise<typeof qzType> | null = null;
let securityConfigured = false;

async function getQz() {
  qzPromise ??= import("qz-tray").then((module) => module.default ?? module);
  return qzPromise;
}

async function configureSecurity(qz: typeof qzType) {
  if (securityConfigured) return;
  securityConfigured = true;
  const certificateResponse = await fetch("/api/printing/qz/certificate", { cache: "no-store" });
  if (!certificateResponse.ok || certificateResponse.status === 204) return;
  const certificate = await certificateResponse.text();
  qz.security.setCertificatePromise((resolve) => resolve(certificate));
  qz.security.setSignatureAlgorithm("SHA512");
  qz.security.setSignaturePromise((toSign) => async (resolve, reject) => {
    try {
      const response = await fetch("/api/printing/qz/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request: toSign }),
      });
      if (!response.ok) throw new Error("QZ Tray 인쇄 요청 서명에 실패했습니다.");
      resolve(await response.text());
    } catch (error) {
      reject(error);
    }
  });
}

async function connectQz() {
  const qz = await getQz();
  await configureSecurity(qz);
  if (!qz.websocket.isActive()) await qz.websocket.connect({ retries: 1, delay: 0 });
  return qz;
}

export async function listQzPrinters() {
  try {
    const qz = await connectQz();
    const printers = await qz.printers.find();
    return Array.isArray(printers) ? printers : [printers];
  } catch (error) {
    throw new Error("QZ Tray에 연결하지 못했습니다. QZ Tray가 설치되어 실행 중인지 확인해 주세요.", { cause: error });
  }
}

function toBase64(data: Uint8Array) {
  let binary = "";
  const chunkSize = 0x8000;
  for (let offset = 0; offset < data.length; offset += chunkSize) {
    binary += String.fromCharCode(...data.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
}

export async function printTspl(printerName: string, tspl: Uint8Array, jobName: string) {
  const qz = await connectQz();
  const printers = await qz.printers.find();
  const names = Array.isArray(printers) ? printers : [printers];
  const printer = names.find((name) => name.toLocaleLowerCase() === printerName.trim().toLocaleLowerCase());
  if (!printer) throw new Error(`프린터 '${printerName}'을(를) 찾을 수 없습니다.`);

  const config = qz.configs.create(printer, { copies: 1, jobName });
  await qz.print(config, [{ type: "raw", format: "command", flavor: "base64", data: toBase64(tspl) }]);
}
