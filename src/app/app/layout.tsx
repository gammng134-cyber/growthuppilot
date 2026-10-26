import { redirect } from "next/navigation";

import { AppShell } from "@/components/app/shell";
import { getCurrentUser } from "@/lib/auth";
import { isDemoMode } from "@/lib/storage";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return (
    <AppShell userEmail={user.email} isDemo={isDemoMode()}>
      {children}
    </AppShell>
  );
}
