import { kids, outfits, starterKidId, starterOutfitId } from "./content";

export const STORAGE_KEY = "otterflop-save-v1";
export const SAVE_SCHEMA_VERSION = 1;
export const MAX_SPINS = 3;
export const SPIN_REFILL_HOURS = 1;

export type GameSave = {
  schemaVersion: number;
  unlockedKidIds: string[];
  unlockedOutfitIds: string[];
  bedtimeOrderKidIds: string[];
  selectedOutfitByKidId: Record<string, string>;
  bedtimeProgress: {
    nightlyCompletedKidIds: string[];
    currentStepIndexByKidId: Record<string, number>;
    lastNightKey: string | null;
    rewardClaimedNightKey: string | null;
  };
  spinState: {
    available: number;
    lastRefillAt: string;
  };
};

function unique(ids: string[]): string[] {
  return [...new Set(ids)];
}

function validKidIds(ids: string[]): string[] {
  const allowed = new Set(kids.map((kid) => kid.id));
  return unique(ids).filter((id) => allowed.has(id));
}

function validOutfitIds(ids: string[]): string[] {
  const allowed = new Set(outfits.map((outfit) => outfit.id));
  return unique(ids).filter((id) => allowed.has(id));
}

export function createInitialSave(now = new Date()): GameSave {
  const nightKey = getNightKey(now);

  return {
    schemaVersion: SAVE_SCHEMA_VERSION,
    unlockedKidIds: [starterKidId],
    unlockedOutfitIds: [starterOutfitId],
    bedtimeOrderKidIds: [starterKidId],
    selectedOutfitByKidId: {
      [starterKidId]: starterOutfitId
    },
    bedtimeProgress: {
      nightlyCompletedKidIds: [],
      currentStepIndexByKidId: {
        [starterKidId]: 0
      },
      lastNightKey: nightKey,
      rewardClaimedNightKey: null
    },
    spinState: {
      available: MAX_SPINS,
      lastRefillAt: now.toISOString()
    }
  };
}

export function refreshSpins(save: GameSave, now = new Date()): GameSave {
  const last = new Date(save.spinState.lastRefillAt).getTime();
  const elapsedMs = now.getTime() - last;
  const refillCount = Math.max(0, Math.floor(elapsedMs / (SPIN_REFILL_HOURS * 60 * 60 * 1000)));

  if (refillCount === 0) {
    return save;
  }

  return {
    ...save,
    spinState: {
      available: Math.min(MAX_SPINS, save.spinState.available + refillCount),
      lastRefillAt: now.toISOString()
    }
  };
}

export function normalizeSave(raw: unknown, now = new Date()): GameSave {
  if (!raw || typeof raw !== "object") {
    return createInitialSave(now);
  }

  const candidate = raw as Partial<GameSave>;
  const unlockedKidIds = validKidIds(candidate.unlockedKidIds ?? []);
  const unlockedOutfitIds = validOutfitIds(candidate.unlockedOutfitIds ?? []);
  const bedtimeOrderKidIds = validKidIds(candidate.bedtimeOrderKidIds ?? []);
  const selectedOutfitByKidId = Object.fromEntries(
    Object.entries(candidate.selectedOutfitByKidId ?? {}).filter(
      ([kidId, outfitId]) =>
        validKidIds([kidId]).length > 0 && validOutfitIds([String(outfitId)]).length > 0
    )
  ) as Record<string, string>;
  const nightlyCompletedKidIds = validKidIds(
    candidate.bedtimeProgress?.nightlyCompletedKidIds ?? []
  );
  const orderIds = bedtimeOrderKidIds.length > 0 ? bedtimeOrderKidIds : [starterKidId];
  const currentStepIndexByKidId = Object.fromEntries(
    orderIds.map((kidId) => {
      const rawStepIndex = candidate.bedtimeProgress?.currentStepIndexByKidId?.[kidId];
      const normalizedStepIndex =
        typeof rawStepIndex === "number" && rawStepIndex >= 0
          ? Math.floor(rawStepIndex)
          : 0;

      return [kidId, normalizedStepIndex];
    })
  ) as Record<string, number>;

  return refreshSpins(
    {
      schemaVersion: SAVE_SCHEMA_VERSION,
      unlockedKidIds: unlockedKidIds.length > 0 ? unlockedKidIds : [starterKidId],
      unlockedOutfitIds:
        unlockedOutfitIds.length > 0 ? unlockedOutfitIds : [starterOutfitId],
      bedtimeOrderKidIds: orderIds,
      selectedOutfitByKidId:
        Object.keys(selectedOutfitByKidId).length > 0
          ? selectedOutfitByKidId
          : { [starterKidId]: starterOutfitId },
      bedtimeProgress: {
        nightlyCompletedKidIds,
        currentStepIndexByKidId,
        lastNightKey: candidate.bedtimeProgress?.lastNightKey ?? null,
        rewardClaimedNightKey: candidate.bedtimeProgress?.rewardClaimedNightKey ?? null
      },
      spinState: {
        available:
          typeof candidate.spinState?.available === "number"
            ? Math.max(0, Math.min(MAX_SPINS, candidate.spinState.available))
            : MAX_SPINS,
        lastRefillAt: candidate.spinState?.lastRefillAt ?? now.toISOString()
      }
    },
    now
  );
}

