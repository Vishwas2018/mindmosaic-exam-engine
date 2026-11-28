"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

export type SpeechPermissionState =
  | "idle"
  | "listening"
  | "denied"
  | "no-mic"
  | "unsupported"
  | "error";

interface BrowserSpeechRecognitionAlternative {
  readonly transcript: string;
}

interface BrowserSpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  readonly [index: number]: BrowserSpeechRecognitionAlternative;
}

interface BrowserSpeechRecognitionResultList {
  readonly length: number;
  readonly [index: number]: BrowserSpeechRecognitionResult;
}

interface BrowserSpeechRecognitionEvent {
  readonly resultIndex: number;
  readonly results: BrowserSpeechRecognitionResultList;
}

interface BrowserSpeechRecognitionErrorEvent {
  readonly error: string;
  readonly message?: string;
}

export interface BrowserSpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: BrowserSpeechRecognitionErrorEvent) => void) | null;
  onresult: ((event: BrowserSpeechRecognitionEvent) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

type SpeechRecognitionConstructor = new () => BrowserSpeechRecognitionInstance;

function resolveSpeechRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const win = window as unknown as {
    __MM_UAT_SPEECH_RECOGNITION__?: SpeechRecognitionConstructor;
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return (
    win.__MM_UAT_SPEECH_RECOGNITION__ ??
    win.SpeechRecognition ??
    win.webkitSpeechRecognition ??
    null
  );
}

export interface UseSpeechToTextOptions {
  onFinalTranscript: (transcript: string) => void;
  lang?: string;
}

export interface SpeechToTextController {
  readonly supported: boolean;
  readonly state: SpeechPermissionState;
  readonly interimTranscript: string;
  readonly statusMessage: string | null;
  startListening: () => void;
  stopListening: () => void;
}

const emptySubscribe = () => () => {};

export function useSpeechToText({
  onFinalTranscript,
  lang = "en-AU",
}: UseSpeechToTextOptions): SpeechToTextController {
  const supported = useSyncExternalStore(
    emptySubscribe,
    () => resolveSpeechRecognitionConstructor() !== null,
    () => false,
  );
  const [runtimeState, setState] = useState<Exclude<SpeechPermissionState, "unsupported">>("idle");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const state: SpeechPermissionState = supported ? runtimeState : "unsupported";

  const recognitionRef = useRef<BrowserSpeechRecognitionInstance | null>(null);
  const callbackRef = useRef(onFinalTranscript);
  useEffect(() => {
    callbackRef.current = onFinalTranscript;
  }, [onFinalTranscript]);

  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.abort();
      } catch {
        // Ignore cleanup errors.
      }
      recognitionRef.current = null;
    };
  }, []);

  const stopListening = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch {
      // Ignore if already stopped.
    }
    setInterimTranscript("");
    setState((prev) => (prev === "listening" ? "idle" : prev));
  }, []);

  const startListening = useCallback(() => {
    const Ctor = resolveSpeechRecognitionConstructor();
    if (!Ctor) {
      setStatusMessage(
        "Voice dictation isn't supported in this browser. Type your observation in the notes field below.",
      );
      return;
    }

    try {
      recognitionRef.current?.abort();
    } catch {
      // Ignore stale instance.
    }

    setStatusMessage(null);
    setInterimTranscript("");

    try {
      const instance = new Ctor();
      instance.continuous = true;
      instance.interimResults = true;
      instance.lang = lang;

      instance.onstart = () => {
        setState("listening");
        setStatusMessage("Listening… speak clearly to append to your notes.");
      };

      instance.onresult = (event) => {
        let finalChunk = "";
        let interimChunk = "";
        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          const res = event.results[i];
          const transcript = res?.[0]?.transcript ?? "";
          if (res?.isFinal) {
            finalChunk += transcript;
          } else {
            interimChunk += transcript;
          }
        }
        setInterimTranscript(interimChunk.trim());
        if (finalChunk.trim()) {
          callbackRef.current(finalChunk.trim());
        }
      };

      instance.onerror = (event) => {
        setInterimTranscript("");
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          setState("denied");
          setStatusMessage(
            "Microphone permission is blocked. Allow microphone access in your browser's site settings, or continue typing your notes below.",
          );
          return;
        }
        if (event.error === "audio-capture") {
          setState("no-mic");
          setStatusMessage(
            "No microphone was detected on this device. You can type your observation directly below.",
          );
          return;
        }
        if (event.error === "no-speech") {
          setState("idle");
          setStatusMessage("No speech was detected. Select Dictate to try again, or type below.");
          return;
        }
        if (event.error === "aborted") {
          setState("idle");
          return;
        }
        setState("error");
        setStatusMessage(
          "Voice recognition stopped unexpectedly. Your typed notes are safe — continue typing or try again.",
        );
      };

      instance.onend = () => {
        setInterimTranscript("");
        setState((prev) => (prev === "listening" ? "idle" : prev));
      };

      recognitionRef.current = instance;
      instance.start();
    } catch {
      setState("error");
      setStatusMessage(
        "Could not start microphone dictation in this browser. Please type your observation below.",
      );
    }
  }, [lang]);

  return {
    supported,
    state,
    interimTranscript,
    statusMessage,
    startListening,
    stopListening,
  };
}
