import { LocationSchema } from "@/domain/types";
import { getAir } from "@/services/air";
import { AppError, errorResponse } from "@/lib/errors";
export async function GET(request: Request) {
  try {
    const q = new URL(request.url).searchParams;
    const parsed = LocationSchema.safeParse({
      name: "Selected location",
      lat: q.get("lat")?.trim() ? Number(q.get("lat")) : NaN,
      lon: q.get("lon")?.trim() ? Number(q.get("lon")) : NaN,
    });
    if (!parsed.success)
      throw new AppError(
        "LOCATION",
        400,
        "Valid latitude and longitude are required.",
      );
    return Response.json(await getAir(parsed.data));
  } catch (e) {
    return errorResponse(e);
  }
}
