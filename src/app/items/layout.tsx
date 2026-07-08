import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "관리 품목 등록 — 사내 ERP",
  description: "관리 품목 등록 및 관리",
};

export default function ItemsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
