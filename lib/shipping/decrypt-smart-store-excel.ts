export const SMART_STORE_EXCEL_PASSWORD = "1234";

export async function decryptSmartStoreExcel(data: ArrayBuffer): Promise<ArrayBuffer> {
  try {
    const { default: XlsxPopulate } = await import("xlsx-populate/browser/xlsx-populate");
    const workbook = await XlsxPopulate.fromDataAsync(data, { password: SMART_STORE_EXCEL_PASSWORD });
    const decrypted = await workbook.outputAsync({ type: "arraybuffer" });
    if (!(decrypted instanceof ArrayBuffer)) throw new Error("Unexpected decrypted data type");
    return decrypted;
  } catch {
    throw new Error("스마트스토어 엑셀 파일의 비밀번호를 해제하지 못했습니다.\n\n파일 비밀번호가 1234인지 확인하거나\n스마트스토어에서 주문 파일을 다시 다운로드해주세요.");
  }
}
