"use client";

import { Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type ShippingClientData = {
  consigneeName: string | null | undefined;
  postalCode: string | null | undefined;
  address: string | null | undefined;
  telephone: string | null | undefined;
  mobilePhone: string | null | undefined;
};

const cell = (value: string | null | undefined) =>
  (value ?? "").trim().replace(/\r?\n/g, " ");

export function createShippingClipboardText(client: ShippingClientData) {
  return [
    client.consigneeName,
    client.postalCode,
    client.address,
    client.telephone,
    client.mobilePhone,
  ].map(cell).join("\t");
}

function legacyCopy(text: string) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();
  if (!copied) throw new Error("클립보드 복사를 지원하지 않는 브라우저입니다.");
}

export function CopyClientButton({ client }: { client: ShippingClientData }) {
  const copy = async () => {
    const text = createShippingClipboardText(client);
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text);
      else legacyCopy(text);
      toast.success("택배송장 정보가 복사되었습니다.");
    } catch (error) {
      console.error("Client clipboard copy failed", error);
      try {
        legacyCopy(text);
        toast.success("택배송장 정보가 복사되었습니다.");
      } catch {
        toast.error("복사에 실패했습니다.");
      }
    }
  };

  return <Button type="button" size="sm" variant="ghost" onClick={copy}><Copy size={14} />복사</Button>;
}
