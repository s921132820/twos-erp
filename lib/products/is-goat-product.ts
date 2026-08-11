export type GoatProductFields = { name: string; category: string; unit: string };

export function isGoatProduct(product: GoatProductFields) {
  return [product.name, product.category, product.unit]
    .some((value) => value.toLocaleLowerCase().includes("염소"));
}

/** 공공 이력 API가 제공되는 축종(소·돼지)인지 판별합니다. */
export function supportsAnimalTraceLookup(product: GoatProductFields) {
  const value = [product.name, product.category, product.unit].join(" ").toLocaleLowerCase();
  if (["염소", "양고기", "면양", "lamb", "mutton", "goat"].some((keyword) => value.includes(keyword))) return false;
  return ["돼지", "돈육", "pork", "소고기", "쇠고기", "우육", "beef"].some((keyword) => value.includes(keyword));
}
