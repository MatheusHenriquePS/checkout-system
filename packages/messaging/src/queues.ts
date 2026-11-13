/** Main checkout queue (API publishes, Worker consumes). */
export const CHECKOUT_QUEUE_NAME = "checkout.orders";

/** Direct exchange for dead-lettered messages (DLQ). */
export const CHECKOUT_DLX = "checkout.dlx";

export const CHECKOUT_DLQ_NAME = "checkout.orders.dlq";

/** Routing key used when dead-lettering. */
export const CHECKOUT_DLQ_ROUTING_KEY = "dead";
