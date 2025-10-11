"use client";

import {
  Mic,
  CornerRightUp,
  Square,
  XIcon,
  PlusIcon,
  Loader2,
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
import { ImagePreview } from "./image-preview";
import { processImageForUpload } from "lib/services/image-upload-service";

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
  disabled?: boolean; // Added: Disable input when out of credits
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
  disabled = false,
}: PromptInputProps) {
  const t = useTranslations("Chat");
  const [isDictating, setIsDictating] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Image upload state
  const [uploadedImage, setUploadedImage] = useState<{
    base64: string;
    name: string;
  } | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageUploadStats, setImageUploadStats] = useState<{
    canUpload: boolean;
    reason?: string;
    imagesUsed: number;
    imagesRemaining: number;
    subscriptionType?: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [threadMentions, appStoreMutate] = appStore(
    useShallow((state) => [state.threadMentions, state.mutate]),
  );

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

  // Fetch image upload stats on mount
  useEffect(() => {
    async function fetchImageStats() {
      try {
        const response = await fetch("/api/chat/image-upload-check");
        if (response.ok) {
          const data = await response.json();
          setImageUploadStats(data);
        }
      } catch (error) {
        console.error("Failed to fetch image upload stats:", error);
      }
    }
    fetchImageStats();
  }, []);

  // Handle image file selection
  const handleImageSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const processedImage = await processImageForUpload(file);
      setUploadedImage({
        base64: processedImage.base64,
        name: processedImage.originalName,
      });
      toast.success("Image uploaded successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to upload image");
    } finally {
      setIsUploadingImage(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveImage = () => {
    setUploadedImage(null);
  };

  const handleImageButtonClick = () => {
    if (disabled) {
      // Show credits exhausted message
      toast.error(
        "Out of credits - Please upgrade to continue using image upload",
      );
      return;
    }
    if (!imageUploadStats?.canUpload) {
      // Show upgrade toast for users without permission
      toast.error(
        imageUploadStats?.reason ||
          "Image upload is only available for Chat Only and Premium plans",
      );
      return;
    }
    fileInputRef.current?.click();
  };

  const submit = () => {
    if (isLoading) return;
    const userMessage = input?.trim() || "";
    if (userMessage.length === 0 && !uploadedImage) return;

    const parts: any[] = [];

    // Add image part if present
    if (uploadedImage) {
      parts.push({
        type: "image",
        image: uploadedImage.base64,
      });
    }

    // Add text part if present
    if (userMessage.length > 0) {
      parts.push({
        type: "text",
        text: userMessage,
      });
    }

    setInput("");
    setUploadedImage(null); // Clear image after sending
    sendMessage({
      role: "user",
      parts,
    });

    // Refresh image stats after sending
    fetch("/api/chat/image-upload-check")
      .then((res) => res.json())
      .then((data) => setImageUploadStats(data))
      .catch(console.error);
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

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn("Speech recognition not supported in this browser");
      return;
    }

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;

    recognitionRef.current.onresult = (event: any) => {
      let _interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + " ";
        } else {
          _interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        setInput((input || "") + finalTranscript);
      }
    };

    recognitionRef.current.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsDictating(false);
      if (event.error !== "no-speech" && event.error !== "aborted") {
        toast.error("Dictation error. Please try again.");
      }
    };

    recognitionRef.current.onend = () => {
      setIsDictating(false);
    };

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [setInput]);

  const toggleDictation = useCallback(() => {
    if (!recognitionRef.current) {
      toast.error("Speech recognition is not supported in your browser");
      return;
    }

    if (isDictating) {
      recognitionRef.current.stop();
      setIsDictating(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsDictating(true);
      } catch (error) {
        console.error("Failed to start dictation:", error);
        toast.error("Failed to start dictation");
      }
    }
  }, [isDictating]);

  return (
    <div className="max-w-3xl mx-auto fade-in animate-in">
      <div className="z-10 mx-auto w-full max-w-3xl relative">
        <fieldset className="flex w-full min-w-0 max-w-full flex-col px-4">
          <div className="input-gradient-border overflow-hidden rounded-4xl backdrop-blur-sm transition-all duration-200 bg-white relative flex w-full flex-col cursor-text z-10 items-stretch focus-within:bg-white hover:bg-white focus-within:ring-muted hover:ring-muted soft-shadow">
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
            <div className="flex flex-col gap-0.5 px-5 pt-4 pb-4">
              {/* Image Preview */}
              {uploadedImage && (
                <div className="mb-2 px-1">
                  <ImagePreview
                    imageUrl={uploadedImage.base64}
                    imageName={uploadedImage.name}
                    onRemove={handleRemoveImage}
                  />
                </div>
              )}

              <div className="relative min-h-[2rem]">
                <SimpleChatInput
                  input={input}
                  onChange={setInput}
                  onEnter={submit}
                  placeholder={
                    disabled
                      ? "Out of credits - Upgrade to continue"
                      : (placeholder ?? t("placeholder"))
                  }
                  ref={editorRef}
                  onFocus={onFocus}
                  disabled={isLoading || disabled}
                />
              </div>
              <div className="flex w-full items-center z-30">
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="hidden"
                  onChange={handleImageSelect}
                />

                {/* Image Upload Button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={`rounded-full hover:bg-input cursor-pointer inline-flex items-center justify-center ${
                        !imageUploadStats?.canUpload || disabled
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }`}
                      onClick={(e) => {
                        e.preventDefault();
                        handleImageButtonClick();
                      }}
                    >
                      <Button
                        variant={"ghost"}
                        size={"sm"}
                        className="p-2 h-8 w-8 rounded-full"
                        disabled={false} // Never disable the button itself to allow tooltip
                      >
                        {isUploadingImage ? (
                          <Loader2 className="animate-spin" size={18} />
                        ) : (
                          <PlusIcon size={18} />
                        )}
                      </Button>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    {!imageUploadStats ? (
                      <p className="text-xs">Loading...</p>
                    ) : disabled ? (
                      <div className="text-xs">
                        <p className="font-medium">Image upload disabled</p>
                        <p className="text-muted-foreground mt-1">
                          Out of credits - Upgrade to continue using image
                          upload
                        </p>
                      </div>
                    ) : !imageUploadStats.canUpload ? (
                      <p className="text-xs">
                        Upgrade to enable image uploads.
                      </p>
                    ) : uploadedImage ? (
                      <p className="text-xs">
                        Remove current image to upload another
                      </p>
                    ) : (
                      <p className="text-xs">Upload Image</p>
                    )}
                  </TooltipContent>
                </Tooltip>

                <div className="flex-1 flex items-center justify-center">
                  {/* Recording Indicator */}
                  {isDictating && (
                    <div className="flex items-center gap-2 animate-in fade-in-50">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        <div
                          className="w-2 h-2 bg-red-500 rounded-full animate-pulse"
                          style={{ animationDelay: "0.2s" }}
                        />
                        <div
                          className="w-2 h-2 bg-red-500 rounded-full animate-pulse"
                          style={{ animationDelay: "0.4s" }}
                        />
                      </div>
                      <span className="text-xs text-red-500 font-medium animate-pulse">
                        Listening...
                      </span>
                    </div>
                  )}
                </div>

                {/* Dictate Button - Always visible when not loading */}
                {!isLoading && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size={"sm"}
                        onClick={toggleDictation}
                        disabled={disabled}
                        className={`rounded-full p-2! relative ${
                          disabled
                            ? "opacity-50 cursor-not-allowed"
                            : isDictating
                              ? "bg-red-500 hover:bg-red-600 text-white animate-pulse"
                              : "pink-accent hover:opacity-90"
                        }`}
                      >
                        <Mic size={16} />
                        {isDictating && (
                          <span className="absolute -top-1 -right-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                          </span>
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {disabled
                        ? "Out of credits"
                        : isDictating
                          ? "Stop Dictating"
                          : "Dictate"}
                    </TooltipContent>
                  </Tooltip>
                )}

                {/* Send/Stop Button */}
                {(isLoading || input.length > 0) && (
                  <div
                    onClick={() => {
                      if (isLoading) {
                        onStop();
                      } else {
                        submit();
                      }
                    }}
                    className="fade-in animate-in cursor-pointer text-white rounded-full p-2 pink-accent-send hover:opacity-90 transition-all duration-200"
                  >
                    {isLoading ? (
                      <Square size={16} className="fill-white text-white" />
                    ) : (
                      <CornerRightUp size={16} className="text-white" />
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
