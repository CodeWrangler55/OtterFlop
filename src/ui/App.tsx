import { useEffect, useMemo, useRef, useState } from "react";
import {
  MAX_ACTIVE_KIDS,
  bedtimeSteps,
  getAssetById,
  kids,
  outfits,
  sceneAssets,
  toRuntimeAssetUrl
} from "../game/content";
import {
  type UnlockReward,
  applyNightlyReward,
  applySpinReward,
  getCurrentStep,
  getNextKidToPlay,
  getRemainingUnlockCounts,
  getUnlockedKids,
  getUnlockedOutfits,
  hasAnyUnlocksRemaining,
  isNightComplete,
  totalBedtimeSteps
} from "../game/bedtime";
import {
  advanceKidStep,
  canClaimNightlyReward,
  createInitialSave,
  ensureNightState,
  exportSaveToJson,
  getKidStepIndex,
  importSaveFromJson,
  loadSave,
  refreshSpins,
  saveGame,
  setKidOutfit
} from "../game/save-game";
import { KidAvatar } from "./components/KidAvatar";
import { RewardBanner } from "./components/RewardBanner";
import { SpinWheel, type SpinWheelSegment } from "./components/SpinWheel";
import { RoutineStepContent } from "./steps/RoutineStepContent";

type ScreenMode = "home" | "routine";

const deployUrl = "https://codewrangler55.github.io/OtterFlop/";
const parentTapGoal = 4;

type SpinOutcome = {
  save: ReturnType<typeof createInitialSave>;
  reward: UnlockReward | null;
};

const outfitWheelPalette = [
  { fillColor: "#d7dcff", accentColor: "#90a4ff" },
  { fillColor: "#ffe3bf", accentColor: "#f8b96d" },
  { fillColor: "#ffd5e5", accentColor: "#f38cb1" },
  { fillColor: "#d9f1e7", accentColor: "#7fd0ae" }
];

