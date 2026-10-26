import { SeoPage } from "@/components/app/seo";
import { isDemoMode } from "@/lib/storage";

export const metadata = { title: "SEO Agent" };
export const dynamic = "force-dynamic";

export default function Page() {
  return <SeoPage isDemo={isDemoMode()} />;
}
