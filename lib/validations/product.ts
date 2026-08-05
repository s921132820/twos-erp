import { z } from "zod";

const required = (label: string, max: number) =>
  z.string().trim().min(1, `${label}을(를) 입력해 주세요.`).max(max, `${label}은(는) ${max}자 이하여야 합니다.`);

const optional = (label: string, max: number) =>
  z.string().trim().max(max, `${label}은(는) ${max}자 이하여야 합니다.`).optional();

export const productSchema = z.object({
  code: required("품목보고번호", 20),
  unit: required("제품유형", 50),
  kind: required("종류", 50),
  description: required("소비기한", 100),
  name: required("제품명", 100),
  category: required("카테고리", 50),
  material: optional("원료 및 함량", 5000),
});

export type ProductInput = z.infer<typeof productSchema>;

export type ProductFormState = {
  status: "idle" | "success" | "error";
  message: string;
  errors?: Partial<Record<keyof ProductInput, string[]>>;
};

export const initialProductFormState: ProductFormState = { status: "idle", message: "" };