export function App() {
  const [save, setSave] = useState(() => {
    const stored = loadSave();
    return ensureNightState(stored ?? createInitialSave());
  });
  const [screen, setScreen] = useState<ScreenMode>("home");
  const [currentKidId, setCurrentKidId] = useState<string | null>(null);
  const [reward, setReward] = useState<UnlockReward | null>(null);
  const [parentMenuOpen, setParentMenuOpen] = useState(false);
  const [parentTapCount, setParentTapCount] = useState(0);
  const [importError, setImportError] = useState<string | null>(null);
  const [spinRewardId, setSpinRewardId] = useState<string | null>(null);
  const [spinToken, setSpinToken] = useState(0);
  const [isSpinAnimating, setIsSpinAnimating] = useState(false);
  const [pendingSpinOutcome, setPendingSpinOutcome] = useState<SpinOutcome | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const parentTapTimeoutIds = useRef<number[]>([]);
  const heroScene = sceneAssets.find((scene) => scene.id === "scene-home-bedroom-night")!;

  useEffect(() => {
    saveGame(save);
  }, [save]);

  useEffect(() => {
    const syncSave = () => {
      setSave((current) => ensureNightState(refreshSpins(current)));
    };

    const interval = globalThis.setInterval(syncSave, 60_000);
    document.addEventListener("visibilitychange", syncSave);

    return () => {
      globalThis.clearInterval(interval);
      document.removeEventListener("visibilitychange", syncSave);
    };
  }, []);

  useEffect(() => {
    return () => {
      parentTapTimeoutIds.current.forEach((timeoutId) => {
        globalThis.clearTimeout(timeoutId);
      });
      parentTapTimeoutIds.current = [];
    };
  }, []);

  useEffect(() => {
    if (screen !== "routine") {
      return;
    }

    const nextKidId = getNextKidToPlay(save);

    if (!nextKidId) {
      setScreen("home");
      setCurrentKidId(null);
      return;
    }

    if (!currentKidId || save.bedtimeProgress.nightlyCompletedKidIds.includes(currentKidId)) {
      setCurrentKidId(nextKidId);
    }
  }, [currentKidId, save, screen]);

  const unlockedKids = useMemo(() => getUnlockedKids(save), [save]);
  const unlockedOutfits = useMemo(() => getUnlockedOutfits(save), [save]);
  const activeKidId = currentKidId ?? getNextKidToPlay(save) ?? save.bedtimeOrderKidIds[0] ?? null;
  const activeKid = kids.find((kid) => kid.id === activeKidId) ?? null;
  const currentStep =
    activeKidId && screen === "routine" ? getCurrentStep(save, activeKidId) : bedtimeSteps[0];
  const currentStepIndex =
    activeKidId && screen === "routine" ? getKidStepIndex(save, activeKidId) : 0;
  const currentScene = sceneAssets.find((scene) => scene.id === currentStep.sceneAssetId) ?? heroScene;
  const bedtimeOrderKids = save.bedtimeOrderKidIds.map(
    (kidId) => kids.find((entry) => entry.id === kidId)!
  );
  const remainingUnlocks = getRemainingUnlockCounts(save);
  const nightReadyForReward = canClaimNightlyReward(save);
  const nightIsComplete = isNightComplete(save);
  const stepHandledByComponent =
    currentStep.id === "feed" || currentStep.id === "flop" || currentStep.id === "lullaby";
  const spinSegments = useMemo<SpinWheelSegment[]>(() => {
    const remainingKids = kids
      .filter((kid) => !save.unlockedKidIds.includes(kid.id))
      .map((kid) => ({
        id: kid.id,
        label: kid.displayName,
        fillColor: "#f7a8c4",
        accentColor: "#ef7da9"
      }));
    const remainingOutfits = outfits
      .filter((outfit) => !save.unlockedOutfitIds.includes(outfit.id))
      .map((outfit, index) => {
        const palette = outfitWheelPalette[index % outfitWheelPalette.length];
        return {
          id: outfit.id,
          label: outfit.displayName,
          fillColor: palette.fillColor,
          accentColor: palette.accentColor
        };
      });

    return [...remainingOutfits, ...remainingKids];
  }, [save.unlockedKidIds, save.unlockedOutfitIds]);

  function handleParentTap() {
    const nextCount = parentTapCount + 1;
    setParentTapCount(nextCount);

    const timeoutId = globalThis.setTimeout(() => {
      setParentTapCount((count) => Math.max(0, count - 1));
    }, 2_000);
    parentTapTimeoutIds.current.push(timeoutId);

    if (nextCount >= parentTapGoal) {
      setParentMenuOpen(true);
      setParentTapCount(0);
    }
  }

  function startRoutine() {
    const nextKidId = getNextKidToPlay(save) ?? save.bedtimeOrderKidIds[0] ?? null;
    setCurrentKidId(nextKidId);
    setScreen("routine");
  }

  function advanceRoutineForKid(kidId: string) {
    const nextSave = advanceKidStep(save, kidId, totalBedtimeSteps);
    const completed = nextSave.bedtimeProgress.nightlyCompletedKidIds.includes(kidId);
    setSave(nextSave);

    if (completed) {
      const nextKidId = getNextKidToPlay(nextSave);
      if (nextKidId) {
        setCurrentKidId(nextKidId);
      } else {
        setCurrentKidId(null);
        setScreen("home");
      }
    }
  }

  function handleStepAction() {
    if (!activeKidId) {
      return;
    }

    advanceRoutineForKid(activeKidId);
  }

  function handleSelectOutfit(outfitId: string) {
    if (!activeKidId) {
      return;
    }

    setSave((current) => setKidOutfit(current, activeKidId, outfitId));
  }

  function handleSpin() {
    if (isSpinAnimating) {
      return;
    }

    const outcome = applySpinReward(save);

    if (!outcome.reward) {
      setSave(outcome.save);
      return;
    }

    setPendingSpinOutcome(outcome);
    setSpinRewardId(outcome.reward.id);
    setSpinToken((current) => current + 1);
    setIsSpinAnimating(true);
  }

  function handleClaimReward() {
    const outcome = applyNightlyReward(save);
    setSave(outcome.save);
    setReward(outcome.reward);
  }

  function downloadSaveFile() {
    const payload = exportSaveToJson(save);
    const blob = new Blob([payload], { type: "application/json" });
    const objectUrl = globalThis.URL?.createObjectURL(blob);

    if (!objectUrl) {
      return;
    }

    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = "otterflop-save.json";
    link.click();
    globalThis.setTimeout(() => {
      globalThis.URL.revokeObjectURL(objectUrl);
    }, 0);
  }

  function handleSpinReveal() {
    if (!pendingSpinOutcome) {
      setIsSpinAnimating(false);
      return;
    }

    setSave(pendingSpinOutcome.save);
    setReward(pendingSpinOutcome.reward);
    setPendingSpinOutcome(null);
    setIsSpinAnimating(false);
    setSpinRewardId(null);
  }

  async function importSaveFile(file: File) {
    try {
      const payload = await file.text();
      const importedSave = ensureNightState(importSaveFromJson(payload));
      setSave(importedSave);
      setScreen("home");
      setCurrentKidId(null);
      setReward(null);
      setImportError(null);
      setParentMenuOpen(false);
    } catch {
      setImportError("That save file could not be loaded.");
    }
  }

  return (
    <main className="app-shell">
      <button
        type="button"
        className="parent-hotspot"
        aria-label="Open parent menu"
        onClick={handleParentTap}
      />

      <section
        className="hero hero-game"
        style={{
          backgroundImage: `linear-gradient(rgba(35, 39, 82, 0.24), rgba(35, 39, 82, 0.24)), url(${toRuntimeAssetUrl(
            heroScene.imageFile
          )})`
        }}
      >
        <div className="hero-copy">
          <p className="eyebrow">Bedtime tonight</p>
          <h1>OtterFlop</h1>
          <p className="lead">
            Help each otter kid get ready for bed, then collect a bedtime surprise.
          </p>
          <div className="hero-actions">
            <button type="button" className="primary-button" onClick={startRoutine}>
              {nightIsComplete ? "Visit the bedtime room" : "Start bedtime"}
            </button>
            <div className="hero-status">
              <strong>{save.bedtimeProgress.nightlyCompletedKidIds.length}</strong>
              <span>of {save.bedtimeOrderKidIds.length} tucked in tonight</span>
            </div>
          </div>
        </div>

        <div className="hero-family">
          {unlockedKids.map((kid) => (
            <KidAvatar
              key={kid.id}
              kidId={kid.id}
              outfitId={save.selectedOutfitByKidId[kid.id]}
              label={kid.displayName}
            />
          ))}
        </div>
      </section>

      {reward ? <RewardBanner reward={reward} onDismiss={() => setReward(null)} /> : null}

      {screen === "routine" && activeKid ? (
        <section className="routine-layout">
          <article
            className="routine-stage"
            style={{
              backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.18), rgba(255, 255, 255, 0.18)), url(${toRuntimeAssetUrl(
                currentScene.imageFile
              )})`
            }}
          >
            <div className="routine-header">
              <div>
                <p className="kicker">Now helping {activeKid.displayName}</p>
                <h2>{currentStep.title}</h2>
                <p>{currentStep.detail}</p>
              </div>
              <button type="button" className="secondary-button" onClick={() => setScreen("home")}>
                Back home
              </button>
            </div>

            <div className="routine-progress" aria-label="Bedtime steps">
              {bedtimeSteps.map((step, index) => (
                <span
                  key={step.id}
                  className={`step-dot ${
                    index < currentStepIndex
                      ? "step-dot-done"
                      : index === currentStepIndex
                        ? "step-dot-active"
                        : ""
                  }`}
                />
              ))}
            </div>

            {currentStep.id !== "flop" ? (
              <div className="routine-characters">
                <KidAvatar
                  kidId={activeKid.id}
                  outfitId={save.selectedOutfitByKidId[activeKid.id]}
                  label={activeKid.displayName}
                  size="large"
                />

                <div className="routine-supporting-art">
                  {currentStep.parentAssetIds?.map((assetId) => {
                    const asset = getAssetById(assetId);
                    return (
                      <img
                        key={asset.id}
                        src={toRuntimeAssetUrl(asset.imageFile)}
                        alt={asset.label}
                        className="supporting-figure"
                      />
                    );
                  })}
                  {currentStep.propAssetId ? (
                    <img
                      src={toRuntimeAssetUrl(getAssetById(currentStep.propAssetId).imageFile)}
                      alt="Otter Flop bed"
                      className="supporting-prop"
                    />
                  ) : null}
                </div>
              </div>
            ) : null}

            <RoutineStepContent
              step={currentStep}
              activeKidId={activeKid.id}
              unlockedOutfits={unlockedOutfits}
              selectedOutfitId={save.selectedOutfitByKidId[activeKid.id]}
              onSelectOutfit={handleSelectOutfit}
              activeKidName={activeKid.displayName}
              onCompleteSnack={() => advanceRoutineForKid(activeKid.id)}
              onCompleteFlop={() => advanceRoutineForKid(activeKid.id)}
              onCompleteLullaby={() => advanceRoutineForKid(activeKid.id)}
            />

            {!stepHandledByComponent ? (
              <button
                type="button"
                className="primary-button routine-button"
                onClick={handleStepAction}
              >
                {currentStepIndex + 1 === totalBedtimeSteps
                  ? `Finish bedtime for ${activeKid.displayName}`
                  : currentStep.actionLabel}
              </button>
            ) : null}
          </article>

          <aside className="routine-sidebar">
            <article className="panel">
              <h3>Tonight's otter kids</h3>
              <div className="kid-status-list">
                {bedtimeOrderKids.map((kid) => {
                  const kidId = kid.id;
                  const isDone = save.bedtimeProgress.nightlyCompletedKidIds.includes(kidId);
                  const isActive = kidId === activeKid.id;

                  return (
                    <button
                      type="button"
                      key={kidId}
                      className={`kid-status-card ${isActive ? "card-selected" : ""}`}
                      onClick={() => {
                        setCurrentKidId(kidId);
                        setScreen("routine");
                      }}
                    >
                      <KidAvatar
                        kidId={kidId}
                        outfitId={save.selectedOutfitByKidId[kidId]}
                        label={kid.displayName}
                      />
                      <strong>{kid.displayName}</strong>
                      <span>{isDone ? "Tucked in" : "Still awake"}</span>
                    </button>
                  );
                })}
              </div>
            </article>
          </aside>
        </section>
      ) : (
        <section className="panel-grid">
          <article className="panel panel-wide">
            <div className="panel-heading">
              <div>
                <p className="kicker">Tonight's family</p>
                <h2>Unlocked otter kids</h2>
              </div>
              <span className="pill">
                {unlockedKids.length}/{MAX_ACTIVE_KIDS} kids
              </span>
            </div>
            <div className="kid-status-list">
              {unlockedKids.map((kid) => {
                const isDone = save.bedtimeProgress.nightlyCompletedKidIds.includes(kid.id);
                return (
                  <div className="kid-status-card" key={kid.id}>
                    <KidAvatar
                      kidId={kid.id}
                      outfitId={save.selectedOutfitByKidId[kid.id]}
                      label={kid.displayName}
                    />
                    <strong>{kid.displayName}</strong>
                    <span>{isDone ? "Already tucked in tonight" : "Ready for bedtime"}</span>
                  </div>
                );
              })}
            </div>
          </article>

          <article className="panel">
            <div className="panel-heading">
              <div>
                <p className="kicker">Spin shelf</p>
                <h2>Surprise spins</h2>
              </div>
              <span className="pill">{save.spinState.available} ready</span>
            </div>
            <p>Spins refill up to three, at one new spin each hour.</p>
            <SpinWheel
              segments={spinSegments}
              rewardId={spinRewardId}
              spinToken={spinToken}
              isSpinning={isSpinAnimating}
              disabled={save.spinState.available === 0 || !hasAnyUnlocksRemaining(save)}
              onSpin={handleSpin}
              onReveal={handleSpinReveal}
            />
            <ul className="stat-list">
              <li>Kids left to unlock: {remainingUnlocks.kids}</li>
              <li>Outfits left to unlock: {remainingUnlocks.outfits}</li>
            </ul>
          </article>

          <article className="panel">
            <div className="panel-heading">
              <div>
                <p className="kicker">Bedtime reward</p>
                <h2>Nightly surprise</h2>
              </div>
            </div>
            <p>Finish bedtime for every active kid to unlock one more surprise.</p>
            <button
              type="button"
              className="primary-button"
              onClick={handleClaimReward}
              disabled={!nightReadyForReward || !hasAnyUnlocksRemaining(save)}
            >
              Claim bedtime surprise
            </button>
            <p className="small-note">
              {nightReadyForReward
                ? "A new reward is ready now."
                : `${save.bedtimeProgress.nightlyCompletedKidIds.length} of ${save.bedtimeOrderKidIds.length} kids are tucked in.`}
            </p>
          </article>

          <article className="panel panel-wide">
            <div className="panel-heading">
              <div>
                <p className="kicker">Dress-up shelf</p>
                <h2>Unlocked outfits</h2>
              </div>
              <span className="pill">{unlockedOutfits.length} found</span>
            </div>
            <div className="outfit-grid">
              {unlockedOutfits.map((outfit) => {
                const asset = getAssetById(outfit.assetId);
                return (
                  <figure className="outfit-card" key={outfit.id}>
                    <img
                      src={toRuntimeAssetUrl(asset.imageFile)}
                      alt={outfit.displayName}
                      className="outfit-image"
                    />
                    <figcaption>{outfit.displayName}</figcaption>
                  </figure>
                );
              })}
            </div>
          </article>

          <article className="panel">
            <h2>GitHub Pages</h2>
            <p>The app is configured to deploy from the project site base path.</p>
            <code>{deployUrl}</code>
          </article>
        </section>
      )}

      {parentMenuOpen ? (
        <div className="parent-modal-backdrop" role="presentation">
          <section className="parent-modal" role="dialog" aria-modal="true" aria-label="Parent menu">
            <div className="panel-heading">
              <div>
                <p className="kicker">Parent menu</p>
                <h2>Save backup tools</h2>
              </div>
              <button
                type="button"
                className="secondary-button"
                onClick={() => setParentMenuOpen(false)}
              >
                Close
              </button>
            </div>
            <p>Use export to keep a backup file on the tablet. Use import to restore a saved game.</p>
            <div className="parent-actions">
              <button type="button" className="primary-button" onClick={downloadSaveFile}>
                Export save file
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={() => importInputRef.current?.click()}
              >
                Import save file
              </button>
            </div>
            <input
              ref={importInputRef}
              type="file"
              accept=".json,application/json"
              className="hidden-input"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  void importSaveFile(file);
                }
                event.currentTarget.value = "";
              }}
            />
            {importError ? <p className="small-note error-note">{importError}</p> : null}
          </section>
        </div>
      ) : null}
    </main>
  );
}
