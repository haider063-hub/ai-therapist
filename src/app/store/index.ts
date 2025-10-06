import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ChatMention, ChatModel, ChatThread } from "app-types/chat";
import { AppDefaultToolkit } from "lib/ai/tools";
import { ArchiveWithItemCount } from "app-types/archive";
import { Therapist } from "@/lib/constants/therapists";

export interface AppState {
  threadList: ChatThread[];
  currentThreadId: ChatThread["id"] | null;
  toolChoice: "auto" | "none" | "manual";
  allowedAppDefaultToolkit?: AppDefaultToolkit[];
  generatingTitleThreadIds: string[];
  archiveList: ArchiveWithItemCount[];
  threadMentions: {
    [threadId: string]: ChatMention[];
  };
  toolPresets: {
    allowedAppDefaultToolkit?: AppDefaultToolkit[];
    name: string;
  }[];
  chatModel?: ChatModel;
  openUserSettings: boolean;
  temporaryChat: {
    isOpen: boolean;
    instructions: string;
    chatModel?: ChatModel;
  };
  voiceChat: {
    isOpen: boolean;
    agentId?: string;
    selectedTherapist?: Therapist;
    options: {
      provider: string;
      providerOptions?: Record<string, any>;
    };
  };
  pendingThreadMention?: ChatMention;
}

export interface AppDispatch {
  mutate: (state: Mutate<AppState>) => void;
}

const initialState: AppState = {
  threadList: [],
  archiveList: [],
  generatingTitleThreadIds: [],
  threadMentions: {},
  currentThreadId: null,
  toolChoice: "auto",
  openUserSettings: false,
  allowedAppDefaultToolkit: [
    AppDefaultToolkit.Code,
    AppDefaultToolkit.Visualization,
  ],
  toolPresets: [],
  chatModel: undefined,
  temporaryChat: {
    isOpen: false,
    instructions: "",
  },
  voiceChat: {
    isOpen: false,
    options: {
      provider: "openai",
      providerOptions: {
        model: "alloy",
      },
    },
  },
  pendingThreadMention: undefined,
};

export const appStore = create<AppState & AppDispatch>()(
  persist(
    (set) => ({
      ...initialState,
      mutate: set,
    }),
    {
      name: "mc-app-store-v2.1.0", // Bumped version to clear old cached therapist data
      partialize: (state) => ({
        chatModel: state.chatModel || initialState.chatModel,
        toolChoice: state.toolChoice || initialState.toolChoice,
        allowedAppDefaultToolkit: (
          state.allowedAppDefaultToolkit ??
          initialState.allowedAppDefaultToolkit
        )?.filter((v) => Object.values(AppDefaultToolkit).includes(v)),
        temporaryChat: {
          ...initialState.temporaryChat,
          ...state.temporaryChat,
          isOpen: false,
        },
        toolPresets: state.toolPresets || initialState.toolPresets,
        voiceChat: {
          ...initialState.voiceChat,
          ...state.voiceChat,
          isOpen: false,
          // Don't persist selectedTherapist - it's loaded from database via TherapistLoader
          // This prevents stale data from localStorage when switching users/accounts
        },
      }),
    },
  ),
);
