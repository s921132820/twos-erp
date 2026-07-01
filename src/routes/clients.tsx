import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { loadData, saveData } from "@/lib/storage";
import { seedDummyDataOnce } from "@/lib/seed-data";

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

export const Route = createFileRoute("/clients")({
  head: () => ({
    meta: [
      { title: "거래처 관리 — 사내 ERP" },
      { name: "description", content: "거래처 목록 및 관리" },
    ],
  }),
  component: ClientsPage,
});

function ClientsPage() {
  const [items, setItems] = useState<Client[]>([]);

  useEffect(() => {
    seedDummyDataOnce();
    setItems(loadData<Client[]>(STORAGE_KEY, []));
  }, []);

  const persist = (next: Client[]) => {
    setItems(next);
    saveData(STORAGE_KEY, next);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">거래처 관리</h1>
          <p className="text-sm text-muted-foreground mt-1">등록된 거래처를 확인하고 관리합니다.</p>
        </div>
        <Button asChild>
          <Link to="/clients/new"><Plus className="h-4 w-4 mr-2" />거래처 등록</Link>
        </Button>
      </div>

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
