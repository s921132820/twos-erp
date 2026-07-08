import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "거래처 등록 — 사내 ERP",
  description: "새 거래처를 등록합니다.",
};

export default function NewClientLayout({ children }: { children: React.ReactNode }) {
  return children;
}
