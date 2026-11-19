/** Conservative reservation before every provider attempt, including retries.
 * UTF-8 bytes upper-bound byte-level input tokens; overhead covers message framing.
 * Process-local only: separate Worker isolates have independent budgets.
 */
export class TokenBudget {
  private reservations: { at: number; tokens: number }[] = [];
  reserve(tokens: number, limit: number, now = Date.now()): boolean {
    this.reservations = this.reservations.filter((r) => r.at > now - 60000);
    if (
      !Number.isSafeInteger(tokens) ||
      tokens < 1 ||
      !Number.isSafeInteger(limit) ||
      limit < 1
    )
      return false;
    if (
      this.reservations.reduce((sum, r) => sum + r.tokens, 0) + tokens >
      limit
    )
      return false;
    this.reservations.push({ at: now, tokens });
    return true;
  }
}

export function estimateReservation(
  messages: { content: string }[],
  outputTokens: number,
) {
  return (
    messages.reduce(
      (sum, message) => sum + new TextEncoder().encode(message.content).length,
      256,
    ) + outputTokens
  );
}
