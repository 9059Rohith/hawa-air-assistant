import { AppError } from "@/lib/errors";
export interface RateLimiter {
  consume(key: string, now?: number): void;
}
/** Replaceable process-local sliding window; production-wide enforcement needs shared storage. */
export class MemoryRateLimiter implements RateLimiter {
  private entries = new Map<string, number[]>();
  private clock = -Infinity;
  constructor(
    private limit = 12,
    private windowMs = 60000,
    private capacity = 5000,
  ) {
    if (
      ![limit, windowMs, capacity].every(
        (n) => Number.isSafeInteger(n) && n > 0,
      )
    )
      throw new RangeError(
        "Rate-limit settings must be positive safe integers.",
      );
  }
  consume(key: string, now = Date.now()) {
    if (!Number.isSafeInteger(now))
      throw new RangeError("Invalid rate-limit time.");
    // Never reopen a budget when the wall clock moves backwards.
    now = this.clock = Math.max(now, this.clock);
    const cutoff = now - this.windowMs;
    // Accepted writes renew insertion order. Stop at the first live bucket;
    // each expired bucket is visited once instead of scanning all clients.
    for (const [k, times] of this.entries) {
      if (times[times.length - 1]! > cutoff) break;
      this.entries.delete(k);
    }
    const times = (this.entries.get(key) ?? []).filter((t) => t > cutoff);
    if (
      times.length >= this.limit ||
      (!this.entries.has(key) && this.entries.size >= this.capacity)
    ) {
      // Capacity is positive, so rejection always has a nonempty bucket.
      const oldest = this.entries.values().next().value!;
      const releaseAt = times.length >= this.limit ? times[0]! : oldest.at(-1)!;
      throw new AppError(
        "RATE_LIMIT",
        429,
        "Please wait before trying again.",
        Math.max(1, Math.ceil((releaseAt + this.windowMs - now) / 1000)),
      );
    }
    times.push(now);
    this.entries.delete(key);
    this.entries.set(key, times);
  }
}
