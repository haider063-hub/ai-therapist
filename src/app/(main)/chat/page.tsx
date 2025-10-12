import ChatBot from "@/components/chat-bot";
import { generateUUID } from "lib/utils";

export default async function ChatPage() {
  // Generate a new thread ID for new chat sessions
  const newThreadId = generateUUID();

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-hidden">
        <ChatBot threadId={newThreadId} initialMessages={[]} />
      </div>
    </div>
  );
}
