import { beforeEach, describe, expect, it } from "vitest";
import {
  advanceKidStep,
  MAX_SPINS,
  STORAGE_KEY,
  canClaimNightlyReward,
  createInitialSave,
  ensureNightState,
  exportSaveToJson,
  getNightKey,
  importSaveFromJson,
  markKidComplete,
  markNightlyRewardClaimed,
  normalizeSave,
  loadSave,
  refreshSpins,
  saveGame,
  setKidOutfit
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
    expect(save.bedtimeProgress.currentStepIndexByKidId).toEqual({ "kid-pip": 0 });
    expect(save.bedtimeProgress.lastNightKey).toBe(getNightKey(new Date("2026-05-15T12:00:00Z")));
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
      bedtimeProgress: {
        nightlyCompletedKidIds: [],
        currentStepIndexByKidId: { "kid-pip": 0 },
        lastNightKey: null
      },
      spinState: { lastRefillAt: "2026-05-15T12:00:00Z" }
    });

    expect(normalized.spinState.available).toBe(MAX_SPINS);
  });

  it("returns null when there is no stored save", () => {
    expect(loadSave()).toBeNull();
  });

  it("resets nightly progress when a new date starts", () => {
    const save = createInitialSave(new Date("2026-05-15T20:00:00Z"));
    const progressed = advanceKidStep(save, "kid-pip", 7, new Date("2026-05-15T20:10:00Z"));
    const nextNight = ensureNightState(progressed, new Date("2026-05-16T20:00:00Z"));

    expect(nextNight.bedtimeProgress.currentStepIndexByKidId["kid-pip"]).toBe(0);
    expect(nextNight.bedtimeProgress.nightlyCompletedKidIds).toEqual([]);
    expect(nextNight.bedtimeProgress.lastNightKey).toBe("2026-05-16");
  });

  it("can finish all bedtime steps and claim one nightly reward window", () => {
    let save = createInitialSave(new Date("2026-05-15T20:00:00Z"));

    for (let index = 0; index < 7; index += 1) {
      save = advanceKidStep(save, "kid-pip", 7, new Date("2026-05-15T20:00:00Z"));
    }

    expect(save.bedtimeProgress.nightlyCompletedKidIds).toEqual(["kid-pip"]);
    expect(canClaimNightlyReward(save, new Date("2026-05-15T20:00:00Z"))).toBe(true);

    const claimed = markNightlyRewardClaimed(save, new Date("2026-05-15T20:00:00Z"));
    expect(canClaimNightlyReward(claimed, new Date("2026-05-15T20:00:00Z"))).toBe(false);
  });

  it("can mark a kid complete directly", () => {
    const save = createInitialSave(new Date("2026-05-15T20:00:00Z"));
    const completed = markKidComplete(save, "kid-pip", new Date("2026-05-15T20:00:00Z"));

    expect(completed.bedtimeProgress.nightlyCompletedKidIds).toEqual(["kid-pip"]);
  });

  it("can set a selected outfit for a kid", () => {
    const save = createInitialSave(new Date("2026-05-15T20:00:00Z"));
    const updated = setKidOutfit(save, "kid-pip", "outfit-pajamas-stars");

    expect(updated.selectedOutfitByKidId["kid-pip"]).toBe("outfit-pajamas-stars");
  });
});
