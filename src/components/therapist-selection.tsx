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
import { Volume2, Sparkles } from "lucide-react";
import { useState } from "react";
import { appStore } from "@/app/store";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback } from "ui/avatar";

export function TherapistSelection() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("All");
  const router = useRouter();

  const languages = ["All", ...new Set(THERAPISTS.map((t) => t.language))];

  const filteredTherapists = THERAPISTS.filter((therapist) => {
    const matchesSearch =
      therapist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      therapist.language.toLowerCase().includes(searchQuery.toLowerCase()) ||
      therapist.specialization
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

    const matchesLanguage =
      selectedLanguage === "All" || therapist.language === selectedLanguage;

    return matchesSearch && matchesLanguage;
  });

  const handleSelectTherapist = (therapist: Therapist) => {
    // Store selected therapist in app store
    appStore.setState((state) => ({
      voiceChat: {
        ...state.voiceChat,
        selectedTherapist: therapist,
        isOpen: true,
        options: {
          ...state.voiceChat.options,
          providerOptions: {
            ...state.voiceChat.options.providerOptions,
            voice: therapist.voiceType,
          },
        },
      },
    }));

    // Navigate to home where voice chat will open
    router.push("/");
  };

  const handlePreview = async (therapist: Therapist) => {
    // Optional: Implement voice preview
    console.log("Preview voice for:", therapist.name);
    // You can add a small audio sample or TTS preview here
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <h1 className="text-sm text-primary font-medium">
              EchoNest AI Therapy Platform
            </h1>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold">
            Choose Your AI Therapist
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Connect with an AI therapist who speaks your language and
            understands your needs. Each therapist brings unique cultural
            perspectives and specialized approaches to healing.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
          <input
            type="text"
            placeholder="Search by name, language, or specialization..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-96 px-4 py-2 rounded-lg border bg-background"
          />

          <div className="flex gap-2 flex-wrap justify-center">
            <span className="text-sm text-muted-foreground flex items-center gap-2">
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

        {/* Results Count */}
        <p className="text-center text-sm text-muted-foreground">
          Showing {filteredTherapists.length} of {THERAPISTS.length} therapists
        </p>

        {/* Therapist Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
            <p className="text-muted-foreground">
              No therapists found matching your criteria
            </p>
          </div>
        )}
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
    <Card className="transition-all duration-200 hover:shadow-lg hover:scale-[1.02] cursor-pointer">
      <CardHeader className="text-center pb-3">
        {/* Avatar */}
        <div className="flex justify-center mb-3">
          <div className="relative">
            <Avatar className="h-20 w-20 rounded-full bg-white ring-2 ring-primary/20">
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

      <CardContent className="space-y-3">
        {/* Language Badge */}
        <div className="flex justify-center">
          <Badge variant="outline" className="text-xs">
            {therapist.language}
          </Badge>
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

        {/* Description */}
        <p className="text-xs text-muted-foreground text-center italic">
          💝 {therapist.description}
        </p>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
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
