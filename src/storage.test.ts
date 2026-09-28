import { describe, expect, it } from "vitest";
import { challenges } from "./domain";
import { loadState, saveState, STORAGE_KEY } from "./storage";

const state = {
  config: challenges[0].config,
  alternative: challenges[0].alternative,
  prediction: "Three",
  challengeId: challenges[0].id,
};
const memory = () => {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
};
describe("session persistence", () => {
  it("recovers empty storage and round trips the versioned state", () => {
    const storage = memory();
    expect(loadState(storage).state).toBeNull();
    expect(saveState(storage, state)).toBe("");
    expect(loadState(storage).state).toEqual(state);
    expect(JSON.parse(storage.getItem(STORAGE_KEY)!)).toMatchObject({
      version: 1,
    });
  });
  it("rejects corrupt json, wrong versions and invalid state fields", () => {
    const storage = memory();
    for (const value of [
      "{",
      "null",
      JSON.stringify({ version: 2, state }),
      JSON.stringify({ version: 1, state: {} }),
      JSON.stringify({ version: 1, state: { ...state, prediction: 7 } }),
      JSON.stringify({
        version: 1,
        state: { ...state, challengeId: "unknown" },
      }),
      JSON.stringify({
        version: 1,
        state: { ...state, config: { ...state.config, start: NaN } },
      }),
      JSON.stringify({
        version: 1,
        state: { ...state, prediction: "a".repeat(10001) },
      }),
    ]) {
      storage.setItem(STORAGE_KEY, value);
      expect(loadState(storage)).toMatchObject({
        state: null,
        message: expect.stringMatching(/saved|reset|read/i),
      });
    }
  });
  it("handles browser storage denied or full and refuses invalid saves", () => {
    const broken = {
      getItem() {
        throw new Error("denied");
      },
      setItem() {
        throw new Error("full");
      },
    };
    expect(loadState(broken).message).toMatch(/unavailable/i);
    expect(saveState(broken, state)).toMatch(/saved|storage/i);
    expect(
      saveState(memory(), {
        ...state,
        prediction: null,
      } as unknown as typeof state),
    ).not.toBe("");
  });
});
