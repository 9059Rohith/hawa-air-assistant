import { z } from "zod";
import { RequestSchema } from "@/domain/types";
import { urgent, urgentMessage } from "@/domain/safety";
import { knowledge } from "@/data/knowledge";
import { readBody } from "@/services/transport";
import { errorResponse } from "@/lib/errors";
import { language } from "@/services/llm";
const schema = RequestSchema.extend({
  message: z.string().min(1).max(800),
}).strict();
export const maxDuration = 40;
export async function POST(request: Request) {
  try {
    const input = await readBody(request, schema);
    const emergency = urgent(input.message);
    const words = input.message.toLowerCase().split(/\s+/);
    const candidates = [...knowledge]
      .sort((a, b) => score(b) - score(a))
      .slice(0, 4);
    function score(item: (typeof knowledge)[number]) {
      return words.filter(
        (w) =>
          w.length > 2 &&
          `${item.id} ${item.title} ${item.summary} ${item.hi.summary}`
            .toLowerCase()
            .includes(w),
      ).length;
    }
    const writing =
      emergency || input.offline
        ? null
        : await language(candidates, input.profile, input.message);
    const text = emergency
      ? urgentMessage[input.profile.lang]
      : candidates
          .map(
            (a) =>
              `${writing?.actions.find((x) => x.id === a.id)?.why ?? (input.profile.lang === "hi" ? a.hi.summary : a.summary)} [kb:${a.id}]`,
          )
          .join("\n\n");
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ mode: emergency ? "urgent" : writing ? "llm" : "rules" })}\n\n`,
          ),
        );
        for (const part of text.match(/.{1,90}(?:\s|$)|.{1,90}/gs) ?? [])
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ text: part })}\n\n`),
          );
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      },
    });
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-store",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (e) {
    return errorResponse(e);
  }
}
