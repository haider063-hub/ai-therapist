import type { LanguageModelUsage, UIMessage } from "ai";
import { z } from "zod";
import { tag } from "lib/tag";

export type ChatMetadata = {
  usage?: LanguageModelUsage;
  chatModel?: ChatModel;
  toolChoice?: "auto" | "none" | "manual";
  toolCount?: number;
};

export type ChatModel = {
  provider: string;
  model: string;
};

export type ChatThread = {
  id: string;
  title: string;
  userId: string;
  model?: string;
  archived?: boolean;
  createdAt: Date;
};

export type ChatMessage = {
  id: string;
  threadId: string;
  role: UIMessage["role"];
  parts: UIMessage["parts"];
  metadata?: ChatMetadata;
  createdAt: Date;
};

export const ChatMentionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("defaultTool"),
    name: z.string(),
    label: z.string(),
    description: z.string().optional(),
  }),
]);

export type ChatMention = z.infer<typeof ChatMentionSchema>;

export const chatApiSchemaRequestBodySchema = z.object({
  id: z.string(),
  message: z.any() as z.ZodType<UIMessage>,
  chatModel: z
    .object({
      provider: z.string(),
      model: z.string(),
    })
    .optional(),
  toolChoice: z.enum(["auto", "none", "manual"]),
  mentions: z.array(ChatMentionSchema).optional(),
  allowedAppDefaultToolkit: z.array(z.string()).optional(),
});

export type ChatApiSchemaRequestBody = z.infer<
  typeof chatApiSchemaRequestBodySchema
>;

export type ChatRepository = {
  insertThread(thread: Omit<ChatThread, "createdAt">): Promise<ChatThread>;

  selectThread(id: string): Promise<ChatThread | null>;

  deleteChatMessage(id: string): Promise<void>;

  selectThreadDetails(id: string): Promise<
    | (ChatThread & {
        messages: ChatMessage[];
      })
    | null
  >;

  selectMessagesByThreadId(threadId: string): Promise<ChatMessage[]>;

  selectThreadsByUserId(userId: string): Promise<
    (ChatThread & {
      lastMessageAt: number;
    })[]
  >;

  updateThread(
    id: string,
    thread: Partial<Omit<ChatThread, "id" | "createdAt">>,
  ): Promise<ChatThread>;

  deleteThread(id: string): Promise<void>;

  upsertThread(
    thread: PartialBy<Omit<ChatThread, "createdAt">, "userId">,
  ): Promise<ChatThread>;

  insertMessage(message: Omit<ChatMessage, "createdAt">): Promise<ChatMessage>;
  upsertMessage(message: Omit<ChatMessage, "createdAt">): Promise<ChatMessage>;

  deleteMessagesByChatIdAfterTimestamp(messageId: string): Promise<void>;

  deleteAllThreads(userId: string): Promise<void>;

  deleteUnarchivedThreads(userId: string): Promise<void>;

  insertMessages(
    messages: PartialBy<ChatMessage, "createdAt">[],
  ): Promise<ChatMessage[]>;
};

export const ManualToolConfirmTag = tag<{
  confirm: boolean;
}>("manual-tool-confirm");
