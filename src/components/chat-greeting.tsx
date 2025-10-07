"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import {
  checkUserHistoryAction,
  generateNewUserHeaderGreetingAction,
  generateReturningUserHeaderGreetingAction,
} from "@/app/api/chat/actions";
import { Loader } from "lucide-react";

interface ChatGreetingProps {
  threadId?: string;
}

export const ChatGreeting = ({ threadId }: ChatGreetingProps) => {
  const [mounted, setMounted] = useState(false);
  const [greeting, setGreeting] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setMounted(true);

    const fetchGreeting = async () => {
      try {
        setIsLoading(true);

        // Always check for user history, excluding current thread
        const historyResult = await checkUserHistoryAction(threadId);

        if (!historyResult) {
          // Error or not authenticated - use fallback
          setGreeting(
            "Hello, I'm Econest, your AI therapist. How are you feeling today?",
          );
          return;
        }

        let greetingText: string;

        // Always try to use previous conversation context if available
        if (
          historyResult.isReturningUser &&
          historyResult.lastMessages &&
          historyResult.lastMessages.length > 0
        ) {
          // Returning user with previous conversation - ALWAYS reference it
          greetingText = await generateReturningUserHeaderGreetingAction(
            historyResult.lastMessages,
          );
        } else {
          // True first-time user - generate introductory greeting
          greetingText = await generateNewUserHeaderGreetingAction();
        }

        setGreeting(greetingText);
      } catch (error) {
        console.error("Failed to fetch greeting:", error);
        // Fallback greeting on error
        setGreeting(
          "Hello, I'm Econest, your AI therapist. How are you feeling today?",
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchGreeting();
  }, [threadId]);

  // Return null during SSR to prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <motion.div
      key="welcome"
      className="max-w-3xl mx-auto my-4 min-h-20"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ delay: 0.3 }}
    >
      <div className="rounded-xl p-6 flex flex-col gap-2 leading-relaxed text-center">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 text-white">
            <Loader className="h-5 w-5 animate-spin text-white" />
            <span className="text-lg text-white">Loading...</span>
          </div>
        ) : (
          <h1 className="text-xl md:text-2xl text-white font-normal animate-in fade-in duration-500 leading-relaxed">
            {greeting}
          </h1>
        )}
      </div>
    </motion.div>
  );
};
