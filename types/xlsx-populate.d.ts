declare module "xlsx-populate" {
  type BinaryData = ArrayBuffer | Uint8Array | Blob;
  type Options = { password?: string; type?: "arraybuffer" | "uint8array" | "blob" };
  type Workbook = { outputAsync(options?: Options | string): Promise<ArrayBuffer | Uint8Array | Blob | string> };
  const XlsxPopulate: {
    fromDataAsync(data: BinaryData, options?: Options): Promise<Workbook>;
  };
  export default XlsxPopulate;
}

declare module "xlsx-populate/browser/xlsx-populate" {
  import XlsxPopulate from "xlsx-populate";
  export default XlsxPopulate;
}
