import { createClient } from "redis";

export type RedisClient = {
  get(key: string): Promise<string | null>;
  set(
    key: string,
    value: string,
    options?: { NX?: boolean; EX?: number },
  ): Promise<string | null>;
  del(key: string): Promise<number>;
  quit(): Promise<string>;
};

export async function createRedisClient(url: string): Promise<RedisClient> {
  const client = createClient({ url });
  client.on("error", (err: Error) => {
    console.error(JSON.stringify({ service: "api", redis: "error", message: err.message }));
  });
  await client.connect();

  return {
    get: (key) => client.get(key),
    set: async (key, value, options) => {
      if (options?.NX === true && options.EX !== undefined) {
        return client.set(key, value, { NX: true, EX: options.EX });
      }
      if (options?.NX === true) {
        return client.set(key, value, { NX: true });
      }
      if (options?.EX !== undefined) {
        return client.set(key, value, { EX: options.EX });
      }
      return client.set(key, value);
    },
    del: (key) => client.del(key),
    quit: () => client.quit(),
  };
}
