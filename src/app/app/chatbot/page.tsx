import { ChatbotPage } from "@/components/app/chatbot";
import { isDemoMode } from "@/lib/storage";

export const metadata = { title: "Chatbot Agent" };
export const dynamic = "force-dynamic";

export default function Page() {
  return <ChatbotPage isDemo={isDemoMode()} />;
}
