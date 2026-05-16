import { beforeEach, describe, expect, it } from "vitest";
import {
  MAX_SPINS,
  STORAGE_KEY,
  createInitialSave,
  exportSaveToJson,
  importSaveFromJson,
  normalizeSave,
  loadSave,
  refreshSpins,
  saveGame
} from "./save-game";

describe("save-game", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("creates a starter save", () => {
    const save = createInitialSave(new Date("2026-05-15T12:00:00Z"));

    expect(save.unlockedKidIds).toEqual(["kid-pip"]);
    expect(save.unlockedOutfitIds).toEqual(["outfit-pajamas-moon"]);
    expect(save.spinState.available).toBe(MAX_SPINS);
  });

  it("refreshes spins up to the cap", () => {
    const save = createInitialSave(new Date("2026-05-15T10:00:00Z"));
    save.spinState.available = 1;

    const refreshed = refreshSpins(save, new Date("2026-05-15T13:15:00Z"));

    expect(refreshed.spinState.available).toBe(MAX_SPINS);
  });

  it("keeps the same save when no refill window has passed", () => {
    const save = createInitialSave(new Date("2026-05-15T10:00:00Z"));
    save.spinState.available = 2;

    const refreshed = refreshSpins(save, new Date("2026-05-15T10:20:00Z"));

    expect(refreshed).toBe(save);
  });

  it("saves and loads from local storage", () => {
    const save = createInitialSave();
    saveGame(save);

    expect(localStorage.getItem(STORAGE_KEY)).toBeTruthy();
    expect(loadSave()).toEqual(save);
  });

  it("exports and re-imports a save payload", () => {
    const save = createInitialSave();
    const exported = exportSaveToJson(save);
    const imported = importSaveFromJson(exported);

    expect(imported).toEqual(save);
  });

  it("normalizes invalid imported ids back to safe defaults", () => {
    const imported = importSaveFromJson(
      JSON.stringify({
        unlockedKidIds: ["kid-unknown"],
        unlockedOutfitIds: ["outfit-unknown"],
        bedtimeOrderKidIds: [],
        bedtimeProgress: { nightlyCompletedKidIds: ["kid-unknown"], lastNightKey: null },
        spinState: { available: 99, lastRefillAt: "2026-05-15T12:00:00Z" }
      })
    );

    expect(imported.unlockedKidIds).toEqual(["kid-pip"]);
    expect(imported.unlockedOutfitIds).toEqual(["outfit-pajamas-moon"]);
    expect(imported.spinState.available).toBe(MAX_SPINS);
  });

  it("normalizes non-object payloads back to an initial save", () => {
    const normalized = normalizeSave(null, new Date("2026-05-15T12:00:00Z"));

    expect(normalized.unlockedKidIds).toEqual(["kid-pip"]);
    expect(normalized.spinState.available).toBe(MAX_SPINS);
  });

  it("defaults spin count when the imported value is missing", () => {
    const normalized = normalizeSave({
      unlockedKidIds: ["kid-pip"],
      unlockedOutfitIds: ["outfit-pajamas-moon"],
      bedtimeOrderKidIds: ["kid-pip"],
      bedtimeProgress: { nightlyCompletedKidIds: [], lastNightKey: null },
      spinState: { lastRefillAt: "2026-05-15T12:00:00Z" }
    });

    expect(normalized.spinState.available).toBe(MAX_SPINS);
  });

  it("returns null when there is no stored save", () => {
    expect(loadSave()).toBeNull();
  });
});
