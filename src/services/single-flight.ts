import { AppError } from "@/lib/errors";

/** Coalesce identical work and bound distinct upstream requests per isolate. */
export class SingleFlight<T> {
  private pending = new Map<string, Promise<T>>();
  constructor(private capacity = 32) {}
  run(key: string, work: () => Promise<T>): Promise<T> {
    const existing = this.pending.get(key);
    if (existing) return existing;
    if (this.pending.size >= this.capacity)
      return Promise.reject(
        new AppError("UPSTREAM_BUSY", 503, "Please retry shortly.", 1),
      );
    const promise = Promise.resolve()
      .then(work)
      .finally(() => this.pending.delete(key));
    this.pending.set(key, promise);
    return promise;
  }
}