export function loadSave(now = new Date()): GameSave | null {
  const raw = globalThis.localStorage?.getItem(STORAGE_KEY);

  if (!raw) {
    return null;
  }

  return normalizeSave(JSON.parse(raw), now);
}

export function saveGame(save: GameSave): void {
  globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(save));
}

export function exportSaveToJson(save: GameSave): string {
  return JSON.stringify(save, null, 2);
}

export function importSaveFromJson(payload: string, now = new Date()): GameSave {
  return normalizeSave(JSON.parse(payload), now);
}

export function getNightKey(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export function ensureNightState(save: GameSave, now = new Date()): GameSave {
  const nightKey = getNightKey(now);

  if (save.bedtimeProgress.lastNightKey === nightKey) {
    return save;
  }

  return {
    ...save,
    bedtimeProgress: {
      nightlyCompletedKidIds: [],
      currentStepIndexByKidId: Object.fromEntries(
        save.bedtimeOrderKidIds.map((kidId) => [kidId, 0])
      ),
      lastNightKey: nightKey,
      rewardClaimedNightKey: null
    }
  };
}

export function markKidComplete(
  save: GameSave,
  kidId: string,
  now = new Date()
): GameSave {
  const normalized = ensureNightState(save, now);

  return {
    ...normalized,
    bedtimeProgress: {
      ...normalized.bedtimeProgress,
      currentStepIndexByKidId: {
        ...normalized.bedtimeProgress.currentStepIndexByKidId
      },
      nightlyCompletedKidIds: [...new Set([...normalized.bedtimeProgress.nightlyCompletedKidIds, kidId])]
    }
  };
}

export function setKidOutfit(save: GameSave, kidId: string, outfitId: string): GameSave {
  return {
    ...save,
    selectedOutfitByKidId: {
      ...save.selectedOutfitByKidId,
      [kidId]: outfitId
    }
  };
}

export function canClaimNightlyReward(save: GameSave, now = new Date()): boolean {
  const normalized = ensureNightState(save, now);
  const nightKey = getNightKey(now);

  return (
    normalized.bedtimeProgress.nightlyCompletedKidIds.length ===
      normalized.bedtimeOrderKidIds.length &&
    normalized.bedtimeOrderKidIds.length > 0 &&
    normalized.bedtimeProgress.rewardClaimedNightKey !== nightKey
  );
}

export function markNightlyRewardClaimed(save: GameSave, now = new Date()): GameSave {
  const normalized = ensureNightState(save, now);

  return {
    ...normalized,
    bedtimeProgress: {
      ...normalized.bedtimeProgress,
      rewardClaimedNightKey: getNightKey(now)
    }
  };
}

export function spendSpin(save: GameSave): GameSave {
  return {
    ...save,
    spinState: {
      ...save.spinState,
      available: Math.max(0, save.spinState.available - 1)
    }
  };
}

export function getKidStepIndex(save: GameSave, kidId: string): number {
  return save.bedtimeProgress.currentStepIndexByKidId[kidId] ?? 0;
}

export function advanceKidStep(
  save: GameSave,
  kidId: string,
  totalSteps: number,
  now = new Date()
): GameSave {
  const normalized = ensureNightState(save, now);
  const currentIndex = getKidStepIndex(normalized, kidId);
  const nextIndex = Math.min(totalSteps, currentIndex + 1);
  const nextCompletedKidIds =
    nextIndex >= totalSteps
      ? [...new Set([...normalized.bedtimeProgress.nightlyCompletedKidIds, kidId])]
      : normalized.bedtimeProgress.nightlyCompletedKidIds;

  return {
    ...normalized,
    bedtimeProgress: {
      ...normalized.bedtimeProgress,
      currentStepIndexByKidId: {
        ...normalized.bedtimeProgress.currentStepIndexByKidId,
        [kidId]: nextIndex
      },
      nightlyCompletedKidIds: nextCompletedKidIds
    }
  };
}
