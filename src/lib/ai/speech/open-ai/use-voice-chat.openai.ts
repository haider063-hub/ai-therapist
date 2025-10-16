"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  DEFAULT_VOICE_TOOLS,
  UIMessageWithCompleted,
  VoiceChatOptions,
  VoiceChatSession,
} from "..";
import { generateUUID } from "lib/utils";
import { TextPart, ToolUIPart } from "ai";
import {
  OpenAIRealtimeServerEvent,
  OpenAIRealtimeSession,
} from "./openai-realtime-event";

import { useTheme } from "next-themes";
import { appStore } from "@/app/store";

export const OPENAI_VOICE = {
  Alloy: "alloy",
  Ballad: "ballad",
  Sage: "sage",
  Shimmer: "shimmer",
  Verse: "verse",
  Echo: "echo",
  Coral: "coral",
  Ash: "ash",
};

type Content =
  | {
      type: "text";
      text: string;
    }
  | {
      type: "tool-invocation";
      name: string;
      arguments: any;
      state: "call" | "result";
      toolCallId: string;
      result?: any;
    };

const createUIPart = (content: Content): TextPart | ToolUIPart => {
  if (content.type == "tool-invocation") {
    const part: ToolUIPart = {
      type: `tool-${content.name}`,
      input: content.arguments,
      state: "output-available",
      toolCallId: content.toolCallId,
      output: content.result,
    };
    return part;
  }
  return {
    type: "text",
    text: content.text,
  };
};

const createUIMessage = (m: {
  id?: string;
  role: "user" | "assistant";
  content: Content;
  completed?: boolean;
}): UIMessageWithCompleted => {
  const id = m.id ?? generateUUID();
  return {
    id,
    role: m.role,
    parts: [createUIPart(m.content)],
    completed: m.completed ?? false,
  };
};

