"use server";

import { Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { isGoatProduct } from "@/lib/products/is-goat-product";
import { importLivestockHistorySchema, type ImportHistoryFormState } from "@/lib/validations/import-livestock-history";

function formValue(formData: FormData) {
  const text = (name: string) => String(formData.get(name) ?? "");

  return {
    productId: formData.get("productId"),
    historyNumber: formData.get("historyNumber"),
    importDate: formData.get("importDate"),
    countryOfOrigin: formData.get("countryOfOrigin"),
    supplierName: formData.get("supplierName"),
    itemName: text("itemName"),
    billOfLadingNumber: text("billOfLadingNumber"),
    exporterName: text("exporterName"),
    foreignSlaughterhouse: text("foreignSlaughterhouse"),
    foreignProcessingPlant: text("foreignProcessingPlant"),
    partNameCode: text("partNameCode"),
    foreignSlaughterDate: text("foreignSlaughterDate"),
    memo: text("memo"),
    isActive: formData.get("isActive") === "on",
  };
}

type HistoryOperation = "create" | "update" | "delete";

function historyOperationError(
  error: unknown,
  context: { operation: HistoryOperation; productId?: string; historyId?: number },
): ImportHistoryFormState {
  const errorId = randomUUID().slice(0, 8);
  console.error("Import livestock history operation failed", {
    errorId,
    ...context,
    prismaCode: error instanceof Prisma.PrismaClientKnownRequestError ? error.code : undefined,
    prismaMeta: error instanceof Prisma.PrismaClientKnownRequestError ? error.meta : undefined,
    error,
  });

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") return { status: "error", message: "이미 등록된 수입축산물 이력번호입니다.", errors: { historyNumber: ["다른 이력번호를 입력해 주세요."] } };
    if (error.code === "P2003") return { status: "error", message: "연결할 제품을 찾을 수 없습니다." };
    if (error.code === "P2025") return { status: "error", message: "수정할 이력 정보를 찾을 수 없습니다." };
    if (error.code === "P2000") return { status: "error", message: `입력값이 저장 가능한 길이를 초과했습니다. 각 항목의 길이를 확인해 주세요. (오류번호: ${errorId})` };
    if (error.code === "P2011") return { status: "error", message: `필수 DB 컬럼에 값이 없습니다. 관리자에게 오류번호를 알려 주세요. (${errorId})` };
  }
  if (error instanceof Prisma.PrismaClientValidationError) {
    return { status: "error", message: `서버의 수입이력 데이터 구조가 DB와 일치하지 않습니다. 서버를 다시 시작한 후 재시도해 주세요. (오류번호: ${errorId})` };
  }
  return { status: "error", message: `이력 정보를 처리하지 못했습니다. 관리자에게 오류번호를 알려 주세요. (${errorId})` };
}

function revalidateImportHistoryPaths(productId: string) {
  for (const path of ["/products", `/products/${productId}/import-histories`, "/label-printer"]) {
    try {
      revalidatePath(path);
    } catch (error) {
      // 저장은 이미 완료되었으므로 캐시 갱신 실패를 등록 실패로 응답하지 않는다.
      console.warn("Import livestock history cache revalidation failed", { path, productId, error });
    }
  }
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
      itemName: parsed.data.itemName?.trim() || null,
      exporterName: parsed.data.exporterName?.trim() || null,
      foreignSlaughterhouse: parsed.data.foreignSlaughterhouse?.trim() || null,
      foreignProcessingPlant: parsed.data.foreignProcessingPlant?.trim() || null,
      partNameCode: parsed.data.partNameCode?.trim() || null,
      foreignSlaughterDate: parsed.data.foreignSlaughterDate ?? null,
      memo: parsed.data.memo?.trim() || null,
    },
  };
}

export async function createImportHistory(_previous: ImportHistoryFormState, formData: FormData): Promise<ImportHistoryFormState> {
  let validated: Awaited<ReturnType<typeof validatedHistoryData>>;
  try {
    validated = await validatedHistoryData(formData);
  } catch (error) {
    return historyOperationError(error, { operation: "create", productId: String(formData.get("productId") ?? "") });
  }
  if (!validated.data) return validated.state;
  try {
    await prisma.importLivestockHistory.create({ data: validated.data });
  } catch (error) {
    return historyOperationError(error, { operation: "create", productId: validated.data.productId });
  }
  revalidateImportHistoryPaths(validated.data.productId);
  return {
    status: "success",
    message: validated.data.historyNumber
      ? "수입축산물 이력을 등록했습니다."
      : `염소 수입이력을 B/L번호 ${validated.data.billOfLadingNumber}로 등록했습니다.`,
  };
}

export async function updateImportHistory(id: number, _previous: ImportHistoryFormState, formData: FormData): Promise<ImportHistoryFormState> {
  if (!Number.isInteger(id) || id < 1) return { status: "error", message: "수정할 이력 정보가 올바르지 않습니다." };
  let validated: Awaited<ReturnType<typeof validatedHistoryData>>;
  try {
    validated = await validatedHistoryData(formData);
  } catch (error) {
    return historyOperationError(error, { operation: "update", productId: String(formData.get("productId") ?? ""), historyId: id });
  }
  if (!validated.data) return validated.state;
  try {
    await prisma.importLivestockHistory.update({ where: { id }, data: validated.data });
  } catch (error) {
    return historyOperationError(error, { operation: "update", productId: validated.data.productId, historyId: id });
  }
  revalidateImportHistoryPaths(validated.data.productId);
  return { status: "success", message: "수입축산물 이력을 수정했습니다." };
}

export async function deleteImportHistory(id: number): Promise<{ success: boolean; message: string }> {
  if (!Number.isInteger(id) || id < 1) return { success: false, message: "삭제할 이력 정보가 올바르지 않습니다." };
  try {
    const deleted = await prisma.importLivestockHistory.delete({ where: { id }, select: { productId: true } });
    revalidateImportHistoryPaths(deleted.productId);
    return { success: true, message: "수입축산물 이력을 삭제했습니다." };
  } catch (error) {
    const state = historyOperationError(error, { operation: "delete", historyId: id });
    return { success: false, message: state.message };
  }
}
