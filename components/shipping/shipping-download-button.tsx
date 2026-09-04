"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadIntegratedShippingExcel } from "@/lib/shipping/export-integrated-excel";
import type { ProductSummaryExportRow } from "@/lib/shipping/export-product-summary";
import type { HanjinShippingRow } from "@/lib/shipping/types";

export function ShippingDownloadButton({ orders, productSummaryRows, isLoading }: { orders: HanjinShippingRow[]; productSummaryRows: ProductSummaryExportRow[]; isLoading: boolean }) {
  return <Button type="button" disabled={orders.length === 0 || isLoading} onClick={() => downloadIntegratedShippingExcel(orders, productSummaryRows)}><Download size={17} />통합 엑셀 다운로드</Button>;
}
