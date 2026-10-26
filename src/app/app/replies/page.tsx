import { RepliesPage } from "@/components/app/replies";
import { isDemoMode } from "@/lib/storage";

export const metadata = { title: "Reply Agent" };
export const dynamic = "force-dynamic";

export default function Page() {
  return <RepliesPage isDemo={isDemoMode()} />;
}
