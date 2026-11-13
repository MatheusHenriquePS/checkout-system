import type { Prisma } from "@prisma/client";

/**
 * Decrements stock only when enough quantity is available (single atomic UPDATE).
 * Returns affected row count (0 = insufficient stock).
 */
export async function decrementStockIfAvailable(
  tx: Prisma.TransactionClient,
  productId: string,
  quantity: number,
): Promise<number> {
  const result = await tx.product.updateMany({
    where: {
      id: productId,
      stockQuantity: { gte: quantity },
    },
    data: {
      stockQuantity: { decrement: quantity },
    },
  });
  return result.count;
}
