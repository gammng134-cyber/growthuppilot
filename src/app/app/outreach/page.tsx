import { OutreachPage } from "@/components/app/outreach";
import { isDemoMode } from "@/lib/storage";

export const metadata = { title: "Outreach" };
export const dynamic = "force-dynamic";

export default function Page() {
  return <OutreachPage isDemo={isDemoMode()} />;
}
