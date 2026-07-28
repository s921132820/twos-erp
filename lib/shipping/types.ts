export type MarketplaceType = "meatbox" | "coupang-wing" | "smart-store" | "meatfriends";
export type MarketplaceSource = MarketplaceType | "manual";

export type ParsedOrderRow<T> = {
  row: T;
  sourceRowNumber: number;
};

export type MeatboxOrderRow = {
  productNumber: string;
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

export type SmartStoreOrderRow = {
  receiverName: string;
  productName: string;
  integratedAddress: string;
  buyerPhoneNumber: string;
  postalCode: string;
  deliveryMessage: string;
};

export type MeatfriendsOrderRow = {
  recipientName: string;
  basicContact: string;
  postalCode: string;
  address: string;
  detailAddress: string;
  productName: string;
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
  rowKey: string;
  source: MarketplaceSource;
  sourceFileName: string;
  sourceRowNumber: number;
  validation: {
    isValid: boolean;
    missingFields: string[];
  };
};

export type ManualShippingForm = Omit<HanjinShippingRow, "emptyColumn1" | "emptyColumn2" | "emptyColumn3"> & {
  selectedClientId: string | null;
  phoneWasManuallyEdited: boolean;
};

export type ManualShippingRow = ConvertedShippingRow & {
  source: "manual";
  id: string;
  selectedClientId: string | null;
};

export type ShippingClientSearchResult = {
  id: string;
  companyName: string;
  consigneeName: string;
  postalCode: string | null;
  address: string | null;
  phone: string | null;
  mobilePhone: string | null;
  primaryProduct: string | null;
  deliveryMessage: string | null;
};

export type ProductQuantitySummary = {
  key: string;
  productName: string;
  quantity: number;
};

export type MarketplaceUploadState = {
  file: File | null;
  fileName: string;
  rows: ConvertedShippingRow[];
  error: string | null;
  isLoading: boolean;
  status: "idle" | "decrypting" | "parsing" | "success" | "error";
};
