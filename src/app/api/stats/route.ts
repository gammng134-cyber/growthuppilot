import { NextResponse } from "next/server";

import { withUser } from "@/lib/api";
import { getStore } from "@/lib/storage";

export async function GET() {
  return withUser(async (user) => {
    const store = await getStore();
    return NextResponse.json(await store.stats(user.id));
  });
}
