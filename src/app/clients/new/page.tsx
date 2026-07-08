"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { loadData, saveData } from "@/lib/storage";

interface Client {
  id: string;
  name: string;
  businessNumber: string;
  contact: string;
  phone: string;
  address: string;
  memo: string;
}

const STORAGE_KEY = "erp.clients";
const empty = (): Omit<Client, "id"> => ({
  name: "",
  businessNumber: "",
  contact: "",
  phone: "",
  address: "",
  memo: "",
});

export default function NewClientPage() {
  const router = useRouter();
  const [form, setForm] = useState(empty());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("거래처명을 입력하세요.");
      return;
    }
    const existing = loadData<Client[]>(STORAGE_KEY, []);
    saveData(STORAGE_KEY, [{ ...form, id: crypto.randomUUID() }, ...existing]);
    toast.success("거래처가 등록되었습니다.");
    router.push("/clients");
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">거래처 등록</h1>
          <p className="text-sm text-muted-foreground mt-1">새 거래처 정보를 입력하세요.</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/clients">
            <ArrowLeft className="h-4 w-4 mr-2" />
            목록으로
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">거래처 정보</CardTitle>
          <CardDescription>필수 항목(*)을 반드시 입력해 주세요.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormItem label="거래처명" required>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </FormItem>
            <FormItem label="사업자번호">
              <Input
                value={form.businessNumber}
                onChange={(e) => setForm({ ...form, businessNumber: e.target.value })}
              />
            </FormItem>
            <FormItem label="담당자">
              <Input
                value={form.contact}
                onChange={(e) => setForm({ ...form, contact: e.target.value })}
              />
            </FormItem>
            <FormItem label="연락처">
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </FormItem>
            <FormItem label="주소" className="md:col-span-2">
              <Input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </FormItem>
            <FormItem label="메모" className="md:col-span-2">
              <Input
                value={form.memo}
                onChange={(e) => setForm({ ...form, memo: e.target.value })}
              />
            </FormItem>
            <div className="md:col-span-2 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => router.push("/clients")}>
                취소
              </Button>
              <Button type="submit">
                <Plus className="h-4 w-4 mr-2" />
                등록
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function FormItem({
  label,
  required,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <Label className="text-xs font-medium text-muted-foreground">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
