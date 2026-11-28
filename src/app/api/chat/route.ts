import { z } from "zod";
import { RequestSchema } from "@/domain/types";
import { urgent, urgentMessage } from "@/domain/safety";
import { knowledge } from "@/data/knowledge";
import { retrieveGuidance, localChat } from "@/lib/chat-guidance";
import { aqi } from "@/domain/aqi";
import { scrubUserText } from "@/lib/guard";
import { readBody } from "@/services/transport";
import { errorResponse } from "@/lib/errors";
import { language } from "@/services/llm";
const schema = RequestSchema.omit({ localAir: true })
  .extend({
    message: z.string().min(1).max(800),
    messages: z
      .array(
        z
          .object({
            role: z.enum(["user", "assistant"]),
            content: z.string().max(800),
          })
          .strict(),
      )
      .max(10)
      .optional(),
    actionIds: z.array(z.string().max(80)).max(10).optional(),
  })
  .strict();
export const maxDuration = 40;
export async function POST(request: Request) {
  try {
    const input = await readBody(request, schema);
    const emergency = urgent(input.message);
    const candidates = retrieveGuidance(input.message);
    const context = {
      tier:
        input.manualPm === undefined ? "Unknown" : aqi(input.manualPm).label,
      reading: input.manualPm,
      planActions: (input.actionIds ?? []).filter((id) =>
        knowledge.some((a) => a.id === id),
      ),
      history: input.messages?.map((m) => ({
        ...m,
        content: scrubUserText(m.content),
      })),
      forecast:
        "Do not claim future air is safe. Only the supplied reading is available.",
    };
    const writing =
      emergency || input.offline || !candidates.length
        ? null
        : await language(
            candidates,
            input.profile,
            input.message,
            context,
            request.signal,
          );
    const text = emergency
      ? urgentMessage[input.profile.lang]
      : !candidates.length
        ? localChat(input.message, input.profile).text
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
