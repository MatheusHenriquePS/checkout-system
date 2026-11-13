import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { RedisClient } from "../infra/redis.js";

const IDEMPOTENCY_HEADER = "x-idempotency-key";

type IdempotencyRecord =
  | { state: "processing" }
  | {
      state: "completed";
      statusCode: number;
      body: unknown;
    };

declare module "fastify" {
  interface FastifyContextConfig {
    /** Rotas que exigem X-Idempotency-Key e cacheiam a resposta no Redis. */
    idempotency?: boolean;
  }

  interface FastifyRequest {
    idempotency?: {
      key: string;
      redisKey: string;
      acquired: boolean;
    };
  }
}

function redisKeyForCheckout(idempotencyKey: string): string {
  return `idempotency:checkout:${idempotencyKey}`;
}

function parseRecord(raw: string | null): IdempotencyRecord | null {
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as IdempotencyRecord;
  } catch {
    return null;
  }
}

async function replayIfCompleted(
  record: IdempotencyRecord,
  reply: FastifyReply,
): Promise<boolean> {
  if (record.state !== "completed") {
    return false;
  }
  reply.code(record.statusCode).send(record.body);
  return true;
}

export type IdempotencyPluginOptions = {
  redis: RedisClient;
  ttlSeconds: number;
  lockSeconds: number;
};

export async function registerIdempotencyPlugin(
  app: FastifyInstance,
  options: IdempotencyPluginOptions,
): Promise<void> {
  const { redis, ttlSeconds, lockSeconds } = options;

  app.addHook("preHandler", async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.routeOptions.config?.idempotency) {
      return;
    }

    const rawKey = request.headers[IDEMPOTENCY_HEADER];
    const idempotencyKey = typeof rawKey === "string" ? rawKey.trim() : "";

    if (!idempotencyKey || idempotencyKey.length > 128) {
      reply.code(400).send({
        error: "missing_or_invalid_idempotency_key",
        message: `Header ${IDEMPOTENCY_HEADER} is required (max 128 chars).`,
      });
      return;
    }

    const redisKey = redisKeyForCheckout(idempotencyKey);
    const existingRaw = await redis.get(redisKey);
    const existing = parseRecord(existingRaw);

    if (existing && (await replayIfCompleted(existing, reply))) {
      return;
    }

    if (existing?.state === "processing") {
      reply.code(409).send({
        error: "idempotency_in_progress",
        message: "Same idempotency key is already being processed.",
      });
      return;
    }

    const acquired = await redis.set(redisKey, JSON.stringify({ state: "processing" }), {
      NX: true,
      EX: lockSeconds,
    });

    if (!acquired) {
      const racedRaw = await redis.get(redisKey);
      const raced = parseRecord(racedRaw);
      if (raced && (await replayIfCompleted(raced, reply))) {
        return;
      }
      reply.code(409).send({
        error: "idempotency_in_progress",
        message: "Same idempotency key is already being processed.",
      });
      return;
    }

    request.idempotency = { key: idempotencyKey, redisKey, acquired: true };
  });

  app.addHook("onSend", async (request, reply, payload) => {
    const meta = request.idempotency;
    if (!meta?.acquired) {
      return payload;
    }

    const statusCode = reply.statusCode;
    if (statusCode >= 200 && statusCode < 300) {
      let body: unknown = payload;
      if (typeof payload === "string" && payload.length > 0) {
        try {
          body = JSON.parse(payload) as unknown;
        } catch {
          body = payload;
        }
      }

      const record: IdempotencyRecord = {
        state: "completed",
        statusCode,
        body,
      };
      await redis.set(meta.redisKey, JSON.stringify(record), { EX: ttlSeconds });
    } else {
      await redis.del(meta.redisKey);
    }

    return payload;
  });

  app.addHook("onError", async (request) => {
    const meta = request.idempotency;
    if (meta?.acquired) {
      await redis.del(meta.redisKey);
    }
  });
}
