"use client";

import {
  Mic,
  CornerRightUp,
  PlusIcon,
  Square,
  XIcon,
  ImageIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "ui/button";
import { UIMessage, UseChatHelpers } from "@ai-sdk/react";
import { appStore } from "@/app/store";
import { useShallow } from "zustand/shallow";
import { ChatMention, ChatModel } from "app-types/chat";
import { Tooltip, TooltipContent, TooltipTrigger } from "ui/tooltip";
import { useTranslations } from "next-intl";
import equal from "lib/equal";
import { DefaultToolName } from "lib/ai/tools";
import { DefaultToolIcon } from "./default-tool-icon";
import { toast } from "sonner";

interface PromptInputProps {
  placeholder?: string;
  setInput: (value: string) => void;
  input: string;
  onStop: () => void;
  sendMessage: UseChatHelpers<UIMessage>["sendMessage"];
  toolDisabled?: boolean;
  isLoading?: boolean;
  model?: ChatModel;
  setModel?: (model: ChatModel) => void;
  voiceDisabled?: boolean;
  threadId?: string;
  disabledMention?: boolean;
  onFocus?: () => void;
}

import SimpleChatInput, { SimpleChatInputRef } from "./simple-chat-input";

export default function PromptInput({
  placeholder,
  sendMessage,
  input,
  onFocus,
  setInput,
  onStop,
  isLoading,
  threadId,
}: PromptInputProps) {
  const t = useTranslations("Chat");

  const [threadMentions, appStoreMutate] = appStore(
    useShallow((state) => [state.threadMentions, state.mutate]),
  );

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const mentions = useMemo<ChatMention[]>(() => {
    if (!threadId) return [];
    return threadMentions[threadId!] ?? [];
  }, [threadMentions, threadId]);

  const editorRef = useRef<SimpleChatInputRef | null>(null);

  const deleteMention = useCallback(
    (mention: ChatMention) => {
      if (!threadId) return;
      appStoreMutate((prev) => {
        const newMentions = mentions.filter((m) => !equal(m, mention));
        return {
          threadMentions: {
            ...prev.threadMentions,
            [threadId!]: newMentions,
          },
        };
      });
    },
    [mentions, threadId],
  );

  const submit = () => {
    if (isLoading) return;
    const userMessage = input?.trim() || "";
    if (userMessage.length === 0 && !selectedImage) return;

    const parts: any[] = [];

    // Add image if selected
    if (selectedImage) {
      parts.push({
        type: "image",
        image: selectedImage,
      });
    }

    // Add text if present
    if (userMessage.length > 0) {
      parts.push({
        type: "text",
        text: userMessage,
      });
    }

    setInput("");
    setSelectedImage(null);
    setImagePreview(null);

    sendMessage({
      role: "user",
      parts,
    });
  };

  // Handle ESC key to clear mentions
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mentions.length > 0 && threadId) {
        e.preventDefault();
        e.stopPropagation();
        appStoreMutate((prev) => ({
          threadMentions: {
            ...prev.threadMentions,
            [threadId]: [],
          },
          agentId: undefined,
        }));
        editorRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mentions.length, threadId, appStoreMutate]);

  useEffect(() => {
    if (!editorRef.current) return;
  }, [editorRef.current]);

  return (
    <div className="max-w-3xl mx-auto fade-in animate-in">
      <div className="z-10 mx-auto w-full max-w-3xl relative">
        <fieldset className="flex w-full min-w-0 max-w-full flex-col px-4">
          {/* Image Preview */}
          {imagePreview && (
            <div className="mb-2 px-4">
              <div className="relative inline-block">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="max-h-32 rounded-lg border border-border"
                />
                <Button
                  variant={"ghost"}
                  size={"icon"}
                  className="absolute -top-2 -right-2 rounded-full h-6 w-6 p-0 bg-destructive hover:bg-destructive/80 text-destructive-foreground"
                  onClick={() => {
                    setSelectedImage(null);
                    setImagePreview(null);
                    toast.info("Image removed");
                  }}
                >
                  <XIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          <div className="shadow-lg overflow-hidden rounded-4xl backdrop-blur-sm transition-all duration-200 bg-muted/60 relative flex w-full flex-col cursor-text z-10 items-stretch focus-within:bg-muted hover:bg-muted focus-within:ring-muted hover:ring-muted">
            {mentions.length > 0 && (
              <div className="bg-input rounded-b-sm rounded-t-3xl p-3 flex flex-col gap-4 mx-2 my-2">
                {mentions.map((mention, i) => {
                  return (
                    <div key={i} className="flex items-center gap-2">
                      <Button className="size-6 flex items-center justify-center ring ring-border rounded-full flex-shrink-0 p-0.5">
                        <DefaultToolIcon
                          name={mention.name as DefaultToolName}
                          className="size-3.5"
                        />
                      </Button>

                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="text-sm font-semibold truncate">
                          {mention.name}
                        </span>
                        {mention.description ? (
                          <span className="text-muted-foreground text-xs truncate">
                            {mention.description}
                          </span>
                        ) : null}
                      </div>
                      <Button
                        variant={"ghost"}
                        size={"icon"}
                        disabled={!threadId}
                        className="rounded-full hover:bg-input! flex-shrink-0"
                        onClick={() => {
                          deleteMention(mention);
                        }}
                      >
                        <XIcon />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="flex flex-col gap-3.5 px-5 pt-2 pb-4">
              <div className="relative min-h-[2rem]">
                <SimpleChatInput
                  input={input}
                  onChange={setInput}
                  onEnter={submit}
                  placeholder={placeholder ?? t("placeholder")}
                  ref={editorRef}
                  onFocus={onFocus}
                  disabled={isLoading}
                />
              </div>
              <div className="flex w-full items-center z-30">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  id={`image-upload-${threadId}`}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      // Check file size (max 5MB)
                      if (file.size > 5 * 1024 * 1024) {
                        toast.error("Image size must be less than 5MB");
                        return;
                      }

                      // Convert to base64
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        const base64 = reader.result as string;
                        setSelectedImage(base64);
                        setImagePreview(base64);
                        toast.success(
                          "Image attached! You can now send your message.",
                        );
                      };
                      reader.onerror = () => {
                        toast.error("Failed to load image");
                      };
                      reader.readAsDataURL(file);
                    }
                    // Reset input
                    e.target.value = "";
                  }}
                />

                {selectedImage ? (
                  <div className="relative group">
                    <Button
                      variant={"ghost"}
                      size={"sm"}
                      className="rounded-full hover:bg-input! p-2! relative"
                    >
                      <ImageIcon className="text-primary" />
                      <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
                        1
                      </div>
                    </Button>
                    <Button
                      variant={"ghost"}
                      size={"icon"}
                      className="absolute -top-2 -right-2 rounded-full h-5 w-5 p-0 bg-destructive hover:bg-destructive/80 text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => {
                        setSelectedImage(null);
                        setImagePreview(null);
                        toast.info("Image removed");
                      }}
                    >
                      <XIcon className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={"ghost"}
                        size={"sm"}
                        className="rounded-full hover:bg-input! p-2!"
                        onClick={() =>
                          document
                            .getElementById(`image-upload-${threadId}`)
                            ?.click()
                        }
                      >
                        <PlusIcon />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Add image</TooltipContent>
                  </Tooltip>
                )}

                <div className="flex-1" />
                {!isLoading && !input.length ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size={"sm"}
                        onClick={() => {
                          appStoreMutate((state) => ({
                            voiceChat: {
                              ...state.voiceChat,
                              isOpen: true,
                              agentId: undefined,
                            },
                          }));
                        }}
                        className="rounded-full p-2!"
                      >
                        <Mic size={16} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t("VoiceChat.title")}</TooltipContent>
                  </Tooltip>
                ) : (
                  <div
                    onClick={() => {
                      if (isLoading) {
                        onStop();
                      } else {
                        submit();
                      }
                    }}
                    className="fade-in animate-in cursor-pointer text-muted-foreground rounded-full p-2 bg-secondary hover:bg-accent-foreground hover:text-accent transition-all duration-200"
                  >
                    {isLoading ? (
                      <Square
                        size={16}
                        className="fill-muted-foreground text-muted-foreground"
                      />
                    ) : (
                      <CornerRightUp size={16} />
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </fieldset>
      </div>
    </div>
  );
}
