import { NextResponse } from "next/server";
import type { ZodSchema } from "zod";

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function readJson(request: Request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

type ParseJsonResult<T> =
  | { data: T; response: null }
  | { data: null; response: ReturnType<typeof jsonError> };

export async function parseJson<T>(
  request: Request,
  schema: ZodSchema<T>,
): Promise<ParseJsonResult<T>> {
  const body = await readJson(request);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return {
      data: null,
      response: jsonError(parsed.error.issues[0]?.message ?? "Richiesta non valida."),
    };
  }

  return { data: parsed.data, response: null };
}
