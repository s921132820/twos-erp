import "server-only";

import { prisma } from "@/lib/prisma";
import type { ProductInput } from "@/lib/validations/product";

export class ProductIdAllocationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProductIdAllocationError";
  }
}

export async function createProductRecord(input: ProductInput) {
  return prisma.$transaction(async (transaction) => {
    // 기존 제품 ID를 기준으로 누락되거나 뒤처진 시퀀스를 먼저 복구한다.
    // ON DUPLICATE KEY UPDATE도 대상 행을 잠그므로 동시 등록 시 안전하다.
    await transaction.$executeRawUnsafe(`
      INSERT INTO product_id_sequence (sequence_name, next_value)
      SELECT
        'product',
        COALESCE(MAX(CAST(SUBSTRING(p_id, 3) AS UNSIGNED)), 0)
      FROM products
      WHERE p_id REGEXP '^p_[0-9]+$'
      ON DUPLICATE KEY UPDATE
        next_value = GREATEST(next_value, VALUES(next_value))
    `);

    const updatedRows = await transaction.$executeRawUnsafe(`
      UPDATE product_id_sequence
      SET next_value = LAST_INSERT_ID(next_value + 1)
      WHERE sequence_name = 'product'
    `);
    if (updatedRows !== 1) {
      throw new ProductIdAllocationError("제품 ID를 정상적으로 계산하지 못했습니다.");
    }

    const rows = await transaction.$queryRawUnsafe<Array<{ nextId: bigint | number }>>(
      "SELECT LAST_INSERT_ID() AS nextId",
    );
    const rawNextId = rows[0]?.nextId;
    const nextId = Number(rawNextId);

    if (!Number.isSafeInteger(nextId)) {
      throw new ProductIdAllocationError("제품 ID를 정상적으로 계산하지 못했습니다.");
    }
    if (nextId < 1 || nextId > 9_999_999) {
      throw new ProductIdAllocationError("제품 ID 발급 범위를 초과했습니다.");
    }

    return transaction.product.create({
      data: {
        id: `p_${String(nextId).padStart(4, "0")}`,
        code: input.code,
        unit: input.unit,
        kind: input.kind,
        description: input.description,
        name: input.name,
        category: input.category,
        material: input.material ?? null,
      },
    });
  });
}
