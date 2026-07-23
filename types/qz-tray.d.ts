declare module "qz-tray" {
  type PrinterConfig = Record<string, unknown>;
  type RawData = { type: "raw"; format: "command"; flavor: "base64"; data: string };

  const qz: {
    websocket: {
      isActive(): boolean;
      connect(options?: Record<string, unknown>): Promise<void>;
      disconnect(): Promise<void>;
    };
    printers: {
      find(query?: string): Promise<string | string[]>;
    };
    configs: {
      create(printer: string, options?: Record<string, unknown>): PrinterConfig;
    };
    security: {
      setCertificatePromise(callback: (resolve: (certificate: string) => void, reject: (reason?: unknown) => void) => void): void;
      setSignatureAlgorithm(algorithm: string): void;
      setSignaturePromise(callback: (toSign: string) => (resolve: (signature: string) => void, reject: (reason?: unknown) => void) => void): void;
    };
    print(config: PrinterConfig, data: RawData[]): Promise<void>;
  };
  export = qz;
}
