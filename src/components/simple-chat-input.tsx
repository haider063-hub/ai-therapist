"use client";

import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
} from "react";
import { Textarea } from "ui/textarea";
import { cn } from "lib/utils";

interface SimpleChatInputProps {
  input: string;
  onChange: (value: string) => void;
  onChangeMention?: (value: string) => void;
  onEnter: () => void;
  placeholder?: string;
  disabledMention?: boolean;
  onFocus?: () => void;
  disabled?: boolean;
}

export interface SimpleChatInputRef {
  focus: () => void;
  commands?: {
    focus: () => void;
  };
}

const SimpleChatInput = forwardRef<SimpleChatInputRef, SimpleChatInputProps>(
  (
    {
      input,
      onChange,
      onChangeMention,
      onEnter,
      placeholder,
      onFocus,
      disabled,
    },
    ref,
  ) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useImperativeHandle(ref, () => ({
      focus: () => {
        textareaRef.current?.focus();
      },
      commands: {
        focus: () => {
          textareaRef.current?.focus();
        },
      },
    }));

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          onEnter();
        }
      },
      [onEnter],
    );

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        onChange(value);
        onChangeMention?.(value);
      },
      [onChange, onChangeMention],
    );

    return (
      <Textarea
        ref={textareaRef}
        value={input}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={onFocus}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          "min-h-[40px] max-h-[200px] resize-none border-0 bg-transparent p-0 text-sm",
          "focus-visible:ring-0 focus-visible:ring-offset-0",
          "placeholder:text-muted-foreground",
        )}
        rows={1}
      />
    );
  },
);

SimpleChatInput.displayName = "SimpleChatInput";

export default SimpleChatInput;
