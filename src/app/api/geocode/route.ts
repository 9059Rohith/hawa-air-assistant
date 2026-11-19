import { geocode } from "@/services/air";
import { AppError, errorResponse } from "@/lib/errors";
export async function GET(request: Request) {
  try {
    const q = new URL(request.url).searchParams.get("q")?.trim();
    if (!q || q.length < 2 || q.length > 80)
      throw new AppError("QUERY", 400, "Enter between 2 and 80 characters.");
    return Response.json(await geocode(q));
  } catch (e) {
    return errorResponse(e);
  }
}
