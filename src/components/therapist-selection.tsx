"use client";

import { THERAPISTS, Therapist } from "@/lib/constants/therapists";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "ui/card";
import { Button } from "ui/button";
import { Badge } from "ui/badge";
import { Volume2 } from "lucide-react";
import { useState } from "react";
import { appStore } from "@/app/store";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "ui/avatar";
import { toast } from "sonner";
import { TherapistSelectionHeader } from "./therapist-selection-header";

export function TherapistSelection() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("All");
  const router = useRouter();

  // Extract individual languages from all therapists
  const languages = [
    "All",
    ...new Set(
      THERAPISTS.flatMap((t) =>
        t.language.split(" • ").map((lang) => lang.trim()),
      ),
    ),
  ].sort((a, b) => {
    if (a === "All") return -1;
    if (b === "All") return 1;
    return a.localeCompare(b);
  });

  const filteredTherapists = THERAPISTS.filter((therapist) => {
    const matchesSearch =
      therapist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      therapist.language.toLowerCase().includes(searchQuery.toLowerCase()) ||
      therapist.specialization
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

    const matchesLanguage =
      selectedLanguage === "All" ||
      therapist.language.includes(selectedLanguage);

    return matchesSearch && matchesLanguage;
  });

  const handleSelectTherapist = async (therapist: Therapist) => {
    // Save to database
    try {
      const response = await fetch("/api/user/select-therapist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ therapistId: therapist.id }),
      });

      if (!response.ok) {
        throw new Error("Failed to save therapist");
      }

      // Store selected therapist in app store
      appStore.setState((state) => ({
        voiceChat: {
          ...state.voiceChat,
          selectedTherapist: therapist,
          options: {
            ...state.voiceChat.options,
            providerOptions: {
              ...state.voiceChat.options.providerOptions,
              voice: therapist.voiceType,
            },
          },
        },
      }));

      toast.success(`Selected ${therapist.name}`);

      // Navigate to voice chat page
      router.push("/voice-chat");
    } catch (error) {
      console.error("Error selecting therapist:", error);
      toast.error("Failed to select therapist");
    }
  };

  const handlePreview = async (therapist: Therapist) => {
    try {
      toast.info(`Playing ${therapist.name}'s voice preview...`);

      // Generate a preview message in therapist's language
      const previewMessages: Record<string, string> = {
        es: "Hola, soy la Dra. Sofia Martinez. Estoy aquí para ayudarte con trauma y ansiedad.",
        ja: "こんにちは、田中由紀です。マインドフルネスとストレス管理をお手伝いします。",
        ar: "مرحباً، أنا الدكتور أحمد الراشد. أنا هنا لمساعدتك في الاكتئاب والعلاقات.",
        fr: "Bonjour, je suis le Dr. Marcel Dubois. Je me spécialise en thérapie existentielle.",
        en: "Hello, I'm Dr. Emma Johnson. I specialize in Cognitive Behavioral Therapy.",
        de: "Guten Tag, ich bin Dr. Hans Mueller. Ich bin spezialisiert auf kognitive Verhaltenstherapie.",
        hi: "नमस्ते, मैं डॉ. प्रिया शर्मा हूँ। मैं समग्र और आध्यात्मिक कल्याण में विशेषज्ञ हूँ।",
        ru: "Здравствуйте, я доктор Елена Волкова. Я специализируюсь на глубинной психологии.",
      };

      const previewText =
        previewMessages[therapist.languageCode] ||
        "Hello, this is a voice preview.";

      // Use browser's Speech Synthesis API for preview
      const utterance = new SpeechSynthesisUtterance(previewText);
      utterance.lang = therapist.languageCode;
      utterance.rate = 0.9;
      // Female voices: shimmer, coral, ballad, sage
      // Male voices: echo, ash, verse, alloy
      const femaleVoices = ["shimmer", "coral", "ballad", "sage"];
      utterance.pitch = femaleVoices.includes(therapist.voiceType) ? 1.2 : 0.85;

      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error("Preview error:", error);
      toast.error("Voice preview not available");
    }
  };

  return (
    <div className="min-h-screen relative">
      <div className="echonest-gradient-bg"></div>
      <div className="relative z-10">
        <TherapistSelectionHeader />
        <div className="flex-1 p-4 sm:p-6 md:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="text-center space-y-3">
              <h2 className="text-3xl sm:text-4xl font-bold text-white">
                Choose Your AI Therapist
              </h2>
              <p className="text-white/80 max-w-2xl mx-auto">
                Connect with an AI therapist who speaks your language and
                understands your needs. Each therapist brings unique cultural
                perspectives and specialized approaches to healing.
              </p>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col gap-4 items-center justify-center">
              <input
                type="text"
                placeholder="Search by name, language, or specialization..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full max-w-2xl px-4 py-2 rounded-lg border bg-white text-black border-black focus:border-black focus:ring-2 focus:ring-blue-200 focus:bg-white"
              />

              <div className="flex gap-2 flex-wrap justify-center items-center">
                <span className="text-sm text-white flex items-center gap-2">
                  🌐 Languages:
                </span>
                {languages.map((lang) => (
                  <Button
                    key={lang}
                    variant={selectedLanguage === lang ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedLanguage(lang)}
                  >
                    {lang}
                  </Button>
                ))}
              </div>
            </div>

            {/* Therapist Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-stretch auto-rows-fr mt-8">
              {filteredTherapists.map((therapist) => (
                <TherapistCard
                  key={therapist.id}
                  therapist={therapist}
                  onSelect={() => handleSelectTherapist(therapist)}
                  onPreview={() => handlePreview(therapist)}
                />
              ))}
            </div>

            {filteredTherapists.length === 0 && (
              <div className="text-center py-12">
                <p className="text-white">
                  No therapists found matching your criteria
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TherapistCard({
  therapist,
  onSelect,
  onPreview,
}: {
  therapist: Therapist;
  onSelect: () => void;
  onPreview: () => void;
}) {
  const getLanguageFlag = (langCode: string) => {
    const flags: Record<string, string> = {
      es: "ES",
      ja: "JP",
      ar: "SA",
      fr: "FR",
      en: "US",
      de: "DE",
      hi: "IN",
      ru: "RU",
    };
    return flags[langCode] || langCode.toUpperCase();
  };

  return (
    <Card className="transition-all duration-200 hover:shadow-lg hover:scale-[1.02] cursor-pointer h-full flex flex-col bg-white">
      <CardHeader className="text-center pb-3 flex-shrink-0">
        {/* Avatar */}
        <div className="flex justify-center mb-3">
          <div className="relative">
            <Avatar className="h-20 w-20 rounded-full bg-white ring-2 ring-primary/20">
              <AvatarImage
                src={therapist.avatar}
                alt={therapist.name}
                className="object-cover"
              />
              <AvatarFallback className="bg-white text-black text-3xl font-bold uppercase">
                {therapist.name.split(" ")[1]?.charAt(0) ||
                  therapist.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <Badge
              variant="secondary"
              className="absolute -bottom-1 -right-1 text-[10px] px-1.5 py-0.5"
            >
              {getLanguageFlag(therapist.languageCode)}
            </Badge>
          </div>
        </div>

        <CardTitle className="text-lg">{therapist.name}</CardTitle>
        <CardDescription className="text-sm">{therapist.title}</CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col justify-between flex-grow">
        {/* Content Group - Takes up flexible space */}
        <div className="space-y-3 flex-grow">
          {/* Language Badges - Show each language on separate line */}
          <div className="flex gap-1.5 justify-center items-center">
            {therapist.language.split(" • ").map((lang, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {lang.trim()}
              </Badge>
            ))}
          </div>

          {/* Specializes in */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground text-center">
              ✨ Specializes in:
            </p>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {therapist.focus.slice(0, 2).map((item, idx) => (
                <span
                  key={idx}
                  className="text-xs bg-secondary px-2 py-0.5 rounded-full"
                >
                  {item}
                </span>
              ))}
              {therapist.focus.length > 2 && (
                <span className="text-xs bg-secondary px-2 py-0.5 rounded-full">
                  +{therapist.focus.length - 2} more
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons - Always at bottom */}
        <div className="flex gap-2 pt-4 flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation();
              onPreview();
            }}
          >
            <Volume2 className="h-3 w-3 mr-1" />
            Preview
          </Button>
          <Button size="sm" className="flex-1" onClick={onSelect}>
            Select Therapist
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
