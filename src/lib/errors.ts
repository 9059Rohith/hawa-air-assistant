export class AppError extends Error {
  constructor(
    public code: string,
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function errorResponse(error: unknown) {
  const known = error instanceof AppError;
  return Response.json(
    {
      error: {
        code: known ? error.code : "UNAVAILABLE",
        message: known
          ? error.message
          : "This service is unavailable. Please retry or enter PM2.5 manually.",
      },
    },
    {
      status: known ? error.status : 502,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
