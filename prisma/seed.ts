import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const products = [
  { code: "SOUP-001", name: "염소탕", category: "탕류", unit: "팩", description: "진하게 우려낸 염소탕" },
  { code: "SOUP-002", name: "갈비탕", category: "탕류", unit: "팩", description: "담백한 소갈비탕" },
  { code: "SOUP-003", name: "도가니탕", category: "탕류", unit: "팩", description: "쫀득한 도가니가 들어간 탕" },
  { code: "HANG-001", name: "우거지 소뼈해장국", category: "해장국", unit: "봉", description: "우거지와 소뼈를 푹 끓인 해장국" },
  { code: "MEAT-001", name: "LA갈비", category: "양념육", unit: "kg", description: "양념한 LA식 소갈비" },
] as const;

async function main() {
  for (const product of products) {
    await prisma.product.upsert({
      where: { code: product.code },
      update: product,
      create: product,
    });
  }
}

main()
  .then(() => console.log("샘플 제품 데이터가 준비되었습니다."))
  .catch((error: unknown) => {
    console.error("샘플 데이터 생성에 실패했습니다.", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
