import {
  MAX_ACTIVE_KIDS,
  bedtimeSteps,
  kids,
  outfits,
  starterOutfitId
} from "./content";
import {
  GameSave,
  canClaimNightlyReward,
  markNightlyRewardClaimed,
  spendSpin
} from "./save-game";

export type UnlockKind = "kid" | "outfit";

export type UnlockReward = {
  kind: UnlockKind;
  id: string;
  displayName: string;
  source: "spin" | "bedtime";
};

export const totalBedtimeSteps = bedtimeSteps.length;

export function getUnlockedKids(save: GameSave) {
  const allowed = new Set(save.unlockedKidIds);
  return kids.filter((kid) => allowed.has(kid.id));
}

export function getUnlockedOutfits(save: GameSave) {
  const allowed = new Set(save.unlockedOutfitIds);
  return outfits.filter((outfit) => allowed.has(outfit.id));
}

export function getCurrentStepIndex(save: GameSave, kidId: string): number {
  return save.bedtimeProgress.currentStepIndexByKidId[kidId] ?? 0;
}

export function getCurrentStep(save: GameSave, kidId: string) {
  return bedtimeSteps[Math.min(getCurrentStepIndex(save, kidId), bedtimeSteps.length - 1)];
}

export function getNextKidToPlay(save: GameSave): string | null {
  return (
    save.bedtimeOrderKidIds.find(
      (kidId) => !save.bedtimeProgress.nightlyCompletedKidIds.includes(kidId)
    ) ?? null
  );
}

export function isNightComplete(save: GameSave): boolean {
  return (
    save.bedtimeOrderKidIds.length > 0 &&
    save.bedtimeProgress.nightlyCompletedKidIds.length === save.bedtimeOrderKidIds.length
  );
}

export function getRemainingUnlockCounts(save: GameSave) {
  return {
    kids: kids.filter((kid) => !save.unlockedKidIds.includes(kid.id)).length,
    outfits: outfits.filter((outfit) => !save.unlockedOutfitIds.includes(outfit.id)).length
  };
}

export function hasAnyUnlocksRemaining(save: GameSave): boolean {
  const remaining = getRemainingUnlockCounts(save);
  return remaining.kids + remaining.outfits > 0;
}

function unlockKid(save: GameSave, kidId: string): GameSave {
  if (save.unlockedKidIds.includes(kidId)) {
    return save;
  }

  return {
    ...save,
    unlockedKidIds: [...save.unlockedKidIds, kidId],
    bedtimeOrderKidIds: save.bedtimeOrderKidIds.includes(kidId)
      ? save.bedtimeOrderKidIds
      : [...save.bedtimeOrderKidIds, kidId].slice(0, MAX_ACTIVE_KIDS),
    selectedOutfitByKidId: {
      ...save.selectedOutfitByKidId,
      [kidId]: save.selectedOutfitByKidId[kidId] ?? save.unlockedOutfitIds[0] ?? starterOutfitId
    },
    bedtimeProgress: {
      ...save.bedtimeProgress,
      currentStepIndexByKidId: {
        ...save.bedtimeProgress.currentStepIndexByKidId,
        [kidId]: save.bedtimeProgress.currentStepIndexByKidId[kidId] ?? 0
      }
    }
  };
}

function unlockOutfit(save: GameSave, outfitId: string): GameSave {
  if (save.unlockedOutfitIds.includes(outfitId)) {
    return save;
  }

  return {
    ...save,
    unlockedOutfitIds: [...save.unlockedOutfitIds, outfitId]
  };
}

function nextLockedKidId(save: GameSave): string | null {
  return kids.find((kid) => !save.unlockedKidIds.includes(kid.id))?.id ?? null;
}

function nextLockedOutfitId(save: GameSave): string | null {
  return outfits.find((outfit) => !save.unlockedOutfitIds.includes(outfit.id))?.id ?? null;
}

function buildReward(id: string, kind: UnlockKind, source: "spin" | "bedtime"): UnlockReward {
  if (kind === "kid") {
    const kid = kids.find((entry) => entry.id === id);

    if (!kid) {
      throw new Error(`Unknown kid reward id: ${id}`);
    }

    return { kind, id, displayName: kid.displayName, source };
  }

  const outfit = outfits.find((entry) => entry.id === id);

  if (!outfit) {
    throw new Error(`Unknown outfit reward id: ${id}`);
  }

  return { kind, id, displayName: outfit.displayName, source };
}

export function applyNightlyReward(
  save: GameSave,
  now = new Date()
): { save: GameSave; reward: UnlockReward | null } {
  if (!canClaimNightlyReward(save, now)) {
    return { save, reward: null };
  }

  const kidId = nextLockedKidId(save);

  if (kidId) {
    return {
      save: markNightlyRewardClaimed(unlockKid(save, kidId), now),
      reward: buildReward(kidId, "kid", "bedtime")
    };
  }

  const outfitId = nextLockedOutfitId(save);

  if (outfitId) {
    return {
      save: markNightlyRewardClaimed(unlockOutfit(save, outfitId), now),
      reward: buildReward(outfitId, "outfit", "bedtime")
    };
  }

  return {
    save: markNightlyRewardClaimed(save, now),
    reward: null
  };
}

export function applySpinReward(save: GameSave): { save: GameSave; reward: UnlockReward | null } {
  if (save.spinState.available <= 0) {
    return { save, reward: null };
  }

  const spent = spendSpin(save);
  const outfitId = nextLockedOutfitId(spent);

  if (outfitId) {
    return {
      save: unlockOutfit(spent, outfitId),
      reward: buildReward(outfitId, "outfit", "spin")
    };
  }

  const kidId = nextLockedKidId(spent);

  if (kidId) {
    return {
      save: unlockKid(spent, kidId),
      reward: buildReward(kidId, "kid", "spin")
    };
  }

  return { save: spent, reward: null };
}
