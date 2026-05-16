import { useEffect, useId, useMemo, useRef, useState, type CSSProperties } from "react";

export type SpinWheelSegment = {
  id: string;
  label: string;
  fillColor: string;
  accentColor: string;
  textColor?: string;
};

export function SpinWheel({
  segments,
  rewardId,
  spinToken,
  disabled = false,
  isSpinning = false,
  buttonLabel = "Spin for a surprise",
  idleLabel = "Tap the wheel to find a bedtime surprise.",
  loadingLabel = "The wheel is spinning...",
  onSpin,
  onReveal
}: {
  segments: SpinWheelSegment[];
  rewardId: string | null;
  spinToken?: number | string;
  disabled?: boolean;
  isSpinning?: boolean;
  buttonLabel?: string;
  idleLabel?: string;
  loadingLabel?: string;
  onSpin: () => void;
  onReveal?: (segment: SpinWheelSegment) => void;
}) {
  const gradient = useMemo(() => buildWheelGradient(segments), [segments]);
  const wheelId = useId();
  const activeSpinKey = useRef<string | number | null>(null);
  const pendingRewardRef = useRef<SpinWheelSegment | null>(null);
  const [rotationDegrees, setRotationDegrees] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [revealedRewardId, setRevealedRewardId] = useState<string | null>(null);

  useEffect(() => {
    if (!isSpinning || !rewardId || segments.length === 0) {
      return;
    }

    const currentSpinKey = spinToken ?? rewardId;

    if (activeSpinKey.current === currentSpinKey) {
      return;
    }

    const rewardIndex = segments.findIndex((segment) => segment.id === rewardId);

    if (rewardIndex < 0) {
      return;
    }

    activeSpinKey.current = currentSpinKey;
    pendingRewardRef.current = segments[rewardIndex];
    setIsAnimating(true);
    setRevealedRewardId(null);
    setRotationDegrees((current) => {
      const segmentSweep = 360 / segments.length;
      const segmentCenter = rewardIndex * segmentSweep + segmentSweep / 2;
      const normalizedCurrent = normalizeDegrees(current);
      const targetDelta = normalizeDegrees(360 - segmentCenter - normalizedCurrent);

      return current + 2160 + targetDelta;
    });
  }, [isSpinning, rewardId, segments, spinToken]);

  const revealedReward =
    revealedRewardId === null
      ? null
      : segments.find((segment) => segment.id === revealedRewardId) ?? null;

  const statusMessage = isAnimating
    ? loadingLabel
    : revealedReward
      ? `${revealedReward.label} is ready.`
      : idleLabel;
  const canSpin = !(disabled || isAnimating || isSpinning || segments.length === 0);

  return (
    <section className="spin-wheel-card" aria-labelledby={`${wheelId}-title`}>
      <div className="panel-heading">
        <div>
          <p className="kicker">Spin shelf</p>
          <h3 id={`${wheelId}-title`}>Reward wheel</h3>
        </div>
        <span className="pill">{segments.length} prizes</span>
      </div>

      <div className="spin-wheel-layout">
        <div className="spin-wheel-stage">
          <div className="spin-wheel-pointer" aria-hidden="true" />
          <div
            className={`spin-wheel ${isAnimating ? "spin-wheel-active" : ""} ${
              canSpin ? "spin-wheel-clickable" : ""
            }`}
            style={
              {
                "--spin-wheel-gradient": gradient,
                "--spin-wheel-rotation": `${rotationDegrees}deg`
              } as CSSProperties
            }
            onClick={() => {
              if (canSpin) {
                onSpin();
              }
            }}
            onTransitionEnd={() => {
              if (!isAnimating) {
                return;
              }

              setIsAnimating(false);

              if (pendingRewardRef.current) {
                setRevealedRewardId(pendingRewardRef.current.id);
                onReveal?.(pendingRewardRef.current);
              }
            }}
            role="img"
            aria-label="Prize wheel"
            aria-disabled={!canSpin}
          >
            <div className="spin-wheel-center" aria-hidden="true" />
            {segments.map((segment, index) => {
              const segmentSweep = 360 / segments.length;
              const rotation = index * segmentSweep;

              return (
                <div
                  key={segment.id}
                  className="spin-wheel-label"
                  style={
                    {
                      "--spin-wheel-label-rotation": `${rotation}deg`,
                      "--spin-wheel-label-color": segment.textColor ?? "#fffdfb"
                    } as CSSProperties
                  }
                >
                  <span>{segment.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="spin-wheel-sidebar">
          <p className="small-note" aria-live="polite">
            {statusMessage}
          </p>
          {revealedReward ? (
            <div
              className="spin-wheel-reveal"
              style={
                {
                  "--spin-wheel-reveal-accent": revealedReward.accentColor
                } as CSSProperties
              }
            >
              <strong>{revealedReward.label}</strong>
            </div>
          ) : null}
          <button
            type="button"
            className="primary-button spin-wheel-button"
            onClick={onSpin}
            disabled={!canSpin}
          >
            {isAnimating || isSpinning ? "Spinning..." : buttonLabel}
          </button>
        </div>
      </div>
    </section>
  );
}

function buildWheelGradient(segments: SpinWheelSegment[]): string {
  if (segments.length === 0) {
    return "conic-gradient(from -90deg, #eef2ff 0deg 360deg)";
  }

  const segmentSweep = 360 / segments.length;
  const stops = segments.flatMap((segment, index) => {
    const start = index * segmentSweep;
    const mid = start + segmentSweep * 0.52;
    const end = start + segmentSweep;
    return [
      `${segment.fillColor} ${start}deg ${mid}deg`,
      `${segment.accentColor} ${mid}deg ${end}deg`
    ];
  });

  return `conic-gradient(from -90deg, ${stops.join(", ")})`;
}

function normalizeDegrees(value: number): number {
  return ((value % 360) + 360) % 360;
}
