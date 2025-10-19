"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface OtpInputProps {
  length?: number;
  onComplete: (otp: string) => void;
  className?: string;
  disabled?: boolean;
}

export function OtpInput({
  length = 6,
  onComplete,
  className,
  disabled = false,
}: OtpInputProps) {
  const [otp, setOtp] = useState<string[]>(new Array(length).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (element: HTMLInputElement, index: number) => {
    if (disabled) return;

    const value = element.value;

    // Only allow single digit
    if (value.length > 1) {
      element.value = value.slice(-1);
    }

    // Only allow digits
    if (!/^\d*$/.test(element.value)) {
      element.value = "";
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);

    // Move to next input if current is filled
    if (element.value && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Check if OTP is complete
    const completeOtp = newOtp.join("");
    if (completeOtp.length === length && !newOtp.includes("")) {
      onComplete(completeOtp);
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number,
  ) => {
    if (disabled) return;

    // Handle backspace
    if (e.key === "Backspace") {
      if (!otp[index] && index > 0) {
        // Move to previous input if current is empty
        inputRefs.current[index - 1]?.focus();
      } else {
        // Clear current input
        const newOtp = [...otp];
        newOtp[index] = "";
        setOtp(newOtp);
      }
    }

    // Handle arrow keys
    if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    if (disabled) return;

    e.preventDefault();
    const pastedData = e.clipboardData.getData("text");

    // Only allow digits
    const digits = pastedData.replace(/\D/g, "").slice(0, length);

    if (digits.length > 0) {
      const newOtp = new Array(length).fill("");
      for (let i = 0; i < digits.length && i < length; i++) {
        newOtp[i] = digits[i];
      }
      setOtp(newOtp);

      // Focus the next empty input or the last one
      const nextEmptyIndex = newOtp.findIndex(
        (digit, index) => !digit && index >= digits.length,
      );
      const focusIndex =
        nextEmptyIndex !== -1
          ? nextEmptyIndex
          : Math.min(digits.length, length - 1);
      inputRefs.current[focusIndex]?.focus();

      // Check if OTP is complete
      if (digits.length === length) {
        onComplete(digits);
      }
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (disabled) return;
    e.target.select();
  };

  // Clear OTP when disabled
  useEffect(() => {
    if (disabled) {
      setOtp(new Array(length).fill(""));
    }
  }, [disabled, length]);

  return (
    <div className={cn("flex gap-3 justify-center", className)}>
      {otp.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(e.target, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={handlePaste}
          onFocus={handleFocus}
          disabled={disabled}
          className={cn(
            "w-12 h-12 text-center text-lg font-semibold border-2 rounded-lg",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
            "transition-all duration-200 ease-in-out",
            "bg-white border-gray-300 text-black",
            "hover:border-gray-400",
            digit && "border-blue-500 bg-blue-50",
            disabled && "opacity-50 cursor-not-allowed",
          )}
          aria-label={`Digit ${index + 1} of verification code`}
        />
      ))}
    </div>
  );
}
