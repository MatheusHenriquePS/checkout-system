/** Fila principal de checkout (API publica, Worker consome). */
export const CHECKOUT_QUEUE_NAME = "checkout.orders";

/** Exchange direct para mensagens mortas (DLQ). */
export const CHECKOUT_DLX = "checkout.dlx";

export const CHECKOUT_DLQ_NAME = "checkout.orders.dlq";

/** Routing key usada ao dead-letter. */
export const CHECKOUT_DLQ_ROUTING_KEY = "dead";
