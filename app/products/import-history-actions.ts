"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { importLivestockHistorySchema, type ImportHistoryFormState } from "@/lib/validations/import-livestock-history";

function formValue(formData: FormData) {
  return {
    productId: formData.get("productId"),
    historyNumber: formData.get("historyNumber"),
    importDate: formData.get("importDate"),
    countryOfOrigin: formData.get("countryOfOrigin"),
    supplierName: formData.get("supplierName"),
    memo: formData.get("memo") || undefined,
    isActive: formData.get("isActive") === "on",
  };
}

function historyDatabaseError(error: unknown): ImportHistoryFormState {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") return { status: "error", message: "이미 등록된 수입축산물 이력번호입니다.", errors: { historyNumber: ["다른 이력번호를 입력해 주세요."] } };
    if (error.code === "P2003") return { status: "error", message: "연결할 제품을 찾을 수 없습니다." };
    if (error.code === "P2025") return { status: "error", message: "수정할 이력 정보를 찾을 수 없습니다." };
  }
  console.error("Import livestock history operation failed", error);
  return { status: "error", message: "이력 정보를 처리하지 못했습니다. 잠시 후 다시 시도해 주세요." };
}

export async function createImportHistory(_previous: ImportHistoryFormState, formData: FormData): Promise<ImportHistoryFormState> {
  const parsed = importLivestockHistorySchema.safeParse(formValue(formData));
  if (!parsed.success) return { status: "error", message: "입력 내용을 확인해 주세요.", errors: parsed.error.flatten().fieldErrors };
  try {
    await prisma.importLivestockHistory.create({ data: parsed.data });
    revalidatePath("/products");
    return { status: "success", message: "수입축산물 이력을 등록했습니다." };
  } catch (error) {
    return historyDatabaseError(error);
  }
}

export async function updateImportHistory(id: number, _previous: ImportHistoryFormState, formData: FormData): Promise<ImportHistoryFormState> {
  if (!Number.isInteger(id) || id < 1) return { status: "error", message: "수정할 이력 정보가 올바르지 않습니다." };
  const parsed = importLivestockHistorySchema.safeParse(formValue(formData));
  if (!parsed.success) return { status: "error", message: "입력 내용을 확인해 주세요.", errors: parsed.error.flatten().fieldErrors };
  try {
    await prisma.importLivestockHistory.update({ where: { id }, data: parsed.data });
    revalidatePath("/products");
    return { status: "success", message: "수입축산물 이력을 수정했습니다." };
  } catch (error) {
    return historyDatabaseError(error);
  }
}

export async function deleteImportHistory(id: number): Promise<{ success: boolean; message: string }> {
  if (!Number.isInteger(id) || id < 1) return { success: false, message: "삭제할 이력 정보가 올바르지 않습니다." };
  try {
    await prisma.importLivestockHistory.delete({ where: { id } });
    revalidatePath("/products");
    return { success: true, message: "수입축산물 이력을 삭제했습니다." };
  } catch (error) {
    console.error("Import livestock history delete failed", error);
    return { success: false, message: "수입축산물 이력을 삭제하지 못했습니다." };
  }
}
