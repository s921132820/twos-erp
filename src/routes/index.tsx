import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, Package, Truck, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "대시보드 — 사내 ERP" },
      { name: "description", content: "사내 ERP 대시보드" },
    ],
  }),
  component: Index,
});

const cards = [
  {
    to: "/shipping",
    title: "택배 발주 관리",
    desc: "택배 발주 입력 및 엑셀 다운로드",
    icon: Truck,
  },
  {
    to: "/clients",
    title: "거래처 관리",
    desc: "거래처 등록 및 관리",
    icon: Building2,
  },
  {
    to: "/items",
    title: "관리 품목 등록",
    desc: "취급 품목 등록 및 관리",
    icon: Package,
  },
] as const;

function Index() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">대시보드</h1>
        <p className="text-sm text-muted-foreground mt-1">
          업무를 시작할 메뉴를 선택하세요.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((c) => (
          <Link key={c.to} to={c.to}>
            <Card className="h-full transition-colors hover:border-primary/50 cursor-pointer">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <c.icon className="h-6 w-6 text-primary" />
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
                <CardTitle className="mt-2">{c.title}</CardTitle>
                <CardDescription>{c.desc}</CardDescription>
              </CardHeader>
              <CardContent />
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
