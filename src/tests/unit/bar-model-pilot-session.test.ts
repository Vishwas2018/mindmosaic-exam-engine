import {describe, expect, it} from "vitest";
import {createPilotSessionStore, parsePilotAnswer, scorePilotSession} from "@/features/visuals/bar-model/pilot-session";

describe("pilot session scoring and state", () => {
  it("rejects blanks, negatives, decimals, exponents and unsafe integers; accepts zero", () => {
    for (const value of ["", " ", "-1", "1.5", "2e1", "NaN", "Infinity", "9007199254740992"]) expect(parsePilotAnswer(value)).toBeNull();
    expect(parsePilotAnswer(" 0 ")).toBe(0);
    expect(parsePilotAnswer("022")).toBe(22);
  });
  it("distinguishes correct, incorrect and unanswered including a zero answer", () => {
    expect(scorePilotSession([{name: "a", privateAnswerKey: 0}, {name: "b", privateAnswerKey: 2}, {name: "c", privateAnswerKey: 3}], {a: 0, b: 4}))
      .toEqual({answered: 2, correct: 1, incorrect: 1, unanswered: 1});
  });
  it("locks submissions, gates reveal, preserves answers through review and resets on year change", () => {
    const store = createPilotSessionStore();
    store.getState().start(3);
    store.getState().reveal("a");
    expect(store.getState().revealed).toEqual({});
    expect(store.getState().submit("a", "")).toBe(false);
    expect(store.getState().submit("a", "0")).toBe(true);
    expect(store.getState().submit("a", "22")).toBe(false);
    store.getState().reveal("a");
    store.getState().finish();
    store.getState().review(0);
    expect(store.getState().submit("b", "22")).toBe(false);
    expect(store.getState().answers).toEqual({a: 0});
    expect(store.getState().revealed.a).toBe(true);
    store.getState().start(5);
    expect(store.getState()).toMatchObject({year: 5, index: 0, mode: "practice", answers: {}, revealed: {}});
  });
});
