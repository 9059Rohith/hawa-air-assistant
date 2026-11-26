// @vitest-environment node
import { expect, it } from "vitest";
import { MemoryRateLimiter } from "@/services/rate-limit";
import { AppError, errorResponse } from "@/lib/errors";

function outcome(limiter: MemoryRateLimiter, key: string, now: number) {
  try {
    limiter.consume(key, now);
    return { allowed: true, retry: 0 };
  } catch (error) {
    if (!(error instanceof AppError)) throw error;
    return {
      allowed: false,
      retry: Number(errorResponse(error).headers.get("Retry-After")),
    };
  }
}
it("reclaims expired capacity after a renewed bucket changes expiration order", () => {
  const limiter = new MemoryRateLimiter(3, 10000, 2);
  limiter.consume("a", 0);
  limiter.consume("b", 1000);
  limiter.consume("a", 9000);
  expect(outcome(limiter, "c", 10999)).toEqual({ allowed: false, retry: 1 });
  expect(outcome(limiter, "c", 11000).allowed).toBe(true);
  expect(outcome(limiter, "a", 11001).allowed).toBe(true);
});
it("capacity retry reflects the earliest full bucket expiry", () => {
  const limiter = new MemoryRateLimiter(2, 10000, 1);
  limiter.consume("a", 0);
  limiter.consume("a", 2000);
  expect(outcome(limiter, "b", 9000)).toEqual({ allowed: false, retry: 3 });
  expect(outcome(limiter, "a", 9000)).toEqual({ allowed: false, retry: 1 });
  expect(outcome(limiter, "b", 12000).allowed).toBe(true);
});
it("rejected requests cannot extend a bucket's lifetime", () => {
  const limiter = new MemoryRateLimiter(1, 1000, 1);
  limiter.consume("a", 0);
  expect(outcome(limiter, "a", 999).allowed).toBe(false);
  expect(outcome(limiter, "b", 1000).allowed).toBe(true);
});
it("clock rollback cannot reopen exhausted budgets or corrupt expiration order", () => {
  const limiter = new MemoryRateLimiter(1, 1000, 2);
  limiter.consume("a", 1000);
  limiter.consume("b", 0);
  expect(outcome(limiter, "a", -1000).allowed).toBe(false);
  expect(outcome(limiter, "b", 1999).allowed).toBe(false);
  expect(outcome(limiter, "c", 2000).allowed).toBe(true);
});
it.each([NaN, Infinity, -Infinity, 0.1, Number.MAX_VALUE])(
  "rejects unsafe time %s without altering the budget",
  (now) => {
    const limiter = new MemoryRateLimiter(1, 1000, 1);
    limiter.consume("a", 0);
    expect(() => limiter.consume("a", now)).toThrow(RangeError);
    expect(outcome(limiter, "a", 1).allowed).toBe(false);
  },
);
it.each([0, -1, 0.1, Infinity, NaN, Number.MAX_VALUE])(
  "rejects invalid configuration %s",
  (value) => {
    expect(() => new MemoryRateLimiter(value, 1000, 2)).toThrow(RangeError);
    expect(() => new MemoryRateLimiter(2, value, 2)).toThrow(RangeError);
    expect(() => new MemoryRateLimiter(2, 1000, value)).toThrow(RangeError);
  },
);
it("matches a simple independent sliding-window model over ten thousand requests", () => {
  const limiter = new MemoryRateLimiter(3, 5000, 20);
  const accepted = new Map<string, number[]>();
  let tick = 0,
    last = -Infinity,
    seed = 27;
  const random = () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0);
  for (let i = 0; i < 10000; i++) {
    tick += random() % 70;
    const supplied = tick - (random() % 150);
    const now = (last = Math.max(last, supplied));
    const key = String(random() % 35);
    for (const [id, timestamps] of accepted) {
      const live = timestamps.filter((t) => t > now - 5000);
      if (live.length) accepted.set(id, live);
      else accepted.delete(id);
    }
    const times = accepted.get(key) ?? [];
    const allowed =
      times.length < 3 && (accepted.has(key) || accepted.size < 20);
    const releaseAt =
      times.length >= 3
        ? times[0]!
        : Math.min(...[...accepted.values()].map((t) => t.at(-1)!));
    const expected = {
      allowed,
      retry: allowed
        ? 0
        : Math.max(1, Math.ceil((releaseAt + 5000 - now) / 1000)),
    };
    expect(outcome(limiter, key, supplied), `request ${i}`).toEqual(expected);
    if (allowed) accepted.set(key, [...times, now]);
  }
});
