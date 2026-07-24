"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { isGoatProduct } from "@/lib/products/is-goat-product";
import { importLivestockHistorySchema, type ImportHistoryFormState } from "@/lib/validations/import-livestock-history";

function formValue(formData: FormData) {
  return {
    productId: formData.get("productId"),
    historyNumber: formData.get("historyNumber"),
    importDate: formData.get("importDate"),
    countryOfOrigin: formData.get("countryOfOrigin"),
    supplierName: formData.get("supplierName"),
    itemName: formData.get("itemName") || undefined,
    billOfLadingNumber: formData.get("billOfLadingNumber") || undefined,
    exporterName: formData.get("exporterName") || undefined,
    foreignSlaughterhouse: formData.get("foreignSlaughterhouse") || undefined,
    foreignProcessingPlant: formData.get("foreignProcessingPlant") || undefined,
    partNameCode: formData.get("partNameCode") || undefined,
    foreignSlaughterDate: formData.get("foreignSlaughterDate") || undefined,
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

async function validatedHistoryData(formData: FormData) {
  const parsed = importLivestockHistorySchema.safeParse(formValue(formData));
  if (!parsed.success) {
    return { state: { status: "error", message: "입력 내용을 확인해 주세요.", errors: parsed.error.flatten().fieldErrors } as ImportHistoryFormState };
  }
  const product = await prisma.product.findUnique({
    where: { id: parsed.data.productId },
    select: { name: true, category: true, unit: true },
  });
  if (!product) return { state: { status: "error", message: "연결할 제품을 찾을 수 없습니다." } as ImportHistoryFormState };
  const goat = isGoatProduct(product);
  const historyNumber = parsed.data.historyNumber?.trim() || null;
  const billOfLadingNumber = parsed.data.billOfLadingNumber?.trim() || null;
  if (goat && !billOfLadingNumber) {
    return { state: { status: "error", message: "염소 수입이력은 B/L번호를 입력해 주세요.", errors: { billOfLadingNumber: ["B/L번호는 필수입니다."] } } as ImportHistoryFormState };
  }
  if (!goat && !historyNumber) {
    return { state: { status: "error", message: "수입축산물 이력번호를 입력해 주세요.", errors: { historyNumber: ["이력번호는 필수입니다."] } } as ImportHistoryFormState };
  }
  if (!goat && !parsed.data.importDate) {
    return { state: { status: "error", message: "수입일자를 입력해 주세요.", errors: { importDate: ["수입일자는 필수입니다."] } } as ImportHistoryFormState };
  }
  if (!goat && !parsed.data.countryOfOrigin?.trim()) {
    return { state: { status: "error", message: "원산지를 입력해 주세요.", errors: { countryOfOrigin: ["원산지는 필수입니다."] } } as ImportHistoryFormState };
  }
  if (!goat && !parsed.data.supplierName?.trim()) {
    return { state: { status: "error", message: "공급처를 입력해 주세요.", errors: { supplierName: ["공급처는 필수입니다."] } } as ImportHistoryFormState };
  }
  return {
    data: {
      ...parsed.data,
      historyNumber,
      billOfLadingNumber,
      importDate: parsed.data.importDate ?? null,
      countryOfOrigin: parsed.data.countryOfOrigin?.trim() || null,
      supplierName: parsed.data.supplierName?.trim() || null,
    },
  };
}

export async function createImportHistory(_previous: ImportHistoryFormState, formData: FormData): Promise<ImportHistoryFormState> {
  const validated = await validatedHistoryData(formData);
  if (!validated.data) return validated.state;
  try {
    await prisma.importLivestockHistory.create({ data: validated.data });
    revalidatePath("/products");
    revalidatePath(`/products/${validated.data.productId}/import-histories`);
    return { status: "success", message: "수입축산물 이력을 등록했습니다." };
  } catch (error) {
    return historyDatabaseError(error);
  }
}

export async function updateImportHistory(id: number, _previous: ImportHistoryFormState, formData: FormData): Promise<ImportHistoryFormState> {
  if (!Number.isInteger(id) || id < 1) return { status: "error", message: "수정할 이력 정보가 올바르지 않습니다." };
  const validated = await validatedHistoryData(formData);
  if (!validated.data) return validated.state;
  try {
    await prisma.importLivestockHistory.update({ where: { id }, data: validated.data });
    revalidatePath("/products");
    revalidatePath(`/products/${validated.data.productId}/import-histories`);
    return { status: "success", message: "수입축산물 이력을 수정했습니다." };
  } catch (error) {
    return historyDatabaseError(error);
  }
}

export async function deleteImportHistory(id: number): Promise<{ success: boolean; message: string }> {
  if (!Number.isInteger(id) || id < 1) return { success: false, message: "삭제할 이력 정보가 올바르지 않습니다." };
  try {
    const deleted = await prisma.importLivestockHistory.delete({ where: { id }, select: { productId: true } });
    revalidatePath("/products");
    revalidatePath(`/products/${deleted.productId}/import-histories`);
    return { success: true, message: "수입축산물 이력을 삭제했습니다." };
  } catch (error) {
    console.error("Import livestock history delete failed", error);
    return { success: false, message: "수입축산물 이력을 삭제하지 못했습니다." };
  }
}
