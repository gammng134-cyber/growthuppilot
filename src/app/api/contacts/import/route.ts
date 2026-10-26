import { NextResponse } from "next/server";

import { readJson, withUser } from "@/lib/api";
import { contactsFromCsv } from "@/lib/csv";
import { getStore } from "@/lib/storage";

export async function POST(req: Request) {
  return withUser(async (user) => {
    const { csv } = await readJson<{ csv?: string }>(req);
    if (!csv || !csv.trim()) {
      return NextResponse.json({ error: "Paste CSV text first" }, { status: 400 });
    }
    const { contacts, skipped } = contactsFromCsv(csv);
    const store = await getStore();
    let added = 0;
    for (const c of contacts) {
      await store.createContact({ userId: user.id, ...c });
      added++;
    }
    return NextResponse.json({ added, skipped });
  });
}
