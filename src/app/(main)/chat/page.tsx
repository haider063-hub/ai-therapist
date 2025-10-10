import ChatBot from "@/components/chat-bot";
import { AppHeader } from "@/components/layouts/app-header";

export default async function ChatPage() {
  return (
    <div className="flex flex-col h-full">
      <AppHeader />
      <div className="flex-1 overflow-hidden">
        <ChatBot threadId="" initialMessages={[]} />
      </div>
    </div>
  );
}
