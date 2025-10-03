"use client";

import { useEffect } from "react";
import { appStore } from "@/app/store";
import { getTherapistById } from "@/lib/constants/therapists";

export function TherapistLoader() {
  useEffect(() => {
    const loadSavedTherapist = async () => {
      try {
        const response = await fetch("/api/user/select-therapist");
        const data = await response.json();

        if (data.selectedTherapistId) {
          const therapist = getTherapistById(data.selectedTherapistId);

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
          }
        }
      } catch (error) {
        console.error("Error loading saved therapist:", error);
      }
    };

    loadSavedTherapist();
  }, []);

  return null; // This component doesn't render anything
}
