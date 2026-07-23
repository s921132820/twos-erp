import { z } from "zod";

const required = (label: string, max: number) =>
  z.string().trim().min(1, `${label}을(를) 입력해 주세요.`).max(max, `${label}은(는) ${max}자 이하여야 합니다.`);
const optional = (label: string, max: number) =>
  z.string().trim().max(max, `${label}은(는) ${max}자 이하여야 합니다.`).optional();

const optionalStartDate = z.preprocess(
  (value) => {
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    return trimmed.match(/^(\d{4}-\d{2}-\d{2})/)?.[1] ?? trimmed;
  },
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "수출국 도축일자는 YYYY-MM-DD 형식이어야 합니다.")
    .refine((value) => {
      const date = new Date(`${value}T00:00:00.000Z`);
      return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
    }, "올바른 수출국 도축일자를 입력해 주세요.")
    .transform((value) => new Date(`${value}T00:00:00.000Z`))
    .optional(),
);

export const importLivestockHistorySchema = z.object({
  productId: required("제품", 10),
  historyNumber: required("수입축산물 이력번호", 50),
  importDate: z.coerce.date({ error: "수입일자를 입력해 주세요." }),
  countryOfOrigin: required("원산지", 100),
  supplierName: required("공급처", 150),
  itemName: optional("품목명", 200),
  billOfLadingNumber: optional("B/L번호", 100),
  exporterName: optional("수출업체", 200),
  foreignSlaughterhouse: optional("수출국 도축장", 500),
  foreignProcessingPlant: optional("수출국 가공장", 500),
  partNameCode: optional("부위명(코드)", 200),
  foreignSlaughterDate: optionalStartDate,
  memo: z.string().trim().max(2000, "메모는 2,000자 이하여야 합니다.").optional(),
  isActive: z.boolean(),
});

export type ImportHistoryInput = z.infer<typeof importLivestockHistorySchema>;
export type ImportHistoryFormState = {
  status: "idle" | "success" | "error";
  message: string;
  errors?: Partial<Record<keyof ImportHistoryInput, string[]>>;
};
export const initialImportHistoryFormState: ImportHistoryFormState = { status: "idle", message: "" };
