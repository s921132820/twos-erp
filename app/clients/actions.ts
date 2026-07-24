"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createClientRecord } from "@/lib/clients/mutations";
import { clientSchema, type ClientFormState } from "@/lib/validations/client";

const optional = (value: FormDataEntryValue | null) => String(value ?? "").trim() || null;
const values = (formData: FormData) => ({
  companyName: formData.get("companyName"),
  consigneeName: formData.get("consigneeName"),
  postalCode: formData.get("postalCode") || undefined,
  address: formData.get("address"),
  telephone: formData.get("telephone") || undefined,
  mobilePhone: formData.get("mobilePhone") || undefined,
  mainProduct: formData.get("mainProduct") || undefined,
  deliveryMessage: formData.get("deliveryMessage") || undefined,
  memo: formData.get("memo") || undefined,
});

export async function createClient(_previous: ClientFormState, formData: FormData): Promise<ClientFormState> {
  const parsed = clientSchema.safeParse(values(formData));
  if (!parsed.success) return { status: "error", message: "입력 내용을 확인해 주세요.", errors: parsed.error.flatten().fieldErrors };
  try {
    const client = await createClientRecord(parsed.data);
    revalidatePath("/clients");
    return { status: "success", message: "거래처를 등록했습니다.", clientId: client.id };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { status: "error", message: "거래처 ID가 중복되었습니다. 잠시 후 다시 시도해 주세요." };
    }
    console.error("Client create failed", error);
    return { status: "error", message: "거래처를 등록하지 못했습니다." };
  }
}

export async function updateClient(clientId: string, _previous: ClientFormState, formData: FormData): Promise<ClientFormState> {
  const parsed = clientSchema.safeParse(values(formData));
  if (!parsed.success) return { status: "error", message: "입력 내용을 확인해 주세요.", errors: parsed.error.flatten().fieldErrors };
  try {
    await prisma.client.update({
      where: { id: clientId },
      data: {
        companyName: parsed.data.companyName,
        consigneeName: parsed.data.consigneeName,
        postalCode: optional(formData.get("postalCode")),
        address: parsed.data.address,
        telephone: optional(formData.get("telephone")),
        mobilePhone: optional(formData.get("mobilePhone")),
        mainProduct: optional(formData.get("mainProduct")),
        deliveryMessage: optional(formData.get("deliveryMessage")),
        memo: optional(formData.get("memo")),
      },
    });
    revalidatePath("/clients");
    revalidatePath(`/clients/${clientId}`);
    return { status: "success", message: "거래처 정보를 수정했습니다." };
  } catch (error) {
    console.error("Client update failed", error);
    return { status: "error", message: "거래처 정보를 수정하지 못했습니다." };
  }
}

export async function deleteClient(clientId: string): Promise<{ success: boolean; message: string }> {
  try {
    await prisma.client.delete({ where: { id: clientId } });
    revalidatePath("/clients");
    return { success: true, message: "거래처를 삭제했습니다." };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return { success: false, message: "다른 데이터에서 사용 중인 거래처는 삭제할 수 없습니다." };
    }
    console.error("Client delete failed", error);
    return { success: false, message: "거래처를 삭제하지 못했습니다." };
  }
}
