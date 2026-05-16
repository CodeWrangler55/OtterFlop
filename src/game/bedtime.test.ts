import { describe, expect, it } from "vitest";
import { applyNightlyReward, applySpinReward, getRemainingUnlockCounts } from "./bedtime";
import { advanceKidStep, createInitialSave } from "./save-game";

describe("bedtime rewards", () => {
  it("uses the nightly reward to unlock the next kid first", () => {
    let save = createInitialSave(new Date("2026-05-15T20:00:00Z"));

    for (let index = 0; index < 7; index += 1) {
      save = advanceKidStep(save, "kid-pip", 7, new Date("2026-05-15T20:00:00Z"));
    }

    const outcome = applyNightlyReward(save, new Date("2026-05-15T20:00:00Z"));

    expect(outcome.reward).toMatchObject({
      kind: "kid",
      id: "kid-moss",
      source: "bedtime"
    });
    expect(outcome.save.unlockedKidIds).toContain("kid-moss");
  });

  it("uses spins to unlock outfits first", () => {
    const outcome = applySpinReward(createInitialSave(new Date("2026-05-15T20:00:00Z")));

    expect(outcome.reward).toMatchObject({
      kind: "outfit",
      id: "outfit-pajamas-stars",
      source: "spin"
    });
    expect(outcome.save.unlockedOutfitIds).toContain("outfit-pajamas-stars");
    expect(outcome.save.spinState.available).toBe(2);
  });

  it("tracks how many surprises remain", () => {
    const remaining = getRemainingUnlockCounts(createInitialSave(new Date("2026-05-15T20:00:00Z")));

    expect(remaining).toEqual({
      kids: 3,
      outfits: 7
    });
  });

  it("returns no spin reward when no spins remain", () => {
    const save = createInitialSave(new Date("2026-05-15T20:00:00Z"));
    save.spinState.available = 0;

    const outcome = applySpinReward(save);

    expect(outcome.reward).toBeNull();
    expect(outcome.save.spinState.available).toBe(0);
  });

  it("uses spins to unlock a kid after every outfit is already unlocked", () => {
    const save = createInitialSave(new Date("2026-05-15T20:00:00Z"));
    save.unlockedOutfitIds = [
      "outfit-pajamas-moon",
      "outfit-pajamas-stars",
      "outfit-nightgown-cloud",
      "outfit-sweater-sunset",
      "outfit-hat-nightcap",
      "outfit-hat-bow",
      "outfit-accessory-plush-fish",
      "outfit-accessory-shell-necklace"
    ];

    const outcome = applySpinReward(save);

    expect(outcome.reward).toMatchObject({
      kind: "kid",
      id: "kid-moss",
      source: "spin"
    });
  });

  it("returns no nightly reward when nothing is claimable", () => {
    const outcome = applyNightlyReward(createInitialSave(new Date("2026-05-15T20:00:00Z")));

    expect(outcome.reward).toBeNull();
  });

  it("uses the nightly reward to unlock an outfit after every kid is unlocked", () => {
    let save = createInitialSave(new Date("2026-05-15T20:00:00Z"));
    save.unlockedKidIds = ["kid-pip", "kid-moss", "kid-bubble", "kid-ember"];
    save.bedtimeOrderKidIds = ["kid-pip", "kid-moss", "kid-bubble", "kid-ember"];
    save.bedtimeProgress.currentStepIndexByKidId = {
      "kid-pip": 7,
      "kid-moss": 7,
      "kid-bubble": 7,
      "kid-ember": 7
    };
    save.bedtimeProgress.nightlyCompletedKidIds = ["kid-pip", "kid-moss", "kid-bubble", "kid-ember"];

    const outcome = applyNightlyReward(save, new Date("2026-05-15T20:00:00Z"));

    expect(outcome.reward).toMatchObject({
      kind: "outfit",
      id: "outfit-pajamas-stars",
      source: "bedtime"
    });
  });

  it("returns no spin reward after everything is already unlocked", () => {
    const save = createInitialSave(new Date("2026-05-15T20:00:00Z"));
    save.unlockedKidIds = ["kid-pip", "kid-moss", "kid-bubble", "kid-ember"];
    save.unlockedOutfitIds = [
      "outfit-pajamas-moon",
      "outfit-pajamas-stars",
      "outfit-nightgown-cloud",
      "outfit-sweater-sunset",
      "outfit-hat-nightcap",
      "outfit-hat-bow",
      "outfit-accessory-plush-fish",
      "outfit-accessory-shell-necklace"
    ];

    const outcome = applySpinReward(save);

    expect(outcome.reward).toBeNull();
    expect(outcome.save.spinState.available).toBe(2);
  });
});
