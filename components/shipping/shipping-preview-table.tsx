"use client";

import { AlertTriangle, CircleCheck, Pencil, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MARKETPLACE_LABELS } from "@/lib/shipping/marketplace-detector";
import type { ConvertedShippingRow } from "@/lib/shipping/types";

type Props = { orders: ConvertedShippingRow[]; excludedRowKeys: Set<string>; onEdit: (row: ConvertedShippingRow) => void; onToggleExclude: (rowKey: string) => void; onDeleteManual: (row: ConvertedShippingRow) => void };

export function ShippingPreviewTable({ orders, excludedRowKeys, onEdit, onToggleExclude, onDeleteManual }: Props) {
  if (!orders.length) return <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">주문 엑셀을 업로드하거나 수동 주문을 추가하면 변환 결과가 여기에 표시됩니다.</div>;
  const headers = ["번호", "판매처", "원본 행", "받는 분", "우편번호", "주소", "전화번호", "휴대전화", "수량", "물품명", "배송메시지", "운임", "상태", "작업"];
  return <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><div className="overflow-x-auto"><table className="w-full min-w-[1500px] text-left text-sm"><thead className="bg-slate-50 text-xs font-semibold text-slate-600"><tr>{headers.map((header) => <th key={header} className="whitespace-nowrap border-b border-slate-200 px-3 py-3">{header}</th>)}</tr></thead><tbody>{orders.map((order, index) => {
    const excluded = excludedRowKeys.has(order.rowKey); const review = !order.validation.isValid;
    return <tr key={order.rowKey} className={`border-b border-slate-100 last:border-0 ${excluded ? "bg-slate-50 opacity-55" : ""}`}>
      <td className="px-3 py-3 text-slate-500">{index + 1}</td><td className="whitespace-nowrap px-3 py-3"><span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">{MARKETPLACE_LABELS[order.source]}</span></td><td className="px-3 py-3" title={order.sourceFileName}>{order.source === "manual" ? "-" : order.sourceRowNumber}</td>
      <td className="px-3 py-3">{order.receiverName}</td><td className="px-3 py-3">{order.postalCode}</td><td className="max-w-72 px-3 py-3">{order.address}</td><td className="px-3 py-3">{order.phone}</td><td className="px-3 py-3">{order.mobilePhone}</td><td className="px-3 py-3">{order.packageQuantity}</td><td className="max-w-72 px-3 py-3">{order.productName}</td><td className="max-w-64 px-3 py-3">{order.deliveryMessage}</td><td className="px-3 py-3">{order.shippingFareType}</td>
      <td className="px-3 py-3">{excluded ? <Badge className="bg-slate-200 text-slate-700">제외됨</Badge> : <Badge className={review ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}>{review ? <AlertTriangle size={13} /> : <CircleCheck size={13} />}{review ? `확인 필요: ${order.validation.missingFields.join(", ")}` : "정상"}</Badge>}</td>
      <td className="px-3 py-3"><div className="flex gap-1"><Button size="sm" variant="ghost" type="button" onClick={() => onEdit(order)}><Pencil size={14} />수정</Button>{order.source === "manual" ? <Button size="sm" variant="ghost" type="button" className="text-red-600" onClick={() => onDeleteManual(order)}><Trash2 size={14} />삭제</Button> : <Button size="sm" variant="ghost" type="button" onClick={() => onToggleExclude(order.rowKey)}>{excluded && <RotateCcw size={14} />}{excluded ? "다시 포함" : "제외"}</Button>}</div></td>
    </tr>;
  })}</tbody></table></div></div>;
}

function Badge({ className, children }: { className: string; children: React.ReactNode }) { return <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-1 text-xs font-semibold ${className}`}>{children}</span>; }
