import { z } from "zod";

const required = (label: string, max: number) => z.string({ error: `${label}을(를) 입력해 주세요.` }).trim().min(1, `${label}을(를) 입력해 주세요.`).max(max, `${label}은(는) ${max}자 이하여야 합니다.`);
const optional = (label: string, max: number) => z.string().trim().max(max, `${label}은(는) ${max}자 이하여야 합니다.`).optional();

export const clientSchema = z.object({
  companyName: required("거래처명", 100),
  consigneeName: required("수화인명", 100),
  postalCode: optional("우편번호", 10),
  address: required("주소", 255),
  telephone: optional("전화번호", 20),
  mobilePhone: optional("핸드폰 번호", 20),
  mainProduct: optional("물품명", 255),
  deliveryMessage: optional("배송 메시지", 500),
  memo: optional("메모", 10000),
});

export type ClientInput = z.infer<typeof clientSchema>;
export type ClientFormState = {
  status: "idle" | "success" | "error";
  message: string;
  clientId?: string;
  errors?: Partial<Record<keyof ClientInput, string[]>>;
};
export const initialClientFormState: ClientFormState = { status: "idle", message: "" };
