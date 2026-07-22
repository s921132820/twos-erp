import { z } from "zod";

const required = (label: string, max: number) =>
  z.string().trim().min(1, `${label}을(를) 입력해 주세요.`).max(max, `${label}은(는) ${max}자 이하여야 합니다.`);

export const productSchema = z.object({
  code: required("품목코드", 50),
  name: required("품목명", 150),
  category: required("카테고리", 80),
  unit: required("판매단위", 30),
  description: z.string().trim().max(2000, "설명은 2,000자 이하여야 합니다.").optional(),
  isActive: z.boolean(),
});

export type ProductInput = z.infer<typeof productSchema>;

export type ProductFormState = {
  status: "idle" | "success" | "error";
  message: string;
  errors?: Partial<Record<keyof ProductInput, string[]>>;
};

export const initialProductFormState: ProductFormState = { status: "idle", message: "" };
