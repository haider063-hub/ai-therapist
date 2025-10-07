"use client";

import { useEffect } from "react";
import { appStore } from "@/app/store";
import { getTherapistById } from "@/lib/constants/therapists";

export function TherapistLoader() {
  useEffect(() => {
    const loadSavedTherapist = async () => {
      try {
        const response = await fetch("/api/user/select-therapist");

        // Check if response is ok and content type is JSON
        if (
          !response.ok ||
          !response.headers.get("content-type")?.includes("application/json")
        ) {
          // If not authenticated or not JSON response, silently fail
          return;
        }

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
        // Only log errors that aren't related to authentication
        if (
          error instanceof SyntaxError &&
          error.message.includes("<!DOCTYPE")
        ) {
          // This is likely an HTML error page, ignore silently
          return;
        }
        console.error("Error loading saved therapist:", error);
      }
    };

    loadSavedTherapist();
  }, []);

  return null; // This component doesn't render anything
}
