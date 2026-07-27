export type MarketplaceType = "meatbox" | "coupang-wing";
export type MarketplaceSource = MarketplaceType;

export type ParsedOrderRow<T> = {
  row: T;
  sourceRowNumber: number;
};

export type MeatboxOrderRow = {
  productName: string;
  measuredWeight: string;
  receiverName: string;
  receiverContact: string;
  postalCode: string;
  shippingAddress: string;
  deliveryPrecautions: string;
};

export type CoupangWingOrderRow = {
  exposedProductName: string;
  receiverName: string;
  receiverPhoneNumber: string;
  postalCode: string;
  receiverAddress: string;
  deliveryMessage: string;
};

export type HanjinShippingRow = {
  receiverName: string;
  postalCode: string;
  address: string;
  phone: string;
  mobilePhone: string;
  packageQuantity: number;
  emptyColumn1: string;
  emptyColumn2: string;
  productName: string;
  emptyColumn3: string;
  deliveryMessage: string;
  shippingFareType: string;
};

export type ConvertedShippingRow = HanjinShippingRow & {
  source: MarketplaceSource;
  sourceFileName: string;
  sourceRowNumber: number;
  validation: {
    isValid: boolean;
    missingFields: string[];
  };
};

export type MarketplaceUploadState = {
  file: File | null;
  fileName: string;
  rows: ConvertedShippingRow[];
  error: string | null;
  isLoading: boolean;
};
