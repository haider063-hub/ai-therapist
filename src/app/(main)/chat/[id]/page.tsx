import ChatBot from "@/components/chat-bot";
import { getSession } from "auth/server";
import { redirect } from "next/navigation";
import { chatRepository } from "lib/db/repository";
import { UIMessage } from "ai";

interface ChatThreadPageProps {
  params: Promise<{ id: string }>;
}

export default async function ChatThreadPage({ params }: ChatThreadPageProps) {
  const { id } = await params;
  const session = await getSession();

  if (!session) {
    redirect("/sign-in");
  }

  // Fetch the thread details and messages
  const thread = await chatRepository.selectThreadDetails(id);

  // Check if thread exists and belongs to the user
  if (!thread || thread.userId !== session.user.id) {
    redirect("/chat");
  }

  // Convert messages to UIMessage format for ChatBot
  const initialMessages: UIMessage[] = thread.messages.map((msg) => ({
    id: msg.id,
    role: msg.role,
    parts: msg.parts,
    metadata: msg.metadata,
  }));

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-hidden">
        <ChatBot threadId={id} initialMessages={initialMessages} />
      </div>
    </div>
  );
}
