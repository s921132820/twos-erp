"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadHanjinExcel } from "@/lib/shipping/export-hanjin-excel";
import type { HanjinShippingRow } from "@/lib/shipping/types";

export function ShippingDownloadButton({ orders, isLoading }: { orders: HanjinShippingRow[]; isLoading: boolean }) {
  return <Button type="button" disabled={orders.length === 0 || isLoading} onClick={() => downloadHanjinExcel(orders)}><Download size={17} />한진택배 통합 엑셀 다운로드</Button>;
}
