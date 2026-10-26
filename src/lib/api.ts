import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { User } from "@/lib/storage/types";

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function withUser(
  handler: (user: User) => Promise<NextResponse>,
): Promise<NextResponse> {
  const user = await getCurrentUser();
  if (!user) return jsonError("Unauthorized", 401);
  try {
    return await handler(user);
  } catch (err) {
    console.error("[api]", err);
    const message =
      err instanceof Error ? err.message : "Unexpected server error";
    return jsonError(message, 500);
  }
}

export async function readJson<T>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    return {} as T;
  }
}
