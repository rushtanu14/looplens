import { challenges, validateConfig, type Config } from "./domain";

export const STORAGE_KEY = "looplens.session.v1";
export type SavedState = {
  config: Config;
  alternative: Config;
  prediction: string;
  challengeId: string;
};
type StorageLike = Pick<Storage, "getItem" | "setItem">;

function isState(value: unknown): value is SavedState {
  if (!value || typeof value !== "object") return false;
  const state = value as Record<string, unknown>;
  return (
    validateConfig(state.config) === null &&
    validateConfig(state.alternative) === null &&
    typeof state.prediction === "string" &&
    state.prediction.length <= 10_000 &&
    typeof state.challengeId === "string" &&
    (state.challengeId === "custom" ||
      challenges.some((challenge) => challenge.id === state.challengeId))
  );
}

export function loadState(storage: StorageLike): {
  state: SavedState | null;
  message: string;
} {
  let raw: string | null;
  try {
    raw = storage.getItem(STORAGE_KEY);
  } catch {
    return {
      state: null,
      message:
        "Browser storage is unavailable. You can still explore and export a receipt.",
    };
  }
  if (raw === null) return { state: null, message: "" };
  try {
    const envelope: unknown = JSON.parse(raw);
    if (
      typeof envelope === "object" &&
      envelope !== null &&
      "version" in envelope &&
      envelope.version === 1 &&
      "state" in envelope &&
      isState(envelope.state)
    ) {
      return { state: envelope.state, message: "" };
    }
  } catch {
    /* Invalid JSON follows the same recovery path as an invalid schema. */
  }
  return {
    state: null,
    message:
      "Saved session could not be read. A fresh workspace is shown; editing or resetting replaces the damaged save.",
  };
}

export function saveState(storage: StorageLike, state: SavedState): string {
  if (!isState(state))
    return "This session could not be saved because some values are invalid.";
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, state }));
    return "";
  } catch {
    return "Session could not be saved to browser storage. Export a receipt to keep your work.";
  }
}
