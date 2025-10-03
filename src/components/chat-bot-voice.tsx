"use client";

import {
  OPENAI_VOICE,
  useOpenAIVoiceChat as OpenAIVoiceChat,
} from "lib/ai/speech/open-ai/use-voice-chat.openai";
import { cn } from "lib/utils";
import {
  CheckIcon,
  Loader,
  MicIcon,
  MicOffIcon,
  PhoneIcon,
  Settings2Icon,
  TriangleAlertIcon,
  XIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { safe } from "ts-safe";
import { Alert, AlertDescription, AlertTitle } from "ui/alert";
import { Button } from "ui/button";

import { Drawer, DrawerContent, DrawerPortal, DrawerTitle } from "ui/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "ui/dropdown-menu";
import { GeminiIcon } from "ui/gemini-icon";
import { OpenAIIcon } from "ui/openai-icon";
import { Tooltip, TooltipContent, TooltipTrigger } from "ui/tooltip";

import { appStore } from "@/app/store";
import { useShallow } from "zustand/shallow";
import { useTranslations } from "next-intl";
import CreditDisplay from "@/components/credits/credit-display";

export function ChatBotVoice() {
  const t = useTranslations("Chat");
  const [appStoreMutate, voiceChat, currentThreadId] = appStore(
    useShallow((state) => [
      state.mutate,
      state.voiceChat,
      state.currentThreadId,
    ]),
  );

  const [isClosing, setIsClosing] = useState(false);
  const startAudio = useRef<HTMLAudioElement>(null);
  // Voice-only mode - no view toggle needed

  // No agent or MCP tool mentions - only browser tools
  const toolMentions = useMemo(() => [], []);

  const {
    isListening,
    isAssistantSpeaking,
    isLoading,
    isActive,
    isUserSpeaking,
    messages,
    error,
    start,
    startListening,
    stop,
    stopListening,
  } = OpenAIVoiceChat({
    toolMentions,
    currentThreadId: currentThreadId || undefined,
    ...voiceChat.options.providerOptions,
  });

  const startWithSound = useCallback(() => {
    if (!startAudio.current) {
      startAudio.current = new Audio("/sounds/start_voice.ogg");
    }
    start().then(() => {
      startAudio.current?.play().catch(() => {});
    });
  }, [start]);

  const endVoiceChat = useCallback(async () => {
    setIsClosing(true);
    await safe(() => stop());

    // Track voice session end if there were any messages
    if (messages.length > 0) {
      try {
        // Extract conversation messages for mood tracking
        const conversationMessages = messages
          .map((m) => {
            const textPart = m.parts.find((p) => p.type === "text");
            return {
              role: m.role,
              content: textPart ? (textPart as any).text || "" : "",
            };
          })
          .filter((m) => m.content.trim().length > 0);

        await fetch("/api/chat/voice-session-end", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            threadId: currentThreadId,
            messages: conversationMessages,
          }),
        });
      } catch (error) {
        console.error("Failed to track voice session:", error);
      }
    }

    setIsClosing(false);
    appStoreMutate({
      voiceChat: {
        ...voiceChat,
        isOpen: false,
      },
    });
  }, [stop, appStoreMutate, voiceChat, messages, currentThreadId]);

  const statusMessage = useMemo(() => {
    if (isLoading) {
      return (
        <p className="fade-in animate-in duration-3000" key="start">
          {t("VoiceChat.preparing")}
        </p>
      );
    }
    if (!isActive)
      return (
        <p className="fade-in animate-in duration-3000" key="start">
          {t("VoiceChat.startVoiceChat")}
        </p>
      );
    if (!isListening)
      return (
        <p className="fade-in animate-in duration-3000" key="stop">
          {t("VoiceChat.yourMicIsOff")}
        </p>
      );
    if (!isAssistantSpeaking && messages.length === 0) {
      return (
        <p className="fade-in animate-in duration-3000" key="ready">
          {t("VoiceChat.readyWhenYouAreJustStartTalking")}
        </p>
      );
    }
    // Voice-only mode - no compact view needed
    if (!isAssistantSpeaking && !isUserSpeaking) {
      return (
        <p className="delayed-fade-in" key="ready">
          {t("VoiceChat.readyWhenYouAreJustStartTalking")}
        </p>
      );
    }
  }, [
    isAssistantSpeaking,
    isUserSpeaking,
    isActive,
    isLoading,
    isListening,
    messages.length,
    t,
  ]);

  // Cleanup effect - only runs on unmount or when options change significantly
  const optionsRef = useRef(voiceChat.options);
  useEffect(() => {
    // Check if options actually changed (not just reference)
    const optionsChanged =
      JSON.stringify(optionsRef.current) !== JSON.stringify(voiceChat.options);

    if (optionsChanged && isActive) {
      stop();
    }

    optionsRef.current = voiceChat.options;
  }, [voiceChat.options, isActive, stop]);

  useEffect(() => {
    // Only stop if drawer is closed
    if (!voiceChat.isOpen && isActive) {
      stop();
    }
  }, [voiceChat.isOpen, isActive, stop]);

  useEffect(() => {
    if (error && isActive) {
      toast.error(error.message);
      stop();
    }
  }, [error]);

  return (
    <Drawer dismissible={false} open={voiceChat.isOpen} direction="top">
      <DrawerPortal>
        <DrawerContent className="max-h-[100vh]! h-full border-none! rounded-none! flex flex-col bg-card z-[100]">
          <div className="w-full h-full flex flex-col ">
            <div
              className="w-full flex p-6 gap-2"
              style={{
                userSelect: "text",
              }}
            >
              {/* Voice Session Header */}
              <div className="flex items-center gap-2 px-4">
                <div className="text-sm font-medium text-muted-foreground">
                  Voice Therapy Session
                </div>
              </div>

              {/* Credit Display - Voice Context */}
              <div className="flex-1 flex justify-end items-center pr-4">
                <CreditDisplay
                  compact={true}
                  showUpgradeButton={false}
                  context="voice"
                />
              </div>

              {/* Settings Dropdown */}
              <DrawerTitle>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant={"ghost"} size={"icon"}>
                      <Settings2Icon className="text-foreground size-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    side="left"
                    className="min-w-40"
                    align="start"
                  >
                    <DropdownMenuGroup className="cursor-pointer">
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger
                          className="flex items-center gap-2 cursor-pointer"
                          icon=""
                        >
                          <OpenAIIcon className="size-3.5 stroke-none fill-foreground" />
                          Open AI
                        </DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                          <DropdownMenuSubContent>
                            {Object.entries(OPENAI_VOICE).map(
                              ([key, value]) => (
                                <DropdownMenuItem
                                  className="cursor-pointer flex items-center justify-between"
                                  onClick={() =>
                                    appStoreMutate({
                                      voiceChat: {
                                        ...voiceChat,
                                        options: {
                                          provider: "openai",
                                          providerOptions: {
                                            voice: value,
                                          },
                                        },
                                      },
                                    })
                                  }
                                  key={key}
                                >
                                  {key}

                                  {value ===
                                    voiceChat.options.providerOptions
                                      ?.voice && (
                                    <CheckIcon className="size-3.5" />
                                  )}
                                </DropdownMenuItem>
                              ),
                            )}
                          </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                      </DropdownMenuSub>
                      <DropdownMenuSub>
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger
                            className="flex items-center gap-2 text-muted-foreground"
                            icon=""
                          >
                            <GeminiIcon className="size-3.5" />
                            Gemini
                          </DropdownMenuSubTrigger>
                          <DropdownMenuPortal>
                            <DropdownMenuSubContent>
                              <div className="text-xs text-muted-foreground p-6">
                                Not Implemented Yet
                              </div>
                            </DropdownMenuSubContent>
                          </DropdownMenuPortal>
                        </DropdownMenuSub>
                      </DropdownMenuSub>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </DrawerTitle>
            </div>
            <div className="flex-1 min-h-0 mx-auto w-full">
              {error ? (
                <div className="max-w-3xl mx-auto">
                  <Alert variant={"destructive"}>
                    <TriangleAlertIcon className="size-4 " />
                    <AlertTitle className="">Error</AlertTitle>
                    <AlertDescription>{error.message}</AlertDescription>

                    <AlertDescription className="my-4 ">
                      <p className="text-muted-foreground ">
                        {t("VoiceChat.pleaseCloseTheVoiceChatAndTryAgain")}
                      </p>
                    </AlertDescription>
                  </Alert>
                </div>
              ) : null}
              {isLoading ? (
                <div className="flex-1"></div>
              ) : (
                <div className="h-full w-full">
                  {/* Voice-only mode - no text messages displayed */}
                  <div className="w-full mx-auto h-full max-h-[80vh] overflow-y-auto px-4 lg:max-w-4xl flex-1 flex items-center">
                    <div className="animate-in fade-in-50 duration-1000 text-center">
                      <div className="mb-8">
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary mb-4">
                          EchoNest AI Therapy
                        </h1>
                        <p className="text-xl md:text-2xl text-muted-foreground mb-6">
                          Voice-Only Conversation
                        </p>
                      </div>

                      <div className="max-w-2xl mx-auto">
                        <div className="animate-pulse">
                          <div className="flex items-center justify-center space-x-2 mb-4">
                            <div className="w-3 h-3 bg-primary rounded-full animate-bounce"></div>
                            <div
                              className="w-3 h-3 bg-primary rounded-full animate-bounce"
                              style={{ animationDelay: "0.1s" }}
                            ></div>
                            <div
                              className="w-3 h-3 bg-primary rounded-full animate-bounce"
                              style={{ animationDelay: "0.2s" }}
                            ></div>
                          </div>
                          <p className="text-lg text-muted-foreground">
                            {isActive && isListening
                              ? "Listening... speak naturally"
                              : isActive
                                ? "Voice chat active - click mic to start listening"
                                : "Ready to start voice conversation"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="relative w-full p-6 flex items-center justify-center gap-4">
              <div className="text-sm text-muted-foreground absolute -top-5 left-0 w-full justify-center flex items-center">
                {statusMessage}
              </div>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={"secondary"}
                    size={"icon"}
                    disabled={isClosing || isLoading}
                    onClick={() => {
                      if (!isActive) {
                        startWithSound();
                      } else if (isListening) {
                        stopListening();
                      } else {
                        startListening();
                      }
                    }}
                    className={cn(
                      "rounded-full p-6 transition-colors duration-300",

                      isLoading
                        ? "bg-accent-foreground text-accent animate-pulse"
                        : !isActive
                          ? "bg-green-500/10 text-green-500 hover:bg-green-500/30"
                          : !isListening
                            ? "bg-destructive/30 text-destructive hover:bg-destructive/10"
                            : isUserSpeaking
                              ? "bg-input text-foreground"
                              : "",
                    )}
                  >
                    {isLoading || isClosing ? (
                      <Loader className="size-6 animate-spin" />
                    ) : !isActive ? (
                      <PhoneIcon className="size-6 fill-green-500 stroke-none" />
                    ) : isListening ? (
                      <MicIcon
                        className={`size-6 ${isUserSpeaking ? "text-primary" : "text-muted-foreground transition-colors duration-300"}`}
                      />
                    ) : (
                      <MicOffIcon className="size-6" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {!isActive
                    ? t("VoiceChat.startConversation")
                    : isListening
                      ? t("VoiceChat.closeMic")
                      : t("VoiceChat.openMic")}
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={"secondary"}
                    size={"icon"}
                    className="rounded-full p-6"
                    disabled={isLoading || isClosing}
                    onClick={endVoiceChat}
                  >
                    <XIcon className="text-foreground size-6" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("VoiceChat.endConversation")}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </DrawerContent>
      </DrawerPortal>
    </Drawer>
  );
}
