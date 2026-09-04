import "server-only";

import { prisma } from "@/lib/prisma";
import type { ClientInput } from "@/lib/validations/client";

const nullable = (value: string | undefined) => value?.trim() || null;

export class ClientIdAllocationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ClientIdAllocationError";
  }
}

export async function createClientRecord(input: ClientInput) {
  return prisma.$transaction(async (transaction) => {
    // 시퀀스 행이 없거나 기존 거래처보다 뒤처졌어도 현재 최대 ID로 복구한다.
    // ON DUPLICATE KEY UPDATE와 아래 UPDATE가 같은 행을 잠그므로 동시 등록에도 안전하다.
    await transaction.$executeRawUnsafe(`
      INSERT INTO client_id_sequence (sequence_name, next_value)
      SELECT
        'client',
        COALESCE(MAX(CAST(SUBSTRING(client_id, 3) AS UNSIGNED)), 0)
      FROM client
      WHERE client_id REGEXP '^c_[0-9]+$'
      ON DUPLICATE KEY UPDATE
        next_value = GREATEST(next_value, VALUES(next_value))
    `);

    const updatedRows = await transaction.$executeRawUnsafe(`
      UPDATE client_id_sequence
      SET next_value = LAST_INSERT_ID(next_value + 1)
      WHERE sequence_name = 'client'
    `);
    if (updatedRows !== 1) {
      throw new ClientIdAllocationError("거래처 ID를 정상적으로 계산하지 못했습니다.");
    }
    const rows = await transaction.$queryRawUnsafe<Array<{ nextId: bigint | number }>>(
      "SELECT LAST_INSERT_ID() AS nextId",
    );
    const nextId = Number(rows[0]?.nextId);
    if (!Number.isSafeInteger(nextId)) {
      throw new ClientIdAllocationError("거래처 ID를 정상적으로 계산하지 못했습니다.");
    }
    if (nextId < 1 || nextId > 9999) {
      throw new ClientIdAllocationError("거래처 ID 발급 범위를 초과했습니다.");
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
