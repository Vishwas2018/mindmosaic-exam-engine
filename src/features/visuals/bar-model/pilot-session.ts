import {createStore} from "zustand/vanilla";

export function parsePilotAnswer(value: string): number | null {
  if (!/^\d+$/.test(value.trim())) return null;
  const answer = Number(value.trim());
  return Number.isSafeInteger(answer) ? answer : null;
}

export function scorePilotSession(
  items: readonly {name: string; privateAnswerKey: number}[],
  answers: Readonly<Record<string, number>>,
) {
  const answered = items.filter((item) => answers[item.name] !== undefined).length;
  const correct = items.filter((item) => answers[item.name] === item.privateAnswerKey).length;
  return {answered, correct, incorrect: answered - correct, unanswered: items.length - answered};
}

export function createPilotSessionStore() {
  return createStore<{
    year: 3 | 5 | null;
    index: number;
    answers: Record<string, number>;
    revealed: Record<string, boolean>;
    mode: "practice" | "summary" | "review";
    start: (year: 3 | 5) => void;
    submit: (id: string, value: string) => boolean;
    reveal: (id: string) => void;
    go: (index: number) => void;
    finish: () => void;
    review: (index: number) => void;
    reset: () => void;
  }>((set, get) => ({
    year: null, index: 0, answers: {}, revealed: {}, mode: "practice",
    start: (year) => set({year, index: 0, answers: {}, revealed: {}, mode: "practice"}),
    submit: (id, value) => {
      const answer = parsePilotAnswer(value);
      const state = get();
      if (answer === null || state.mode !== "practice" || state.answers[id] !== undefined) return false;
      set({answers: {...state.answers, [id]: answer}});
      return true;
    },
    reveal: (id) => {
      if (get().answers[id] !== undefined || get().mode === "review") {
        set({revealed: {...get().revealed, [id]: true}});
      }
    },
    go: (index) => set({index: Math.max(0, Math.min(14, index))}),
    finish: () => set({mode: "summary"}),
    review: (index) => set({mode: "review", index: Math.max(0, Math.min(14, index))}),
    reset: () => set({year: null, index: 0, answers: {}, revealed: {}, mode: "practice"}),
  }));
}
