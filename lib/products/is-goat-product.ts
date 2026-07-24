export type GoatProductFields = { name: string; category: string; unit: string };

export function isGoatProduct(product: GoatProductFields) {
  return [product.name, product.category, product.unit]
    .some((value) => value.toLocaleLowerCase().includes("염소"));
}
