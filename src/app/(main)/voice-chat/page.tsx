"use client";

import { useOpenAIVoiceChat as OpenAIVoiceChat } from "lib/ai/speech/open-ai/use-voice-chat.openai";
import { cn } from "lib/utils";
import {
  Loader,
  MicIcon,
  MicOffIcon,
  PhoneIcon,
  ChevronDown,
  TriangleAlertIcon,
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
import { SidebarTrigger } from "ui/sidebar";

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
  const startAudio = useRef<HTMLAudioElement>(null);
  const sessionStartTime = useRef<number | null>(null);
  const lastCreditDeductionTime = useRef<number | null>(null);
  const creditDeductionInterval = useRef<NodeJS.Timeout | null>(null);

  // Credit checking state
  const [canUseVoice, setCanUseVoice] = useState(true);
  const [voiceCreditsTotal, setVoiceCreditsTotal] = useState(0);

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

    return uniqueLanguages;
  }, [selectedTherapist]);

  // Memoize available languages to prevent unnecessary recalculations
  const availableLanguages = useMemo(
    () => getAvailableLanguages(),
    [getAvailableLanguages],
  );

  // Check if therapist is selected - wait for TherapistLoader to finish first
  useEffect(() => {
    const checkTherapist = async () => {
      // Wait a moment for TherapistLoader to load therapist into store
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Check store first
      const currentVoiceChat = appStore.getState().voiceChat;
      if (currentVoiceChat.selectedTherapist) {
        return;
      }

      // If not in store, check database directly
      try {
        const response = await fetch("/api/user/select-therapist");
        const data = await response.json();

        if (!data.selectedTherapistId) {
          router.push("/therapists");
        }
      } catch (error) {
        console.error("Error checking therapist:", error);
        router.push("/therapists");
      }
    };

    checkTherapist();
  }, [router]);

  // Set default language when therapist loads or changes
  useEffect(() => {
    if (selectedTherapist && availableLanguages.length > 0) {
      // Always ensure selectedLanguage is valid for current therapist
      const currentLangAvailable = availableLanguages.some(
        (lang) => lang.value === selectedLanguage,
      );

      if (!currentLangAvailable) {
        // Current language not available for this therapist, use first available
        setSelectedLanguage(availableLanguages[0].value);
      }
    }
  }, [selectedTherapist, availableLanguages, selectedLanguage]);

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

  // Calculate plan credits (remaining from subscription)
  const hasVoicePlan =
    creditStatus?.credits?.subscriptionType === "voice_only" ||
    creditStatus?.credits?.subscriptionType === "voice_chat";

  const planCredits = hasVoicePlan
    ? creditStatus?.credits?.voiceCredits || 0
    : 0;

  // Fetch and monitor voice credit status
  useEffect(() => {
    const fetchVoiceCredits = async () => {
      try {
        const response = await fetch("/api/stripe/get-subscription-status");
        if (response.ok) {
          const data = await response.json();

          const total =
            (data.credits.voiceCredits || 0) +
            (data.credits.voiceCreditsFromTopup || 0);

          setVoiceCreditsTotal(total);
          setCanUseVoice(data.features.canUseVoice);
        }
      } catch (error) {
        console.error("Failed to fetch voice credit status:", error);
      }
    };

    fetchVoiceCredits();

    // Listen for credit updates
    const handleCreditUpdate = () => fetchVoiceCredits();
    window.addEventListener("credits-updated", handleCreditUpdate);
    return () =>
      window.removeEventListener("credits-updated", handleCreditUpdate);
  }, []); // Run once on mount
  const topUpCredits = creditStatus?.credits?.voiceCreditsFromTopup || 0;

  // Only show dropdown if user has both plan credits and top-up credits
  const showBreakdown = hasVoicePlan && planCredits > 0 && topUpCredits > 0;

  // Listen for credit updates
  useEffect(() => {
    const handleCreditsUpdate = () => {
      console.log(
        "🔄 Credits updated event received, refreshing credit display...",
      );
      mutateCredits();
      // Remove visual animation to prevent green border flash
    };
    window.addEventListener("credits-updated", handleCreditsUpdate);
    return () =>
      window.removeEventListener("credits-updated", handleCreditsUpdate);
  }, [mutateCredits]);

  // No agent or MCP tool mentions - only browser tools
  const toolMentions = useMemo(() => [], []);

  const {
    isListening,
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

  // Track session start and setup credit deduction when session becomes active
  useEffect(() => {
    if (isActive && !sessionStartTime.current) {
      console.log("✅ Voice session active, starting credit tracking...");
      // Start tracking session time
      sessionStartTime.current = Date.now();
      lastCreditDeductionTime.current = Date.now();

      // Start periodic credit deduction (every 15 seconds)
      console.log("⏱️ Starting credit deduction interval...");
      creditDeductionInterval.current = setInterval(() => {
        console.log(
          "🔍 Interval tick - checking if credit deduction needed...",
        );
        if (sessionStartTime.current && lastCreditDeductionTime.current) {
          const now = Date.now();
          const timeSinceLastDeduction = Math.floor(
            (now - lastCreditDeductionTime.current) / 1000,
          );
          console.log(
            `⏰ Time since last deduction: ${timeSinceLastDeduction} seconds`,
          );

          // Deduct credits every 60 seconds (1 minute) for real-time updates
          if (timeSinceLastDeduction >= 60) {
            console.log("💰 60 seconds elapsed, deducting credits now...");
            // Deduct credits in real-time
            fetch("/api/chat/voice-credit-deduct-duration", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                threadId: currentThreadId,
                userAudioDuration: timeSinceLastDeduction / 2,
                botAudioDuration: timeSinceLastDeduction / 2,
              }),
            })
              .then((res) => res.json())
              .then((data) => {
                if (data.success) {
                  console.log(
                    `💰 Real-time deduction: ${data.creditsUsed} credits for ${data.minutesUsed} minute(s). Remaining: ${data.remainingCredits}`,
                  );
                  // Trigger UI update
                  window.dispatchEvent(new Event("credits-updated"));
                  console.log("📢 Dispatched credits-updated event");
                  // Update last deduction time
                  lastCreditDeductionTime.current = now;
                } else {
                  console.error("❌ Credit deduction failed:", data);
                }
              })
              .catch((err) => {
                console.error("❌ Failed to deduct credits:", err);
              });
          }
        }
      }, 15000); // Check every 15 seconds (but only deduct if >= 60 seconds elapsed)
    }

    // Cleanup when session ends
    if (!isActive && creditDeductionInterval.current) {
      console.log("🛑 Session ended, stopping credit deduction interval");
      clearInterval(creditDeductionInterval.current);
      creditDeductionInterval.current = null;
      sessionStartTime.current = null;
      lastCreditDeductionTime.current = null;
    }
  }, [isActive, currentThreadId]);

  const endVoiceChat = useCallback(async () => {
    setIsClosing(true);

    // Clear periodic credit deduction interval
    if (creditDeductionInterval.current) {
      clearInterval(creditDeductionInterval.current);
      creditDeductionInterval.current = null;
    }

    await safe(() => stop());

    // Calculate remaining time since last deduction
    const now = Date.now();
    const remainingSeconds = lastCreditDeductionTime.current
      ? Math.floor((now - lastCreditDeductionTime.current) / 1000)
      : 0;

    // Deduct credits for remaining time (even if less than 30 seconds)
    if (remainingSeconds > 0) {
      try {
        await fetch("/api/chat/voice-credit-deduct-duration", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            threadId: currentThreadId,
            userAudioDuration: remainingSeconds / 2,
            botAudioDuration: remainingSeconds / 2,
          }),
        });
      } catch (error) {
        console.error("Failed to deduct final credits:", error);
      }
    }

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

        // Send session end for mood tracking (credits already deducted in real-time)
        const response = await fetch("/api/chat/voice-session-end", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            threadId: currentThreadId,
            messages: conversationMessages,
            userAudioDuration: 0, // Credits already deducted in real-time
            botAudioDuration: 0, // Credits already deducted in real-time
          }),
        });

        // Trigger final credit display refresh
        if (response.ok) {
          if (typeof window !== "undefined") {
            window.dispatchEvent(new Event("credits-updated"));
          }
        }
      } catch (error) {
        console.error("Failed to track voice session:", error);
      }
    }

    // Reset tracking
    sessionStartTime.current = null;
    lastCreditDeductionTime.current = null;

    setIsClosing(false);
    router.push("/");
  }, [stop, router, messages, currentThreadId]);

  // Cleanup interval when session ends
  useEffect(() => {
    if (!isActive && creditDeductionInterval.current) {
      clearInterval(creditDeductionInterval.current);
      creditDeductionInterval.current = null;
    }
  }, [isActive]);

  // Handle session cleanup when user closes window/tab or navigates away
  useEffect(() => {
    const handleBeforeUnload = async (e: BeforeUnloadEvent) => {
      if (isActive && messages.length > 0) {
        e.preventDefault();

        // Calculate remaining time since last deduction
        const remainingSeconds = lastCreditDeductionTime.current
          ? Math.floor((Date.now() - lastCreditDeductionTime.current) / 1000)
          : 0;

        const conversationMessages = messages
          .map((m) => {
            const textPart = m.parts.find((p) => p.type === "text");
            return {
              role: m.role,
              content: textPart ? (textPart as any).text || "" : "",
            };
          })
          .filter((m) => m.content.trim().length > 0);

        // Send remaining time for final credit deduction
        const data = JSON.stringify({
          threadId: currentThreadId,
          messages: conversationMessages,
          userAudioDuration: remainingSeconds / 2,
          botAudioDuration: remainingSeconds / 2,
        });

        navigator.sendBeacon("/api/chat/voice-session-end", data);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      // Clean up interval on unmount
      if (creditDeductionInterval.current) {
        clearInterval(creditDeductionInterval.current);
      }
    };
  }, [isActive, messages, currentThreadId]);

  return (
    <div className="w-full h-full flex flex-col relative">
      {/* Background */}
      <div className="echonest-gradient-bg"></div>
      {/* Header */}
      <div className="w-full relative z-10">
        {/* Desktop: Single Row */}
        <div className="hidden sm:flex flex-row items-center p-4 md:p-6 gap-2">
          {/* Sidebar Toggle Button */}
          <SidebarTrigger className="flex-shrink-0 text-white hover:text-white/80" />

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
                  <div className="text-sm font-semibold text-white">
                    {selectedTherapist.name}
                  </div>
                  <div className="text-xs text-white/80">
                    {selectedTherapist.specialization} •{" "}
                    {selectedTherapist.language}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm font-medium text-white">
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
                  <SelectTrigger className="h-8 px-3 py-2 text-xs border border-gray-300 bg-white text-black whitespace-nowrap min-w-[120px] min-h-[36px]">
                    <Languages className="h-3.5 w-3.5 mr-1 text-black" />
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
                className="h-8 px-3 py-2 text-xs font-normal whitespace-nowrap min-w-[120px] min-h-[36px] border-gray-300 bg-white text-black"
                onClick={() => router.push("/therapists")}
              >
                <User className="h-3.5 w-3.5 mr-1 text-black" />
                {selectedTherapist ? "Change Therapist" : "Setup Therapist"}
              </Button>
            </div>
          )}

          {/* Credits */}
          {showBreakdown ? (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 h-auto px-2 py-1 transition-all text-white hover:text-white/80"
                >
                  <span className="text-base">🪙</span>
                  <span className="text-sm font-semibold text-white">
                    {totalVoiceCredits}
                  </span>
                  <span className="text-xs text-white">Voice Credits</span>
                  <ChevronDown className="h-3 w-3 text-white" />
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
                    <span className="text-base">🪙</span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {creditStatus?.credits?.subscriptionType ===
                        "voice_only"
                          ? "Voice Only Plan"
                          : "Voice + Chat Plan"}
                      </span>
                      <span className="text-sm font-medium">{planCredits}</span>
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
            <div className="flex items-center gap-2 h-auto px-2 py-1 transition-all text-white">
              <span className="text-base">🪙</span>
              <span className="text-sm font-semibold text-white">
                {totalVoiceCredits}
              </span>
              <span className="text-xs text-white">Voice Credits</span>
            </div>
          )}
        </div>

        {/* Mobile: Stacked Layout */}
        <div className="flex sm:hidden flex-col gap-3 p-3">
          {/* Top Row: Sidebar Toggle + Therapist + Credits */}
          <div className="flex items-center gap-2">
            {/* Sidebar Toggle Button */}
            <SidebarTrigger className="flex-shrink-0 text-white hover:text-white/80" />

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
                <span className="text-sm font-normal truncate text-white">
                  {selectedTherapist.name}
                </span>
              </div>
            )}

            {showBreakdown ? (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-1 h-8 px-2 flex-shrink-0 text-white hover:text-white/80"
                  >
                    <span className="text-sm">🪙</span>
                    <span className="text-sm font-semibold text-white">
                      {totalVoiceCredits}
                    </span>
                    <span className="text-xs text-white">Voice Credits</span>
                    <ChevronDown className="h-3 w-3 text-white" />
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
                      <span className="text-base">🪙</span>
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
              <div className="flex items-center gap-1 h-8 px-2 flex-shrink-0 text-white">
                <span className="text-sm">🪙</span>
                <span className="text-sm font-semibold text-white">
                  {totalVoiceCredits}
                </span>
                <span className="text-xs text-white">Voice Credits</span>
              </div>
            )}
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
                className={`h-8 px-3 py-2 text-xs font-normal whitespace-nowrap min-h-[36px] ${selectedTherapist && availableLanguages.length > 1 ? "flex-1" : "w-full"}`}
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
      <div className="flex-1 min-h-0 mx-auto w-full relative z-10">
        {error ? (
          <div className="max-w-3xl mx-auto p-6">
            <Alert variant={"destructive"}>
              <TriangleAlertIcon className="size-4" />
              <AlertTitle className="text-white">Error</AlertTitle>
              <AlertDescription className="text-white">
                {error.message}
              </AlertDescription>

              <AlertDescription className="my-4">
                <p className="text-white/80">
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
              <div className="animate-in fade-in-50 duration-1000 text-center w-full">
                <div className="mb-8">
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
                    EchoNest AI Therapy
                  </h1>
                  <p className="text-xl md:text-2xl text-white mb-6">
                    Voice-Only Conversation
                  </p>
                </div>

                <div className="max-w-2xl mx-auto">
                  <div className="animate-pulse">
                    <div className="flex items-center justify-center space-x-2 mb-4">
                      <div className="w-3 h-3 bg-white rounded-full animate-bounce"></div>
                      <div
                        className="w-3 h-3 bg-white rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-3 h-3 bg-white rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                    <p className="text-lg text-white">
                      {isActive && isListening
                        ? "Listening... speak naturally"
                        : isActive
                          ? "Voice chat active - click mic to start listening"
                          : ""}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <div
        className={`relative w-full p-6 flex ${isActive ? "flex-row" : "flex-col"} items-center justify-center gap-4 z-10`}
      >
        {/* Low Credits Warning Banner */}
        {!isActive && voiceCreditsTotal > 0 && voiceCreditsTotal < 100 && (
          <div className="max-w-md mx-auto mb-2">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg px-4 py-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  ⚠️ Low voice credits:{" "}
                  <span className="font-bold">{voiceCreditsTotal}</span>{" "}
                  remaining
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs"
                  onClick={() => router.push("/subscription")}
                >
                  Get More
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Out of Credits Warning Banner */}
        {!isActive && !canUseVoice && voiceCreditsTotal === 0 && (
          <div className="max-w-md mx-auto mb-2">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-red-800 dark:text-red-200 font-medium">
                  ❌ Out of voice credits
                </p>
                <Button
                  size="sm"
                  className="text-xs bg-red-600 hover:bg-red-700"
                  onClick={() => router.push("/subscription")}
                >
                  Upgrade Now
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Text above the button */}
        {!isActive && (
          <p className="text-white text-lg mb-2">
            {canUseVoice ? "Start voice chat?" : "Out of credits"}
          </p>
        )}

        {/* Start/Stop Voice Chat Button - Only show when not active */}
        {!isActive && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={"secondary"}
                size={"default"}
                disabled={isClosing || isLoading || !canUseVoice}
                onClick={() => {
                  if (canUseVoice) {
                    startWithSound();
                  } else {
                    router.push("/subscription");
                  }
                }}
                className={cn(
                  "w-12 h-12 p-0 rounded-full flex items-center justify-center transition-colors duration-300",
                  isLoading
                    ? "bg-gray-200 text-gray-600 animate-pulse"
                    : !canUseVoice
                      ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                      : "bg-white text-black hover:bg-gray-100",
                )}
              >
                {isLoading || isClosing ? (
                  <Loader className="size-5 animate-spin" />
                ) : (
                  <PhoneIcon className="size-5 fill-green-600 stroke-green-600 stroke-1" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("VoiceChat.startConversation")}</TooltipContent>
          </Tooltip>
        )}

        {/* Mic Control Button - Only show when active */}
        {isActive && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={"secondary"}
                size={"default"}
                disabled={isLoading || isClosing}
                onClick={() => {
                  if (isListening) {
                    stopListening();
                  } else {
                    startListening();
                  }
                }}
                className={cn(
                  "w-12 h-12 p-0 rounded-full flex items-center justify-center transition-colors duration-300",
                  !isListening
                    ? "bg-red-100 text-red-600 hover:bg-red-200"
                    : isUserSpeaking
                      ? "bg-blue-100 text-blue-600"
                      : "bg-white text-black hover:bg-gray-100",
                )}
              >
                {isListening ? (
                  <MicIcon
                    className={`size-5 ${isUserSpeaking ? "text-primary" : "text-muted-foreground transition-colors duration-300"}`}
                  />
                ) : (
                  <MicOffIcon className="size-5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isListening ? t("VoiceChat.closeMic") : t("VoiceChat.openMic")}
            </TooltipContent>
          </Tooltip>
        )}
        {/* End Conversation Button - Only show when session is active */}
        {isActive && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={"destructive"}
                size={"default"}
                className="rounded-full px-7 py-4 bg-red-600 hover:bg-red-700 text-white font-medium"
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
