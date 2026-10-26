import { LeadsPage } from "@/components/app/leads";
import { isDemoMode } from "@/lib/storage";

export const metadata = { title: "Lead Agent" };
export const dynamic = "force-dynamic";

export default function Page() {
  return <LeadsPage isDemo={isDemoMode()} />;
}
