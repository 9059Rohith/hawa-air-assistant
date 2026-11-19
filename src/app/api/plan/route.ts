import { RequestSchema } from "@/domain/types";
import { readBody } from "@/services/transport";
import { buildPlan } from "@/services/plan";
import { errorResponse } from "@/lib/errors";
export const maxDuration = 40;
export async function POST(request: Request) {
  try {
    return Response.json(
      await buildPlan(await readBody(request, RequestSchema), request.signal),
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return errorResponse(e);
  }
}
