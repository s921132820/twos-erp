import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { Download, Plus, Trash2, ClipboardPaste } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  emptyOrder,
  parsePastedText,
  type FreightType,
  type ShippingOrder,
} from "@/lib/shipping-types";
import { loadData, saveData } from "@/lib/storage";
import { seedDummyDataOnce } from "@/lib/seed-data";

const STORAGE_KEY = "erp.shipping.orders";

export const Route = createFileRoute("/shipping")({
  head: () => ({
    meta: [
      { title: "택배 발주 관리 — 사내 ERP" },
      { name: "description", content: "택배 발주 입력 및 엑셀 다운로드" },
    ],
  }),
  component: ShippingPage,
});

function ShippingPage() {
  const [orders, setOrders] = useState<ShippingOrder[]>([]);
  const [form, setForm] = useState(emptyOrder());
  const [pasteText, setPasteText] = useState("");

  useEffect(() => {
    seedDummyDataOnce();
    setOrders(loadData<ShippingOrder[]>(STORAGE_KEY, []));
  }, []);

  const persist = (next: ShippingOrder[]) => {
    setOrders(next);
    saveData(STORAGE_KEY, next);
  };

  const updateField = <K extends keyof ReturnType<typeof emptyOrder>>(
    key: K,
    value: ReturnType<typeof emptyOrder>[K],
  ) => setForm((f) => ({ ...f, [key]: value }));

  const handleParse = (text: string) => {
    if (!text.trim()) return;
    const parsed = parsePastedText(text);
    setForm((f) => ({ ...f, ...parsed }));
    const count = Object.keys(parsed).length;
    if (count > 0) toast.success(`${count}개 필드를 자동 입력했습니다.`);
    else toast.warning("인식할 수 있는 항목이 없습니다.");
  };

  const handlePasteArea = (text: string) => {
    setPasteText(text);
    handleParse(text);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.recipientName.trim()) {
      toast.error("수화인명을 입력하세요.");
      return;
    }
    const newOrder: ShippingOrder = {
      ...form,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    persist([newOrder, ...orders]);
    setForm(emptyOrder());
    setPasteText("");
    toast.success("발주가 추가되었습니다.");
  };

  const handleDelete = (id: string) => {
    persist(orders.filter((o) => o.id !== id));
  };

  const handleClearAll = () => {
    if (orders.length === 0) return;
    if (!confirm("모든 발주 내역을 삭제하시겠습니까?")) return;
    persist([]);
  };

  const handleExport = () => {
    if (orders.length === 0) {
      toast.warning("내보낼 발주가 없습니다.");
      return;
    }
    const rows = orders.map((o, i) => ({
      번호: i + 1,
      등록일시: new Date(o.createdAt).toLocaleString("ko-KR"),
      수화인명: o.recipientName,
      우편번호: o.zipCode,
      주소: o.address,
      전화번호: o.phone,
      휴대폰번호: o.mobile,
      택배수량: o.quantity,
      물품명: o.itemName,
      배송메세지: o.message,
      운임타입: o.freightType,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [
      { wch: 6 }, { wch: 20 }, { wch: 10 }, { wch: 10 },
      { wch: 40 }, { wch: 14 }, { wch: 14 }, { wch: 8 },
      { wch: 20 }, { wch: 24 }, { wch: 10 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "택배발주");
    const today = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `택배발주_${today}.xlsx`);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">택배 발주 관리</h1>
          <p className="text-sm text-muted-foreground mt-1">
            발주를 직접 입력하거나, 다른 곳에서 복사한 텍스트를 붙여넣어 자동 입력하세요.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleClearAll} disabled={orders.length === 0}>
            <Trash2 className="h-4 w-4 mr-2" />
            전체 삭제
          </Button>
          <Button onClick={handleExport} disabled={orders.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            엑셀 다운로드 ({orders.length})
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardPaste className="h-4 w-4" />
              빠른 붙여넣기
            </CardTitle>
            <CardDescription>
              엑셀/문서에서 복사한 텍스트를 아래에 붙여넣으면 입력란에 자동 채워집니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              onPaste={(e) => {
                const text = e.clipboardData.getData("text");
                if (text) {
                  e.preventDefault();
                  handlePasteArea(text);
                }
              }}
              placeholder={"예) 홍길동\t06236\t서울시 강남구...\t02-1234-5678\t010-1234-5678\t1\t사무용품\t문앞\t선불\n또는\n수화인명: 홍길동\n우편번호: 06236\n..."}
              className="min-h-[200px] font-mono text-xs"
            />
            <Button
              type="button"
              variant="secondary"
              className="w-full mt-2"
              onClick={() => handleParse(pasteText)}
              disabled={!pasteText.trim()}
            >
              텍스트 파싱하기
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">발주 입력</CardTitle>
            <CardDescription>모든 항목을 확인 후 발주를 추가하세요.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="수화인명" required>
                <Input
                  value={form.recipientName}
                  onChange={(e) => updateField("recipientName", e.target.value)}
                  required
                />
              </Field>
              <Field label="우편번호">
                <Input
                  value={form.zipCode}
                  onChange={(e) => updateField("zipCode", e.target.value)}
                />
              </Field>
              <Field label="주소" className="md:col-span-2">
                <Input
                  value={form.address}
                  onChange={(e) => updateField("address", e.target.value)}
                />
              </Field>
              <Field label="전화번호">
                <Input
                  value={form.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                />
              </Field>
              <Field label="휴대폰번호">
                <Input
                  value={form.mobile}
                  onChange={(e) => updateField("mobile", e.target.value)}
                />
              </Field>
              <Field label="물품명">
                <Input
                  value={form.itemName}
                  onChange={(e) => updateField("itemName", e.target.value)}
                />
              </Field>
              <Field label="택배수량">
                <Input
                  type="number"
                  min={1}
                  value={form.quantity}
                  onChange={(e) => updateField("quantity", parseInt(e.target.value, 10) || 1)}
                />
              </Field>
              <Field label="배송메세지" className="md:col-span-2">
                <Input
                  value={form.message}
                  onChange={(e) => updateField("message", e.target.value)}
                />
              </Field>
              <Field label="택배 운임타입">
                <Select
                  value={form.freightType}
                  onValueChange={(v) => updateField("freightType", v as FreightType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="선불">선불</SelectItem>
                    <SelectItem value="착불">착불</SelectItem>
                    <SelectItem value="신용">신용</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              <div className="md:col-span-2 flex gap-2 justify-end pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setForm(emptyOrder())}
                >
                  초기화
                </Button>
                <Button type="submit">
                  <Plus className="h-4 w-4 mr-2" />
                  발주 추가
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">발주 목록 ({orders.length})</CardTitle>
          <CardDescription>등록된 발주는 엑셀로 다운로드할 수 있습니다.</CardDescription>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-12">
              등록된 발주가 없습니다.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>수화인명</TableHead>
                    <TableHead>우편번호</TableHead>
                    <TableHead>주소</TableHead>
                    <TableHead>전화</TableHead>
                    <TableHead>휴대폰</TableHead>
                    <TableHead className="text-right">수량</TableHead>
                    <TableHead>물품명</TableHead>
                    <TableHead>메세지</TableHead>
                    <TableHead>운임</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell className="font-medium">{o.recipientName}</TableCell>
                      <TableCell>{o.zipCode}</TableCell>
                      <TableCell className="max-w-[280px] truncate" title={o.address}>
                        {o.address}
                      </TableCell>
                      <TableCell>{o.phone}</TableCell>
                      <TableCell>{o.mobile}</TableCell>
                      <TableCell className="text-right">{o.quantity}</TableCell>
                      <TableCell>{o.itemName}</TableCell>
                      <TableCell className="max-w-[180px] truncate" title={o.message}>
                        {o.message}
                      </TableCell>
                      <TableCell>{o.freightType}</TableCell>
                      <TableCell>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(o.id)}
                        >
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

function Field({
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
