"use client";

import { useEffect } from "react";
import { appStore } from "@/app/store";
import { getTherapistById } from "@/lib/constants/therapists";

export function TherapistLoader() {
  useEffect(() => {
    const loadSavedTherapist = async () => {
      try {
        console.log(
          "🔄 TherapistLoader: Loading saved therapist from database...",
        );
        const response = await fetch("/api/user/select-therapist");
        const data = await response.json();
        console.log("📥 TherapistLoader: Database response:", data);

        if (data.selectedTherapistId) {
          const therapist = getTherapistById(data.selectedTherapistId);
          console.log("🎯 TherapistLoader: Found therapist:", therapist?.name);

          if (therapist) {
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
            console.log(
              "✅ TherapistLoader: Therapist loaded into store successfully",
            );
          }
        } else {
          console.log("ℹ️ TherapistLoader: No therapist selected in database");
        }
      } catch (error) {
        console.error(
          "❌ TherapistLoader: Error loading saved therapist:",
          error,
        );
      }
    };

    loadSavedTherapist();
  }, []);

  return null; // This component doesn't render anything
}
