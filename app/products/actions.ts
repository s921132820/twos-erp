"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { productSchema, type ProductFormState } from "@/lib/validations/product";

function formValue(formData: FormData) {
  return {
    id: formData.get("id"),
    code: formData.get("code"),
    unit: formData.get("unit"),
    description: formData.get("description"),
    name: formData.get("name"),
    category: formData.get("category"),
  };
}

function databaseError(error: unknown): ProductFormState {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    return { status: "error", message: "제품 ID 또는 품목보고번호가 이미 사용 중입니다." };
  }
  console.error("Product database operation failed", error);
  return { status: "error", message: "처리 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요." };
}

export async function createProduct(_previous: ProductFormState, formData: FormData): Promise<ProductFormState> {
  const parsed = productSchema.safeParse(formValue(formData));
  if (!parsed.success) return { status: "error", message: "입력 내용을 확인해 주세요.", errors: parsed.error.flatten().fieldErrors };
  try {
    await prisma.product.create({ data: parsed.data });
    revalidatePath("/products");
    return { status: "success", message: "제품을 등록했습니다." };
  } catch (error) {
    return databaseError(error);
  }
}

export async function updateProduct(id: string, _previous: ProductFormState, formData: FormData): Promise<ProductFormState> {
  if (!id) return { status: "error", message: "수정할 제품 정보가 올바르지 않습니다." };
  const parsed = productSchema.safeParse(formValue(formData));
  if (!parsed.success) return { status: "error", message: "입력 내용을 확인해 주세요.", errors: parsed.error.flatten().fieldErrors };
  try {
    await prisma.product.update({ where: { id }, data: parsed.data });
    revalidatePath("/products");
    return { status: "success", message: "제품 정보를 수정했습니다." };
  } catch (error) {
    return databaseError(error);
  }
}

export async function deleteProduct(id: string): Promise<{ success: boolean; message: string }> {
  if (!id) return { success: false, message: "삭제할 제품 정보가 올바르지 않습니다." };
  try {
    await prisma.product.delete({ where: { id } });
    revalidatePath("/products");
    return { success: true, message: "제품을 삭제했습니다." };
  } catch (error) {
    console.error("Product delete failed", error);
    return { success: false, message: "제품을 삭제하지 못했습니다." };
  }
}
