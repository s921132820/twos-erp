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

interface Item {
  id: string;
  code: string;
  name: string;
  category: string;
  unit: string;
  price: number;
  memo: string;
}

const STORAGE_KEY = "erp.items";
const empty = (): Omit<Item, "id"> => ({
  code: "",
  name: "",
  category: "",
  unit: "EA",
  price: 0,
  memo: "",
});

export const Route = createFileRoute("/items")({
  head: () => ({
    meta: [
      { title: "관리 품목 등록 — 사내 ERP" },
      { name: "description", content: "관리 품목 등록 및 관리" },
    ],
  }),
  component: ItemsPage,
});

function ItemsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [form, setForm] = useState(empty());

  useEffect(() => {
    setItems(loadData<Item[]>(STORAGE_KEY, []));
  }, []);

  const persist = (next: Item[]) => {
    setItems(next);
    saveData(STORAGE_KEY, next);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("품목명을 입력하세요.");
      return;
    }
    persist([{ ...form, id: crypto.randomUUID() }, ...items]);
    setForm(empty());
    toast.success("품목이 등록되었습니다.");
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">관리 품목 등록</h1>
        <p className="text-sm text-muted-foreground mt-1">취급 품목을 등록하고 관리합니다.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">품목 등록</CardTitle>
          <CardDescription>새 품목 정보를 입력하세요.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormItem label="품목코드">
              <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
            </FormItem>
            <FormItem label="품목명" required>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </FormItem>
            <FormItem label="분류">
              <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            </FormItem>
            <FormItem label="단위">
              <Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
            </FormItem>
            <FormItem label="단가">
              <Input
                type="number"
                min={0}
                value={form.price}
                onChange={(e) => setForm({ ...form, price: parseInt(e.target.value, 10) || 0 })}
              />
            </FormItem>
            <FormItem label="메모">
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
          <CardTitle className="text-base">품목 목록 ({items.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-12">등록된 품목이 없습니다.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>품목코드</TableHead>
                    <TableHead>품목명</TableHead>
                    <TableHead>분류</TableHead>
                    <TableHead>단위</TableHead>
                    <TableHead className="text-right">단가</TableHead>
                    <TableHead>메모</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((it) => (
                    <TableRow key={it.id}>
                      <TableCell>{it.code}</TableCell>
                      <TableCell className="font-medium">{it.name}</TableCell>
                      <TableCell>{it.category}</TableCell>
                      <TableCell>{it.unit}</TableCell>
                      <TableCell className="text-right">{it.price.toLocaleString("ko-KR")}</TableCell>
                      <TableCell className="max-w-[200px] truncate" title={it.memo}>{it.memo}</TableCell>
                      <TableCell>
                        <Button size="icon" variant="ghost" onClick={() => persist(items.filter((x) => x.id !== it.id))}>
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
