import type { Prisma } from "@prisma/client";

/**
 * Baixa estoque só se houver quantidade suficiente (1 UPDATE atômico).
 * Retorna quantas linhas foram atualizadas (0 = sem estoque).
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
