import { NextResponse } from "next/server";

import { withUser } from "@/lib/api";
import { getStore } from "@/lib/storage";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return withUser(async (user) => {
    const { id } = await params;
    const store = await getStore();
    return NextResponse.json(await store.listDraftEvents(user.id, id));
  });
}
