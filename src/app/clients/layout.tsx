import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "거래처 관리 — 사내 ERP",
  description: "거래처 목록 및 관리",
};

export default function ClientsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
