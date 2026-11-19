import { AppError } from "@/lib/errors";
export interface RateLimiter {
  consume(key: string, now?: number): void;
}
/** Replaceable process-local sliding window; production-wide enforcement needs shared storage. */
export class MemoryRateLimiter implements RateLimiter {
  private entries = new Map<string, number[]>();
  constructor(
    private limit = 12,
    private windowMs = 60000,
    private capacity = 5000,
  ) {}
  consume(key: string, now = Date.now()) {
    for (const [k, times] of this.entries)
      if ((times.at(-1) ?? 0) <= now - this.windowMs) this.entries.delete(k);
    const times = (this.entries.get(key) ?? []).filter(
      (t) => t > now - this.windowMs,
    );
    if (
      times.length >= this.limit ||
      (!this.entries.has(key) && this.entries.size >= this.capacity)
    )
      throw new AppError(
        "RATE_LIMIT",
        429,
        "Please wait before trying again.",
        Math.max(
          1,
          Math.ceil(((times[0] ?? now) + this.windowMs - now) / 1000),
        ),
      );
    times.push(now);
    this.entries.set(key, times);
  }
}
