import { useRef, useState } from "react";
import { playLullabyMelody, type LullabyPlaybackResult } from "../../game/audio";

type LullabyStepProps = {
  onComplete: () => void;
  playLullaby?: (options?: {
    audioContext?: AudioContext | null;
  }) => Promise<LullabyPlaybackResult>;
};

type LullabyState = "idle" | "playing" | "silent";

export function LullabyStep({
  onComplete,
  playLullaby = playLullabyMelody
}: LullabyStepProps) {
  const [state, setState] = useState<LullabyState>("idle");
  const [isActivating, setIsActivating] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  async function handleActivate() {
    if (isActivating || state !== "idle") {
      return;
    }

    setIsActivating(true);

    try {
      const result = await playLullaby({
        audioContext: audioContextRef.current
      });

      setState(result.mode === "audio" ? "playing" : "silent");
    } catch {
      setState("silent");
    } finally {
      setIsActivating(false);
      onComplete();
    }
  }

  return (
    <section className="lullaby-step" aria-label="Lullaby player">
      <div className="lullaby-card">
        <p className="kicker">Mommy's music</p>
        <h3>Start the lullaby</h3>
        <p className="small-note">
          Tap once to begin the gentle bedtime song. Bedtime can still continue if this device
          stays quiet.
        </p>
        <button
          type="button"
          className="primary-button"
          onClick={handleActivate}
          disabled={isActivating || state !== "idle"}
        >
          {isActivating ? "Starting lullaby..." : state === "idle" ? "Play lullaby" : "Lullaby started"}
        </button>
      </div>

      <p className="lullaby-status" role="status">
        {state === "playing"
          ? "The lullaby is playing."
          : state === "silent"
            ? "Audio is unavailable here, but bedtime can continue."
            : "Ready to start the lullaby."}
      </p>
    </section>
  );
}
