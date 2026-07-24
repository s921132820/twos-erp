import "server-only";

import { prisma } from "@/lib/prisma";
import type { ClientInput } from "@/lib/validations/client";

const nullable = (value: string | undefined) => value?.trim() || null;

export async function createClientRecord(input: ClientInput) {
  return prisma.$transaction(async (transaction) => {
    // 단일 시퀀스 행 UPDATE가 행 잠금을 획득하므로 동시 등록에서도 중복되지 않는다.
    await transaction.$executeRawUnsafe(`
      UPDATE client_id_sequence
      SET next_value = LAST_INSERT_ID(next_value + 1)
      WHERE sequence_name = 'client'
    `);
    const rows = await transaction.$queryRawUnsafe<Array<{ nextId: bigint | number }>>(
      "SELECT LAST_INSERT_ID() AS nextId",
    );
    const nextId = Number(rows[0]?.nextId);
    if (!Number.isInteger(nextId) || nextId < 1 || nextId > 9999) {
      throw new Error("거래처 ID 발급 범위를 초과했습니다.");
    }
    const id = `c_${String(nextId).padStart(4, "0")}`;
    return transaction.client.create({
      data: {
        id,
        companyName: input.companyName,
        consigneeName: input.consigneeName,
        postalCode: nullable(input.postalCode),
        address: input.address,
        telephone: nullable(input.telephone),
        mobilePhone: nullable(input.mobilePhone),
        mainProduct: nullable(input.mainProduct),
        deliveryMessage: nullable(input.deliveryMessage),
        memo: nullable(input.memo),
      },
    });
  });
}
