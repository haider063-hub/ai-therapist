import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";

export interface CreditStatus {
  user: {
    subscriptionType: string;
    subscriptionStatus: string;
    subscriptionEndDate: string | null;
  };
  credits: {
    current: number;
    chatCredits: number;
    voiceCredits: number;
    chatCreditsFromTopup: number;
    voiceCreditsFromTopup: number;
  };
  features: {
    canUseChat: boolean;
    canUseVoice: boolean;
  };
  plans: Array<{
    id: string;
    name: string;
    price: number;
    features: string[];
    unlimitedChat: boolean;
    unlimitedVoice: boolean;
    dailyVoiceCredits: number;
    monthlyVoiceCredits: number;
  }>;
  recentTransactions: Array<{
    id: string;
    type: string;
    amount: number;
    creditsAdded: number;
    status: string;
    createdAt: string;
    metadata: any;
  }>;
}

export interface UseCreditStatusResult {
  creditStatus: CreditStatus | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook for fetching and managing credit status
 * Provides automatic refresh on route changes and credit update events
 */
export function useCreditStatus(): UseCreditStatusResult {
  const [creditStatus, setCreditStatus] = useState<CreditStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pathname = usePathname();

  const fetchCreditStatus = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch("/api/stripe/get-subscription-status");

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setCreditStatus(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch credit status";
      setError(errorMessage);
      console.error("Failed to fetch credit status:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchCreditStatus();
  }, [fetchCreditStatus]);

  // Refresh on route changes
  useEffect(() => {
    if (pathname) {
      fetchCreditStatus();
    }
  }, [pathname, fetchCreditStatus]);

  // Listen for credit update events
  useEffect(() => {
    const handleCreditUpdate = () => {
      fetchCreditStatus();
    };

    window.addEventListener("credits-updated", handleCreditUpdate);

    return () => {
      window.removeEventListener("credits-updated", handleCreditUpdate);
    };
  }, [fetchCreditStatus]);

  return {
    creditStatus,
    loading,
    error,
    refetch: fetchCreditStatus,
  };
}