export function useOpenAIVoiceChat(props?: VoiceChatOptions): VoiceChatSession {
  const { model = "gpt-4o-realtime-preview", voice = OPENAI_VOICE.Ash } =
    props || {};

  // Make selectedLanguage reactive to props changes
  const selectedLanguage = props?.selectedLanguage || "en";

  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [isAssistantSpeaking, setIsAssistantSpeaking] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [messages, setMessages] = useState<UIMessageWithCompleted[]>([]);
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const dataChannel = useRef<RTCDataChannel | null>(null);
  const audioElement = useRef<HTMLAudioElement | null>(null);
  const audioStream = useRef<MediaStream | null>(null);

  const { setTheme } = useTheme();
  const tracks = useRef<RTCRtpSender[]>([]);

  const startListening = useCallback(async () => {
    try {
      if (!audioStream.current) {
        audioStream.current = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
      }
      if (tracks.current.length) {
        const micTrack = audioStream.current.getAudioTracks()[0];
        tracks.current.forEach((sender) => {
          sender.replaceTrack(micTrack);
        });
      }
      setIsListening(true);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  }, []);

  const stopListening = useCallback(async () => {
    try {
      if (audioStream.current) {
        audioStream.current.getTracks().forEach((track) => track.stop());
        audioStream.current = null;
      }
      if (tracks.current.length) {
        const placeholderTrack = createEmptyAudioTrack();
        tracks.current.forEach((sender) => {
          sender.replaceTrack(placeholderTrack);
        });
      }
      setIsListening(false);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  }, []);

  const greetingRef = useRef<string | null>(null);

  const createSession =
    useCallback(async (): Promise<OpenAIRealtimeSession> => {
      const requestBody = {
        model,
        voice,
        agentId: props?.agentId,
        mentions: props?.toolMentions,
        currentThreadId: props?.currentThreadId,
        therapist: props?.selectedTherapist,
        selectedLanguage: selectedLanguage,
      };

      const response = await fetch(
        `/api/chat/openai-realtime?model=${model}&voice=${voice}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        },
      );
      if (response.status !== 200) {
        throw new Error(await response.text());
      }
      const session = await response.json();
      if (session.error) {
        throw new Error(session.error.message);
      }

      // Store greeting for later use (make sure to preserve it)
      if (session.greeting) {
        greetingRef.current = session.greeting;
      }

      // Notify credit display to refresh
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("credits-updated"));
      }

      return session;
    }, [
      model,
      voice,
      props?.toolMentions,
      props?.agentId,
      props?.currentThreadId,
      props?.selectedTherapist,
      selectedLanguage,
    ]);

  const updateUIMessage = useCallback(
    (
      id: string,
      action:
        | Partial<UIMessageWithCompleted>
        | ((
            message: UIMessageWithCompleted,
          ) => Partial<UIMessageWithCompleted>),
    ) => {
      setMessages((prev) => {
        if (prev.length) {
          const lastMessage = prev.find((m) => m.id == id);
          if (!lastMessage) return prev;
          const nextMessage =
            typeof action === "function" ? action(lastMessage) : action;
          if (lastMessage == nextMessage) return prev;
          return prev.map((m) => (m.id == id ? { ...m, ...nextMessage } : m));
        }
        return prev;
      });
    },
    [],
  );

  const clientFunctionCall = useCallback(
    async ({
      callId,
      toolName,
      args,
      id,
    }: { callId: string; toolName: string; args: string; id: string }) => {
      let toolResult: any = "success";

      // Stop listening only once
      stopListening();
      const toolArgs = JSON.parse(args);

      if (DEFAULT_VOICE_TOOLS.some((t) => t.name === toolName)) {
        switch (toolName) {
          case "changeBrowserTheme":
            setTheme(toolArgs?.theme);
            break;
          case "endConversation":
            // Clean shutdown without duplicate stopListening
            if (dataChannel.current) {
              dataChannel.current.close();
              dataChannel.current = null;
            }
            if (peerConnection.current) {
              peerConnection.current.close();
              peerConnection.current = null;
            }
            tracks.current = [];
            setIsActive(false);
            setIsListening(false);
            setIsLoading(false);
            setError(null);
            setMessages([]);
            appStore.setState((prev) => ({
              voiceChat: {
                ...prev.voiceChat,
                agentId: undefined,
                isOpen: false,
              },
            }));
            return; // Exit early for endConversation
        }
      } else {
        // MCP tools removed - only default tools supported
        toolResult = "Tool not supported";
      }

      // Resume listening after tool execution
      startListening();
      const resultText = JSON.stringify(toolResult).trim();

      const event = {
        type: "conversation.item.create",
        previous_item_id: id,
        item: {
          type: "function_call_output",
          call_id: callId,
          output: resultText.slice(0, 15000),
        },
      };

      updateUIMessage(id, (prev) => {
        const prevPart = prev.parts.find((p) => p.type == `tool-${toolName}`);
        if (!prevPart) return prev;
        const part: ToolUIPart = {
          state: "output-available",
          output: toolResult,
          toolCallId: callId,
          input: toolArgs,
          type: `tool-${toolName}`,
        };
        return {
          parts: [part],
        };
      });

      dataChannel.current?.send(JSON.stringify(event));

      dataChannel.current?.send(JSON.stringify({ type: "response.create" }));
      dataChannel.current?.send(JSON.stringify({ type: "response.create" }));
    },
    [updateUIMessage],
  );

  const handleServerEvent = useCallback(
    (event: OpenAIRealtimeServerEvent) => {
      switch (event.type) {
        case "input_audio_buffer.speech_started": {
          const message = createUIMessage({
            role: "user",
            id: event.item_id,
            content: {
              type: "text",
              text: "",
            },
          });
          setIsUserSpeaking(true);
          setMessages((prev) => [...prev, message]);
          break;
        }
        case "input_audio_buffer.committed": {
          updateUIMessage(event.item_id, {
            parts: [
              {
                type: "text",
                text: "",
              },
            ],
            completed: true,
          });
          break;
        }
        case "conversation.item.input_audio_transcription.completed": {
          const transcript = event.transcript || "...speaking";

          updateUIMessage(event.item_id, {
            parts: [
              {
                type: "text",
                text: transcript,
              },
            ],
            completed: true,
          });

          // Deduct credits only when user actually speaks (not just for staying on page)
          if (
            transcript &&
            transcript.trim().length > 0 &&
            transcript !== "...speaking"
          ) {
            fetch("/api/chat/voice-credit-deduct", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                threadId: props?.currentThreadId,
              }),
            })
              .then((res) => res.json())
              .then((data) => {
                if (data.success) {
                  // Trigger UI update
                  window.dispatchEvent(new Event("credits-updated"));
                } else {
                  console.error("❌ Credit deduction failed:", data);
                }
              })
              .catch((err) => {
                console.error("❌ Failed to deduct credits:", err);
              });
          }
          break;
        }
        case "response.audio_transcript.delta": {
          setIsAssistantSpeaking(true);
          setMessages((prev) => {
            const message = prev.findLast((m) => m.id == event.item_id)!;
            if (message) {
              return prev.map((m) =>
                m.id == event.item_id
                  ? {
                      ...m,
                      parts: [
                        {
                          type: "text",
                          text:
                            (message.parts[0] as TextPart).text! + event.delta,
                        },
                      ],
                    }
                  : m,
              );
            }
            return [
              ...prev,
              createUIMessage({
                role: "assistant",
                id: event.item_id,
                content: {
                  type: "text",
                  text: event.delta,
                },
                completed: true,
              }),
            ];
          });
          break;
        }
        case "response.audio_transcript.done": {
          updateUIMessage(event.item_id, (prev) => {
            const textPart = prev.parts.find((p) => p.type == "text");
            if (!textPart) return prev;
            (textPart as TextPart).text = event.transcript || "";
            return {
              ...prev,
              completed: true,
            };
          });

          // Credits are deducted when user speaks, not when assistant responds
          // (See conversation.item.input_audio_transcription.completed event)

          break;
        }
        case "response.function_call_arguments.done": {
          const message = createUIMessage({
            role: "assistant",
            id: event.item_id,
            content: {
              type: "tool-invocation",
              name: event.name,
              arguments: JSON.parse(event.arguments),
              state: "call",
              toolCallId: event.call_id,
            },
            completed: true,
          });
          setMessages((prev) => [...prev, message]);
          clientFunctionCall({
            callId: event.call_id,
            toolName: event.name,
            args: event.arguments,
            id: event.item_id,
          });
          break;
        }
        case "input_audio_buffer.speech_stopped": {
          setIsUserSpeaking(false);
          break;
        }
        case "output_audio_buffer.stopped": {
          setIsAssistantSpeaking(false);
          break;
        }
      }
    },
    [clientFunctionCall, updateUIMessage],
  );

  const start = useCallback(async () => {
    if (isActive || isLoading) return;
    setIsLoading(true);
    setError(null);
    setMessages([]);
    try {
      const session = await createSession();
      const sessionToken = session.client_secret.value;
      const pc = new RTCPeerConnection();
      if (!audioElement.current) {
        audioElement.current = document.createElement("audio");
      }
      audioElement.current.autoplay = true;
      pc.ontrack = (e) => {
        if (audioElement.current) {
          audioElement.current.srcObject = e.streams[0];
        }
      };
      if (!audioStream.current) {
        audioStream.current = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
      }
      tracks.current = [];
      audioStream.current.getTracks().forEach((track) => {
        const sender = pc.addTrack(track, audioStream.current!);
        if (sender) tracks.current.push(sender);
      });

      const dc = pc.createDataChannel("oai-events");
      dataChannel.current = dc;
      dc.addEventListener("message", async (e) => {
        try {
          const event = JSON.parse(e.data) as OpenAIRealtimeServerEvent;
          handleServerEvent(event);
        } catch (err) {
          console.error({
            data: e.data,
            error: err,
          });
        }
      });
      dc.addEventListener("open", () => {
        setIsActive(true);
        setIsListening(true);
        setIsLoading(false);

        // Send greeting message if available - capture immediately in closure
        const greetingToSend = greetingRef.current;

        if (greetingToSend && dc.readyState === "open") {
          // Wait for connection to fully stabilize, then send greeting
          setTimeout(() => {
            if (dc.readyState === "open") {
              try {
                // Use response.create with instructions to speak the greeting
                dc.send(
                  JSON.stringify({
                    type: "response.create",
                    response: {
                      modalities: ["audio", "text"],
                      instructions: `You are Econest, an AI therapist. Please say the following greeting warmly and naturally: "${greetingToSend}"`,
                    },
                  }),
                );
              } catch (err) {
                console.error("Error sending voice greeting:", err);
              }

              greetingRef.current = null;
            }
          }, 800);
        }
      });
      dc.addEventListener("close", () => {
        setIsActive(false);
        setIsListening(false);
        setIsLoading(false);
      });
      dc.addEventListener("error", (errorEvent) => {
        console.error(errorEvent);
        setError(
          errorEvent instanceof Error
            ? errorEvent
            : new Error(String(errorEvent)),
        );
        setIsActive(false);
        setIsListening(false);
      });
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      const sdpResponse = await fetch(`https://api.openai.com/v1/realtime`, {
        method: "POST",
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${sessionToken}`,
          "Content-Type": "application/sdp",
        },
      });
      const answer: RTCSessionDescriptionInit = {
        type: "answer",
        sdp: await sdpResponse.text(),
      };
      await pc.setRemoteDescription(answer);
      peerConnection.current = pc;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setIsActive(false);
      setIsListening(false);
      setIsLoading(false);
    }
  }, [isActive, isLoading, createSession, voice]);

  const stop = useCallback(async () => {
    try {
      if (dataChannel.current) {
        dataChannel.current.close();
        dataChannel.current = null;
      }
      if (peerConnection.current) {
        peerConnection.current.close();
        peerConnection.current = null;
      }
      tracks.current = [];
      stopListening();
      setIsActive(false);
      setIsListening(false);
      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  }, [stopListening, setError, setIsActive, setIsListening, setIsLoading]);

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  function createEmptyAudioTrack(): MediaStreamTrack {
    const audioContext = new AudioContext();
    const destination = audioContext.createMediaStreamDestination();
    return destination.stream.getAudioTracks()[0];
  }

  return {
    isActive,
    isUserSpeaking,
    isAssistantSpeaking,
    isListening,
    isLoading,
    error,
    messages,
    start,
    stop,
    startListening,
    stopListening,
  };
}
