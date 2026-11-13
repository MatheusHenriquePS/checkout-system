import http from "k6/http";
import { check, sleep } from "k6";
import { uuidv4 } from "https://jslib.k6.io/k6-utils/1.4.0/index.js";

/**
 * Ingress load: POST /checkout — expect 202.
 * Postgres validation after the run: docs/guides/load-testing-k6.md
 */

const baseUrl = __ENV.BASE_URL || "http://127.0.0.1:8080";
const productId =
  __ENV.PRODUCT_ID || "ff509508-99e9-48cb-9cc6-1a4cd7d5bab0";

const smoke = __ENV.K6_SMOKE === "1";

export const options = smoke
  ? {
      vus: 3,
      duration: "15s",
      thresholds: {
        http_req_failed: ["rate<0.05"],
        checks: ["rate>0.95"],
      },
    }
  : {
      stages: [
        { duration: "20s", target: 5 },
        { duration: "40s", target: 15 },
        { duration: "20s", target: 0 },
      ],
      thresholds: {
        http_req_failed: ["rate<0.02"],
        http_req_duration: ["p(95)<800"],
        checks: ["rate>0.98"],
      },
    };

export default function () {
  const idempotencyKey = `k6-${uuidv4()}`;
  const payload = JSON.stringify({
    customerEmail: `k6-${uuidv4()}@load.test`,
    items: [{ productId, quantity: 1 }],
  });

  const res = http.post(`${baseUrl}/checkout`, payload, {
    headers: {
      "Content-Type": "application/json",
      "X-Idempotency-Key": idempotencyKey,
    },
    tags: { name: "POST /checkout" },
  });

  check(res, {
    "status is 202": (r) => r.status === 202,
    "body has orderId": (r) => {
      try {
        const body = r.json();
        return typeof body.orderId === "string" && body.status === "PENDING";
      } catch {
        return false;
      }
    },
  });

  sleep(0.05);
}
