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
  Languages,
  User,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { safe } from "ts-safe";
import { Alert, AlertDescription, AlertTitle } from "ui/alert";
import { Button } from "ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "ui/select";

import { appStore } from "@/app/store";
import { useShallow } from "zustand/shallow";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { fetcher } from "lib/utils";

export default function VoiceChatPage() {
  const t = useTranslations("Chat");
  const router = useRouter();
  const [voiceChat, currentThreadId] = appStore(
    useShallow((state) => [state.voiceChat, state.currentThreadId]),
  );

  const selectedTherapist = voiceChat.selectedTherapist;

  const [isClosing, setIsClosing] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("en");
  const [userHasSelectedLanguage, setUserHasSelectedLanguage] = useState(false);
  const startAudio = useRef<HTMLAudioElement>(null);

  // Redirect to therapist selection if no therapist is selected
  useEffect(() => {
    if (!selectedTherapist) {
      console.log("No therapist selected, redirecting to /therapists");
      router.push("/therapists");
    }
  }, [selectedTherapist, router]);

  // Load user's preferred language on component mount
  useEffect(() => {
    const loadPreferredLanguage = async () => {
      try {
        const response = await fetch("/api/user/preferred-language");
        if (response.ok) {
          const data = await response.json();
          if (data.language) {
            console.log(
              "✅ Loaded preferred language from database:",
              data.language,
            );
            setSelectedLanguage(data.language);
            setUserHasSelectedLanguage(true);
          }
        }
      } catch (error) {
        console.error("Error loading preferred language:", error);
      }
    };

    loadPreferredLanguage();
  }, []);

  // Parse therapist languages
  const getAvailableLanguages = useCallback(() => {
    if (!selectedTherapist) return [];

    const languages = selectedTherapist.language.split(" • ");
    const uniqueLanguages: { label: string; value: string }[] = [];
    const seenCodes = new Set<string>();

    languages.forEach((lang, _index) => {
      const trimmedLang = lang.trim();
      // Map language names to language codes
      const langCode = trimmedLang.toLowerCase().includes("english")
        ? "en"
        : trimmedLang.toLowerCase().includes("spanish")
          ? "es"
          : trimmedLang.toLowerCase().includes("japanese")
            ? "ja"
            : trimmedLang.toLowerCase().includes("arabic")
              ? "ar"
              : trimmedLang.toLowerCase().includes("french")
                ? "fr"
                : trimmedLang.toLowerCase().includes("german")
                  ? "de"
                  : trimmedLang.toLowerCase().includes("hindi")
                    ? "hi"
                    : trimmedLang.toLowerCase().includes("russian")
                      ? "ru"
                      : "en"; // default to English for unknown languages

      // Only add if we haven't seen this language code before
      if (!seenCodes.has(langCode)) {
        seenCodes.add(langCode);
        uniqueLanguages.push({
          label: trimmedLang,
          value: langCode,
        });
      }
    });

    console.log("🔍 Debug - getAvailableLanguages result:", uniqueLanguages);
    return uniqueLanguages;
  }, [selectedTherapist]);

  // Memoize available languages to prevent unnecessary recalculations
  const availableLanguages = useMemo(
    () => getAvailableLanguages(),
    [selectedTherapist],
  );

  // Debug logging (can be removed in production)
  // console.log("🔍 Debug - availableLanguages:", availableLanguages);
  // console.log("🔍 Debug - selectedLanguage:", selectedLanguage);
  // console.log("🔍 Debug - selectedTherapist:", selectedTherapist?.name);
  // console.log("🔍 Debug - userHasSelectedLanguage:", userHasSelectedLanguage);

  // Set default language when therapist changes (only if user hasn't selected manually)
  useEffect(() => {
    if (
      selectedTherapist &&
      availableLanguages.length > 0 &&
      !userHasSelectedLanguage
    ) {
      // console.log("🔍 Debug - Setting default language to:", availableLanguages[0]);
      setSelectedLanguage(availableLanguages[0].value);
    }
  }, [selectedTherapist, availableLanguages, userHasSelectedLanguage]);

  // Debug when selectedLanguage changes (can be removed in production)
  // useEffect(() => {
  //   console.log("🔍 Debug - selectedLanguage changed to:", selectedLanguage);
  // }, [selectedLanguage]);

  // Fetch credit status
  const { data: creditStatus, mutate: mutateCredits } = useSWR(
    "/api/stripe/get-subscription-status",
    fetcher,
  );

  const totalVoiceCredits = creditStatus?.credits
    ? creditStatus.credits.voiceCredits +
      creditStatus.credits.voiceCreditsFromTopup
    : 0;

  const freeTrialCredits = creditStatus?.credits?.voiceCredits || 0;
  const topUpCredits = creditStatus?.credits?.voiceCreditsFromTopup || 0;

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
    selectedLanguage, // Pass selected language for initial greeting
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
    router.push("/");
  }, [stop, router, messages, currentThreadId]);

  const handleBackButton = useCallback(() => {
    if (!isActive) {
      router.back();
    }
  }, [isActive, router]);

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

  // Handle session cleanup when user closes window/tab or navigates away
  useEffect(() => {
    const handleBeforeUnload = async (e: BeforeUnloadEvent) => {
      if (isActive && messages.length > 0) {
        e.preventDefault();

        const conversationMessages = messages
          .map((m) => {
            const textPart = m.parts.find((p) => p.type === "text");
            return {
              role: m.role,
              content: textPart ? (textPart as any).text || "" : "",
            };
          })
          .filter((m) => m.content.trim().length > 0);

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
    <div className="w-full h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="w-full border-b">
        {/* Desktop: Single Row */}
        <div className="hidden sm:flex flex-row items-center p-4 md:p-6 gap-2">
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
              {isActive ? "Please end the session first to go back" : "Go Back"}
            </TooltipContent>
          </Tooltip>

          {/* Therapist Info */}
          <div className="flex items-center gap-2 flex-1">
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
                  <div className="text-sm font-semibold">
                    {selectedTherapist.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {selectedTherapist.specialization} •{" "}
                    {selectedTherapist.language}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm font-medium text-muted-foreground">
                Voice Therapy Session
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {!isActive && (
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Language Selector */}
              {selectedTherapist && availableLanguages.length > 1 && (
                <Select
                  key={`desktop-${selectedLanguage}`}
                  value={selectedLanguage}
                  onValueChange={async (value) => {
                    setUserHasSelectedLanguage(true);
                    setSelectedLanguage(value);

                    // Save to database
                    try {
                      const response = await fetch(
                        "/api/user/preferred-language",
                        {
                          method: "PUT",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ language: value }),
                        },
                      );
                      if (response.ok) {
                        console.log(
                          "✅ Saved preferred language to database:",
                          value,
                        );
                      }
                    } catch (error) {
                      console.error("Error saving preferred language:", error);
                    }
                  }}
                  disabled={false}
                >
                  <SelectTrigger className="h-8 px-3 py-2 text-xs border border-input bg-background whitespace-nowrap min-w-[120px] min-h-[36px]">
                    <Languages className="h-3.5 w-3.5 mr-1" />
                    <SelectValue placeholder="Language" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableLanguages.map((lang) => (
                      <SelectItem key={lang.value} value={lang.value}>
                        {lang.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Change Therapist Button */}
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 py-2 text-xs whitespace-nowrap min-w-[120px] min-h-[36px]"
                onClick={() => router.push("/therapists")}
              >
                <User className="h-3.5 w-3.5 mr-1" />
                {selectedTherapist ? "Change Therapist" : "Setup Therapist"}
              </Button>
            </div>
          )}

          {/* Credits */}
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
                <span className="text-xs text-muted-foreground">
                  Voice Credits
                </span>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-64 p-3 z-[200]"
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
                      Free Trial
                    </span>
                    <span className="text-sm font-medium">
                      {freeTrialCredits}
                    </span>
                  </div>

                  {topUpCredits > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Top-Up
                      </span>
                      <span className="text-sm font-medium">
                        {topUpCredits}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-sm font-semibold">Total</span>
                    <span className="text-base font-bold">
                      {totalVoiceCredits}
                    </span>
                  </div>
                </div>

                <div className="text-[10px] text-muted-foreground text-center pt-2 border-t">
                  Free trial credits are used first
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Mobile: Stacked Layout */}
        <div className="flex sm:hidden flex-col gap-3 p-3">
          {/* Top Row: Back + Therapist + Credits */}
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="flex-shrink-0 h-8 w-8"
                  onClick={handleBackButton}
                  disabled={false}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {isActive ? "Please end the session first" : "Go Back"}
              </TooltipContent>
            </Tooltip>

            {selectedTherapist && (
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Avatar className="h-7 w-7 rounded-full bg-white flex-shrink-0">
                  <AvatarImage
                    src={selectedTherapist.avatar}
                    alt={selectedTherapist.name}
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-white text-black text-xs font-bold uppercase">
                    {selectedTherapist.name.split(" ")[1]?.charAt(0) ||
                      selectedTherapist.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-semibold truncate">
                  {selectedTherapist.name}
                </span>
              </div>
            )}

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-1 h-8 px-2 flex-shrink-0"
                >
                  <CreditCard className="h-3 w-3 text-muted-foreground" />
                  <span className="text-sm font-semibold">
                    {totalVoiceCredits}
                  </span>
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-[calc(100vw-1rem)] p-3 z-[200]"
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
                        Free Trial
                      </span>
                      <span className="text-sm font-medium">
                        {freeTrialCredits}
                      </span>
                    </div>

                    {topUpCredits > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          Top-Up
                        </span>
                        <span className="text-sm font-medium">
                          {topUpCredits}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-sm font-semibold">Total</span>
                      <span className="text-base font-bold">
                        {totalVoiceCredits}
                      </span>
                    </div>
                  </div>

                  <div className="text-[10px] text-muted-foreground text-center pt-2 border-t">
                    Free trial credits are used first
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Bottom Row: Action Buttons - Only if not active */}
          {!isActive && (
            <div className="flex gap-2 w-full">
              {/* Language Selector */}
              {selectedTherapist && availableLanguages.length > 1 && (
                <Select
                  key={`mobile-${selectedLanguage}`}
                  value={selectedLanguage}
                  onValueChange={async (value) => {
                    setUserHasSelectedLanguage(true);
                    setSelectedLanguage(value);

                    // Save to database
                    try {
                      const response = await fetch(
                        "/api/user/preferred-language",
                        {
                          method: "PUT",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ language: value }),
                        },
                      );
                      if (response.ok) {
                        console.log(
                          "✅ Saved preferred language to database:",
                          value,
                        );
                      }
                    } catch (error) {
                      console.error("Error saving preferred language:", error);
                    }
                  }}
                  disabled={false}
                >
                  <SelectTrigger className="flex-1 h-8 px-3 py-2 text-xs border border-input bg-background whitespace-nowrap min-h-[36px]">
                    <Languages className="h-3.5 w-3.5 mr-1" />
                    <SelectValue placeholder="Language" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableLanguages.map((lang) => (
                      <SelectItem key={lang.value} value={lang.value}>
                        {lang.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Change Therapist Button */}
              <Button
                variant="outline"
                size="sm"
                className={`h-8 px-3 py-2 text-xs whitespace-nowrap min-h-[36px] ${selectedTherapist && availableLanguages.length > 1 ? "flex-1" : "w-full"}`}
                onClick={() => router.push("/therapists")}
              >
                <User className="h-3.5 w-3.5 mr-1" />
                {selectedTherapist ? "Change Therapist" : "Setup Therapist"}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-h-0 mx-auto w-full">
        {error ? (
          <div className="max-w-3xl mx-auto p-6">
            <Alert variant={"destructive"}>
              <TriangleAlertIcon className="size-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error.message}</AlertDescription>

              <AlertDescription className="my-4">
                <p className="text-muted-foreground">
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
              <div className="animate-in fade-in-50 duration-1000 text-center w-full">
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
              <p>End session</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );
}
