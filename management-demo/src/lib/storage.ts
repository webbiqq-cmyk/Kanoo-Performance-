import type { AppState } from "./types";
import { buildInitialState } from "./seed";

const STORAGE_KEY = "kanoo.management-demo.v1";
const CURRENT_VERSION = 1;

export function loadState(): AppState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return buildInitialState();
    const parsed = JSON.parse(raw) as AppState;
    if (!parsed || typeof parsed !== "object" || parsed.version !== CURRENT_VERSION) {
      return buildInitialState();
    }
    if (!Array.isArray(parsed.vehicles) || !Array.isArray(parsed.jobs) || !Array.isArray(parsed.bays)) {
      return buildInitialState();
    }
    return parsed;
  } catch {
    return buildInitialState();
  }
}

export function saveState(state: AppState): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // storage unavailable (private mode / quota) — demo continues in-memory
  }
}

export function resetState(): AppState {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  return buildInitialState();
}
