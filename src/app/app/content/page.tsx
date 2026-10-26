import { ContentPage } from "@/components/app/content";
import { isDemoMode } from "@/lib/storage";

export const metadata = { title: "Content Agent" };
export const dynamic = "force-dynamic";

export default function Page() {
  return <ContentPage isDemo={isDemoMode()} />;
}
