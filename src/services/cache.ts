/** Bounded process-local cache. Serverless instances do not share entries. */
export class Cache<T> {
  private values = new Map<string, { value: T; at: number }>();
  constructor(private limit = 200) {}
  set(key: string, value: T, now = Date.now()) {
    this.values.delete(key);
    this.values.set(key, { value, at: now });
    if (this.values.size > this.limit) {
      const first = this.values.keys().next().value;
      if (first !== undefined) this.values.delete(first);
    }
  }
  get(key: string, maxAge: number, now = Date.now()) {
    const entry = this.values.get(key);
    if (!entry || now - entry.at > maxAge) return null;
    return entry.value;
  }
}
