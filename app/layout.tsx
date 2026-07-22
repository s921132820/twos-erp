import type { Metadata } from "next";
import { Toaster } from "sonner";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import "./globals.css";

export const metadata: Metadata = { title: "투에스푸드 ERP", description: "로컬 제품 관리 ERP" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body><AppSidebar /><div className="min-h-screen lg:pl-64"><AppHeader /><main className="p-5 lg:p-8">{children}</main></div><Toaster position="top-center" richColors /></body></html>;
}
