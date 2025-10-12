import ChatBot from "@/components/chat-bot";

export default async function ChatPage() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-hidden">
        <ChatBot threadId="" initialMessages={[]} />
      </div>
    </div>
  );
}
