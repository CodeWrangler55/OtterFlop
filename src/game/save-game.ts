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
  bedtimeProgress: {
    nightlyCompletedKidIds: string[];
    lastNightKey: string | null;
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
  return {
    schemaVersion: SAVE_SCHEMA_VERSION,
    unlockedKidIds: [starterKidId],
    unlockedOutfitIds: [starterOutfitId],
    bedtimeOrderKidIds: [starterKidId],
    bedtimeProgress: {
      nightlyCompletedKidIds: [],
      lastNightKey: null
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
  const nightlyCompletedKidIds = validKidIds(
    candidate.bedtimeProgress?.nightlyCompletedKidIds ?? []
  );

  return refreshSpins(
    {
      schemaVersion: SAVE_SCHEMA_VERSION,
      unlockedKidIds: unlockedKidIds.length > 0 ? unlockedKidIds : [starterKidId],
      unlockedOutfitIds:
        unlockedOutfitIds.length > 0 ? unlockedOutfitIds : [starterOutfitId],
      bedtimeOrderKidIds:
        bedtimeOrderKidIds.length > 0 ? bedtimeOrderKidIds : [starterKidId],
      bedtimeProgress: {
        nightlyCompletedKidIds,
        lastNightKey: candidate.bedtimeProgress?.lastNightKey ?? null
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

