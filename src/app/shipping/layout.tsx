import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "택배 발주 관리 — 사내 ERP",
  description: "택배 발주 입력 및 엑셀 다운로드",
};

export default function ShippingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
