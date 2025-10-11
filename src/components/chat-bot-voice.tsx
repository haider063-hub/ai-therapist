"use client";

import { useOpenAIVoiceChat as OpenAIVoiceChat } from "lib/ai/speech/open-ai/use-voice-chat.openai";
import { cn } from "lib/utils";
import {
  Loader,
  MicIcon,
  MicOffIcon,
  PhoneIcon,
  CreditCard,
  ChevronDown,
  TriangleAlertIcon,
  ArrowLeft,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { safe } from "ts-safe";
import { Alert, AlertDescription, AlertTitle } from "ui/alert";
import { Button } from "ui/button";

import { Drawer, DrawerContent, DrawerPortal, DrawerTitle } from "ui/drawer";
import { Tooltip, TooltipContent, TooltipTrigger } from "ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "ui/avatar";

import { appStore } from "@/app/store";
import { useShallow } from "zustand/shallow";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { fetcher } from "lib/utils";

export function ChatBotVoice() {
  const t = useTranslations("Chat");
  const router = useRouter();
  const [appStoreMutate, voiceChat, currentThreadId] = appStore(
    useShallow((state) => [
      state.mutate,
      state.voiceChat,
      state.currentThreadId,
    ]),
  );

  const selectedTherapist = voiceChat.selectedTherapist;

  const [isClosing, setIsClosing] = useState(false);
  const startAudio = useRef<HTMLAudioElement>(null);

  // Fetch credit status
  const { data: creditStatus, mutate: mutateCredits } = useSWR(
    "/api/stripe/get-subscription-status",
    fetcher,
  );

  const totalVoiceCredits = creditStatus?.credits
    ? creditStatus.credits.voiceCredits +
      creditStatus.credits.voiceCreditsFromTopup
    : 0;

  // Calculate plan credits (remaining from subscription)
  const hasVoicePlan =
    creditStatus?.credits?.subscriptionType === "voice_only" ||
    creditStatus?.credits?.subscriptionType === "voice_chat";

  const planCredits = hasVoicePlan
    ? creditStatus?.credits?.voiceCredits || 0
    : 0;
  const topUpCredits = creditStatus?.credits?.voiceCreditsFromTopup || 0;

  // Only show dropdown if user has both plan credits and top-up credits
  const showBreakdown = hasVoicePlan && planCredits > 0 && topUpCredits > 0;

  // Listen for credit updates
  useEffect(() => {
    const handleCreditsUpdate = () => {
      mutateCredits();
    };
    window.addEventListener("credits-updated", handleCreditsUpdate);
    return () =>
      window.removeEventListener("credits-updated", handleCreditsUpdate);
  }, [mutateCredits]);

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
    selectedTherapist,
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

  const handleBackButton = useCallback(() => {
    if (!isActive) {
      // Session not active, can safely go back
      appStoreMutate({
        voiceChat: {
          ...voiceChat,
          isOpen: false,
        },
      });
    }
    // If session is active, button is disabled, so this won't be called
  }, [isActive, appStoreMutate, voiceChat]);

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

  // Handle session cleanup when user closes window/tab or navigates away
  useEffect(() => {
    const handleBeforeUnload = async (e: BeforeUnloadEvent) => {
      if (isActive && messages.length > 0) {
        // End the session and deduct credits
        e.preventDefault();

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

        // Use sendBeacon for reliable request on page unload
        const data = JSON.stringify({
          threadId: currentThreadId,
          messages: conversationMessages,
        });

        navigator.sendBeacon("/api/chat/voice-session-end", data);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isActive, messages, currentThreadId]);

  return (
    <>
      <Drawer dismissible={false} open={voiceChat.isOpen} direction="top">
        <DrawerPortal>
          <DrawerContent className="max-h-[100vh]! h-full border-none! rounded-none! flex flex-col bg-card z-[100]">
            <DrawerTitle className="sr-only">Voice Therapy Session</DrawerTitle>
            <div className="w-full h-full flex flex-col ">
              {/* Mobile: Header with Credits on Right, Desktop: Horizontal Layout */}
              <div
                className="w-full flex flex-row items-start sm:items-center p-3 sm:p-4 md:p-6 gap-2"
                style={{
                  userSelect: "text",
                }}
              >
                {/* Back Button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="flex-shrink-0"
                      onClick={handleBackButton}
                      disabled={isActive}
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    {isActive
                      ? "Please end the session first to go back"
                      : "Go back"}
                  </TooltipContent>
                </Tooltip>

                {/* Left side: Voice Session Header with Therapist Info */}
                <div className="flex items-center gap-2 flex-shrink-0 flex-1">
                  {selectedTherapist ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8 rounded-full bg-white">
                        <AvatarImage
                          src={selectedTherapist.avatar}
                          alt={selectedTherapist.name}
                          className="object-cover"
                        />
                        <AvatarFallback className="bg-white text-black text-sm font-bold uppercase">
                          {selectedTherapist.name.split(" ")[1]?.charAt(0) ||
                            selectedTherapist.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <div className="text-xs sm:text-sm font-semibold">
                          {selectedTherapist.name}
                        </div>
                        <div className="text-[10px] sm:text-xs text-muted-foreground">
                          {selectedTherapist.specialization} •{" "}
                          {selectedTherapist.language}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs sm:text-sm font-medium text-muted-foreground">
                      Voice Therapy Session
                    </div>
                  )}
                </div>

                {/* Setup Button */}
                {!isActive && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-shrink-0 text-xs font-normal h-8"
                    onClick={() => {
                      // Close voice chat drawer first
                      appStoreMutate({
                        voiceChat: {
                          ...voiceChat,
                          isOpen: false,
                        },
                      });
                      // Then navigate to selection page
                      setTimeout(() => {
                        router.push("/therapists");
                      }, 100);
                    }}
                  >
                    {selectedTherapist ? "Change Therapist" : "Setup Therapist"}
                  </Button>
                )}

                {/* Right side: Credits with Dropdown */}
                {showBreakdown ? (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        className="flex items-center gap-2 h-auto px-2 py-1"
                      >
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-semibold">
                          {totalVoiceCredits}
                        </span>
                        <span className="text-xs text-muted-foreground hidden sm:inline">
                          Voice Credits
                        </span>
                        <ChevronDown className="h-3 w-3 text-muted-foreground" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-[calc(100vw-1rem)] sm:w-64 p-3 z-[200]"
                      align="end"
                      side="bottom"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b">
                          <span className="text-sm font-semibold">
                            Credit Breakdown
                          </span>
                          <CreditCard className="h-4 w-4 text-muted-foreground" />
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              {creditStatus?.credits?.subscriptionType ===
                              "voice_only"
                                ? "Voice Only Plan"
                                : "Voice + Chat Plan"}
                            </span>
                            <span className="text-sm font-medium">
                              {planCredits}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              Top-Up
                            </span>
                            <span className="text-sm font-medium">
                              {topUpCredits}
                            </span>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t">
                            <span className="text-sm font-semibold">Total</span>
                            <span className="text-base font-bold">
                              {totalVoiceCredits}
                            </span>
                          </div>
                        </div>

                        <div className="text-[10px] text-muted-foreground text-center pt-2 border-t">
                          Plan credits are used first
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                ) : (
                  <div className="flex items-center gap-2 h-auto px-2 py-1">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-semibold">
                      {totalVoiceCredits}
                    </span>
                    <span className="text-xs text-muted-foreground hidden sm:inline">
                      Voice Credits
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-h-0 mx-auto w-full">
                {error ? (
                  <div className="max-w-3xl mx-auto">
                    <Alert variant={"destructive"}>
                      <TriangleAlertIcon className="size-4 " />
                      <AlertTitle className="text-white">Error</AlertTitle>
                      <AlertDescription className="text-white">
                        {error.message}
                      </AlertDescription>

                      <AlertDescription className="my-4 ">
                        <p className="text-white/80 ">
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
                    <div className="w-full mx-auto h-full max-h-[80vh] overflow-y-auto px-4 lg:max-w-4xl flex-1 flex items-center ">
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
                {/* End Conversation Button - Only show when session is active */}
                {isActive && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={"destructive"}
                        size={"default"}
                        className="rounded-full px-6 py-3"
                        disabled={isLoading || isClosing}
                        onClick={endVoiceChat}
                      >
                        <PhoneIcon className="size-4 mr-2 rotate-[135deg]" />
                        End Conversation
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>End session and deduct 50 credits</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>
          </DrawerContent>
        </DrawerPortal>
      </Drawer>
    </>
  );
}
