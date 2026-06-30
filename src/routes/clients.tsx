import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

export const Route = createFileRoute("/clients")({
  head: () => ({
    meta: [
      { title: "거래처 관리 — 사내 ERP" },
      { name: "description", content: "거래처 등록 및 관리" },
    ],
  }),
  component: ClientsPage,
});

function ClientsPage() {
  const [items, setItems] = useState<Client[]>([]);
  const [form, setForm] = useState(empty());

  useEffect(() => {
    setItems(loadData<Client[]>(STORAGE_KEY, []));
  }, []);

  const persist = (next: Client[]) => {
    setItems(next);
    saveData(STORAGE_KEY, next);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("거래처명을 입력하세요.");
      return;
    }
    persist([{ ...form, id: crypto.randomUUID() }, ...items]);
    setForm(empty());
    toast.success("거래처가 등록되었습니다.");
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">거래처 관리</h1>
        <p className="text-sm text-muted-foreground mt-1">거래처를 등록하고 관리합니다.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">거래처 등록</CardTitle>
          <CardDescription>새 거래처 정보를 입력하세요.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormItem label="거래처명" required>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </FormItem>
            <FormItem label="사업자번호">
              <Input value={form.businessNumber} onChange={(e) => setForm({ ...form, businessNumber: e.target.value })} />
            </FormItem>
            <FormItem label="담당자">
              <Input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
            </FormItem>
            <FormItem label="연락처">
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </FormItem>
            <FormItem label="주소" className="md:col-span-2">
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </FormItem>
            <FormItem label="메모" className="md:col-span-2">
              <Input value={form.memo} onChange={(e) => setForm({ ...form, memo: e.target.value })} />
            </FormItem>
            <div className="md:col-span-2 flex justify-end">
              <Button type="submit"><Plus className="h-4 w-4 mr-2" />등록</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">거래처 목록 ({items.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-12">등록된 거래처가 없습니다.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>거래처명</TableHead>
                    <TableHead>사업자번호</TableHead>
                    <TableHead>담당자</TableHead>
                    <TableHead>연락처</TableHead>
                    <TableHead>주소</TableHead>
                    <TableHead>메모</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell>{c.businessNumber}</TableCell>
                      <TableCell>{c.contact}</TableCell>
                      <TableCell>{c.phone}</TableCell>
                      <TableCell className="max-w-[260px] truncate" title={c.address}>{c.address}</TableCell>
                      <TableCell className="max-w-[180px] truncate" title={c.memo}>{c.memo}</TableCell>
                      <TableCell>
                        <Button size="icon" variant="ghost" onClick={() => persist(items.filter((x) => x.id !== c.id))}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function FormItem({ label, required, className, children }: { label: string; required?: boolean; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <Label className="text-xs font-medium text-muted-foreground">
        {label}{required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
