import { MessagingPage } from "@/components/app/messaging";
import { isDemoMode } from "@/lib/storage";

export const metadata = { title: "Messaging Agent" };
export const dynamic = "force-dynamic";

export default function Page() {
  return <MessagingPage isDemo={isDemoMode()} />;
}
