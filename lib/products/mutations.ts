import "server-only";

import { prisma } from "@/lib/prisma";
import type { ProductInput } from "@/lib/validations/product";

export async function createProductRecord(input: ProductInput) {
  return prisma.$transaction(async (transaction) => {
    // 시퀀스 행 잠금으로 동시에 등록해도 서로 다른 제품 ID를 발급한다.
    await transaction.$executeRawUnsafe(`
      UPDATE product_id_sequence
      SET next_value = LAST_INSERT_ID(next_value + 1)
      WHERE sequence_name = 'product'
    `);
    const rows = await transaction.$queryRawUnsafe<Array<{ nextId: bigint | number }>>(
      "SELECT LAST_INSERT_ID() AS nextId",
    );
    const nextId = Number(rows[0]?.nextId);
    if (!Number.isInteger(nextId) || nextId < 1 || nextId > 9_999_999) {
      throw new Error("제품 ID 발급 범위를 초과했습니다.");
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
