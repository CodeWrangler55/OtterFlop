import { useEffect, useRef, useState } from "react";
import { getAssetById, toRuntimeAssetUrl } from "../../game/content";
import { KidAvatar } from "../components/KidAvatar";

export const OTTER_FLOP_ANIMATION_MS = 1400;

type OtterFlopStepProps = {
  kidId: string;
  outfitId?: string;
  onComplete: () => void;
  dadAssetId?: string;
  bedAssetId?: string;
  durationMs?: number;
};

type AnimationPhase = "ready" | "jumping" | "landed";

export function OtterFlopStep({
  kidId,
  outfitId,
  onComplete,
  dadAssetId = "parent-dad",
  bedAssetId = "prop-otter-flop-bed",
  durationMs = OTTER_FLOP_ANIMATION_MS
}: OtterFlopStepProps) {
  const dadAsset = getAssetById(dadAssetId);
  const bedAsset = getAssetById(bedAssetId);
  const [phase, setPhase] = useState<AnimationPhase>("ready");
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  function handleJump() {
    if (phase !== "ready") {
      return;
    }

    setPhase("jumping");
    timeoutRef.current = window.setTimeout(() => {
      setPhase("landed");
      onComplete();
      timeoutRef.current = null;
    }, durationMs);
  }

  const statusMessage =
    phase === "ready"
      ? "Tap to help the otter kid leap into dad's arms."
      : phase === "jumping"
        ? "Dad is catching the jump and bouncing onto the bed."
        : "Otter Flop is done for tonight.";

  return (
    <div className="otter-flop-step">
      <div
        className={`otter-flop-stage otter-flop-stage-${phase}`}
        role="img"
        aria-label="Otter Flop scene"
      >
        <img
          src={toRuntimeAssetUrl(dadAsset.imageFile)}
          alt="Dad otter waiting with open arms"
          className="otter-flop-dad"
        />
        <img
          src={toRuntimeAssetUrl(bedAsset.imageFile)}
          alt=""
          aria-hidden="true"
          className="otter-flop-bed"
        />
        <div className="otter-flop-kid">
          <KidAvatar
            kidId={kidId}
            outfitId={outfitId}
            label="Otter kid jumping toward dad"
            size="large"
          />
        </div>
      </div>

      <p className="otter-flop-copy">{statusMessage}</p>

      <button
        type="button"
        className="primary-button routine-button"
        onClick={handleJump}
        disabled={phase !== "ready"}
      >
        {phase === "ready" ? "Jump to dad" : phase === "jumping" ? "Jumping..." : "Caught by dad"}
      </button>
    </div>
  );
}
