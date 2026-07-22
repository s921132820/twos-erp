import { z } from "zod";

const required = (label: string, max: number) =>
  z.string().trim().min(1, `${label}을(를) 입력해 주세요.`).max(max, `${label}은(는) ${max}자 이하여야 합니다.`);

export const importLivestockHistorySchema = z.object({
  productId: required("제품", 10),
  historyNumber: required("수입축산물 이력번호", 50),
  importDate: z.coerce.date({ error: "수입일자를 입력해 주세요." }),
  countryOfOrigin: required("원산지", 100),
  supplierName: required("공급처", 150),
  memo: z.string().trim().max(2000, "비고는 2,000자 이하여야 합니다.").optional(),
  isActive: z.boolean(),
});

export type ImportHistoryInput = z.infer<typeof importLivestockHistorySchema>;
export type ImportHistoryFormState = {
  status: "idle" | "success" | "error";
  message: string;
  errors?: Partial<Record<keyof ImportHistoryInput, string[]>>;
};
export const initialImportHistoryFormState: ImportHistoryFormState = { status: "idle", message: "" };
