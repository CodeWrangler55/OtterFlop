import {
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent
} from "react";

const REQUIRED_SCRUB_MS = 5000;
const MIN_STROKES = 4;

const toothbrushes = [
  { id: "toothbrush-moon", label: "Moon Brush", accentColor: "#90a4ff" },
  { id: "toothbrush-bubble", label: "Bubble Brush", accentColor: "#58c6a2" },
  { id: "toothbrush-star", label: "Star Brush", accentColor: "#f8b96d" }
] as const;

type BrushId = (typeof toothbrushes)[number]["id"];

type BrushPoint = {
  x: number;
  y: number;
};

type ScrubState = {
  pointerId: number | null;
  lastPoint: BrushPoint | null;
  lastDirection: -1 | 0 | 1;
  progressMs: number;
  strokes: number;
  lastMoveAt: number;
};

const emptyScrubState = (): ScrubState => ({
  pointerId: null,
  lastPoint: null,
  lastDirection: 0,
  progressMs: 0,
  strokes: 0,
  lastMoveAt: 0
});

export function BrushStep({
  kidName,
  onComplete
}: {
  kidName: string;
  onComplete: (brushId: string) => void;
}) {
  const [selectedBrushId, setSelectedBrushId] = useState<BrushId>("toothbrush-moon");
  const [brushPoint, setBrushPoint] = useState<BrushPoint>({ x: 48, y: 72 });
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubProgressMs, setScrubProgressMs] = useState(0);
  const [strokeCount, setStrokeCount] = useState(0);
  const [completedBrushId, setCompletedBrushId] = useState<BrushId | null>(null);

  const scrubState = useRef<ScrubState>(emptyScrubState());
  const stageRef = useRef<HTMLDivElement | null>(null);
  const mouthRef = useRef<HTMLDivElement | null>(null);

  const selectedBrush = useMemo(
    () => toothbrushes.find((brush) => brush.id === selectedBrushId) ?? toothbrushes[0],
    [selectedBrushId]
  );
  const completedBrush =
    completedBrushId === null
      ? null
      : toothbrushes.find((brush) => brush.id === completedBrushId) ?? null;
  const progressPercent = Math.min(100, Math.round((scrubProgressMs / REQUIRED_SCRUB_MS) * 100));
  const teethAreClean = completedBrush !== null;

  function pointFromClient(clientX: number, clientY: number): BrushPoint {
    const stageBounds = stageRef.current?.getBoundingClientRect();

    if (!stageBounds) {
      return brushPoint;
    }

    return {
      x: Math.max(0, Math.min(stageBounds.width, clientX - stageBounds.left)),
      y: Math.max(0, Math.min(stageBounds.height, clientY - stageBounds.top))
    };
  }

  function isClientOverMouth(clientX: number, clientY: number) {
    const mouthBounds = mouthRef.current?.getBoundingClientRect();

    if (!mouthBounds) {
      return false;
    }

    return (
      clientX >= mouthBounds.left &&
      clientX <= mouthBounds.right &&
      clientY >= mouthBounds.top &&
      clientY <= mouthBounds.bottom
    );
  }

  function completeBrushing(brushId: BrushId) {
    setCompletedBrushId(brushId);
    setIsScrubbing(false);
    onComplete(brushId);
  }

  function updateScrubProgress(clientX: number, clientY: number, timeStamp: number) {
    const state = scrubState.current;
    const nextPoint = pointFromClient(clientX, clientY);

    setBrushPoint(nextPoint);

    if (!isClientOverMouth(clientX, clientY)) {
      state.lastPoint = nextPoint;
      state.lastMoveAt = timeStamp;
      return;
    }

    const previousPoint = state.lastPoint;
    const dx = previousPoint ? nextPoint.x - previousPoint.x : 0;
    const dy = previousPoint ? nextPoint.y - previousPoint.y : 0;
    const movedEnough = Math.abs(dx) + Math.abs(dy) >= 6;
    const direction = Math.abs(dx) >= 8 ? (dx > 0 ? 1 : -1) : state.lastDirection;
    const changedDirection =
      direction !== 0 && state.lastDirection !== 0 && direction !== state.lastDirection;
    const rawElapsedMs = timeStamp - state.lastMoveAt;
    const elapsedMs = rawElapsedMs > 220 ? 220 : 180;

    if (movedEnough) {
      state.progressMs += elapsedMs;
    }

    if (changedDirection) {
      state.strokes += 1;
    }

    state.lastPoint = nextPoint;
    state.lastDirection = direction;
    state.lastMoveAt = timeStamp;

    setScrubProgressMs(state.progressMs);
    setStrokeCount(state.strokes);

    if (state.progressMs >= REQUIRED_SCRUB_MS && state.strokes >= MIN_STROKES) {
      completeBrushing(selectedBrushId);
    }
  }

  function startScrubbing(event: PointerEvent<HTMLButtonElement>) {
    if (teethAreClean) {
      return;
    }

    const pointerId = event.pointerId ?? 1;

    event.currentTarget.setPointerCapture(pointerId);
    const point = pointFromClient(event.clientX, event.clientY);

    scrubState.current = {
      ...emptyScrubState(),
      pointerId,
      lastPoint: point,
      lastMoveAt: event.timeStamp
    };
    setBrushPoint(point);
    setIsScrubbing(true);
  }

  function stopScrubbing(event: PointerEvent<HTMLButtonElement>) {
    if (scrubState.current.pointerId === (event.pointerId ?? scrubState.current.pointerId)) {
      scrubState.current.pointerId = null;
    }

    setIsScrubbing(false);
  }

  function moveBrush(event: PointerEvent<HTMLButtonElement>) {
    if (
      scrubState.current.pointerId !== (event.pointerId ?? scrubState.current.pointerId) ||
      teethAreClean
    ) {
      return;
    }

    updateScrubProgress(event.clientX, event.clientY, event.timeStamp);
  }

  function startMouseScrubbing(event: ReactMouseEvent<HTMLButtonElement>) {
    if (scrubState.current.pointerId !== null || teethAreClean) {
      return;
    }

    const point = pointFromClient(event.clientX, event.clientY);

    scrubState.current = {
      ...emptyScrubState(),
      pointerId: -1,
      lastPoint: point,
      lastMoveAt: event.timeStamp
    };
    setBrushPoint(point);
    setIsScrubbing(true);
  }

  function moveMouseBrush(event: ReactMouseEvent<HTMLButtonElement>) {
    if (scrubState.current.pointerId !== -1 || teethAreClean) {
      return;
    }

    updateScrubProgress(event.clientX, event.clientY, event.timeStamp);
  }

  function stopMouseScrubbing() {
    if (scrubState.current.pointerId === -1) {
      scrubState.current.pointerId = null;
    }

    setIsScrubbing(false);
  }

  return (
    <div className="brush-step">
      <p className="brush-step-hint">
        Pick a toothbrush, then scrub back and forth on {kidName}'s teeth until they sparkle.
      </p>

      <div className="brush-step-layout">
        <div className="brush-tray" aria-label="Toothbrush choices">
          {toothbrushes.map((brush) => (
            <button
              key={brush.id}
              type="button"
              className={`brush-card ${selectedBrushId === brush.id ? "brush-card-selected" : ""}`}
              disabled={teethAreClean}
              style={{ "--brush-accent": brush.accentColor } as CSSProperties}
              onClick={() => setSelectedBrushId(brush.id)}
            >
              <span className="brush-card-icon" aria-hidden="true">
                <span className="brush-card-head" />
                <span className="brush-card-handle" />
              </span>
              <span className="brush-card-label">{brush.label}</span>
            </button>
          ))}
        </div>

        <div
          ref={stageRef}
          className={`brush-play-stage ${teethAreClean ? "brush-play-stage-complete" : ""}`}
          aria-label={`Brush ${kidName}'s teeth`}
          onMouseMove={(event) => {
            if (scrubState.current.pointerId === -1 && !teethAreClean) {
              updateScrubProgress(event.clientX, event.clientY, event.timeStamp);
            }
          }}
          onMouseUp={stopMouseScrubbing}
        >
          <div className="brush-otter-face" aria-hidden="true">
            <div className="brush-otter-ear brush-otter-ear-left" />
            <div className="brush-otter-ear brush-otter-ear-right" />
            <div className="brush-otter-head">
              <div className="brush-otter-eye brush-otter-eye-left" />
              <div className="brush-otter-eye brush-otter-eye-right" />
              <div className="brush-otter-nose" />
              <div
                ref={mouthRef}
                className={`brush-otter-mouth ${teethAreClean ? "brush-otter-mouth-clean" : ""}`}
              >
                <span />
                <span />
                <span />
                <span />
              </div>
            </div>
          </div>

          <button
            type="button"
            className={`scrub-toothbrush ${isScrubbing ? "scrub-toothbrush-active" : ""}`}
            disabled={teethAreClean}
            style={
              {
                "--brush-x": `${brushPoint.x}px`,
                "--brush-y": `${brushPoint.y}px`,
                "--brush-accent": selectedBrush.accentColor
              } as CSSProperties
            }
            aria-label={`Move ${selectedBrush.label} over ${kidName}'s teeth`}
            onPointerDown={startScrubbing}
            onPointerMove={moveBrush}
            onPointerUp={stopScrubbing}
            onPointerCancel={stopScrubbing}
            onMouseDown={startMouseScrubbing}
            onMouseMove={moveMouseBrush}
            onMouseUp={stopMouseScrubbing}
            onMouseLeave={stopMouseScrubbing}
          >
            <span className="scrub-toothbrush-head" />
            <span className="scrub-toothbrush-handle" />
          </button>

          <div className="brush-progress" aria-live="polite">
            <strong>{teethAreClean ? `${kidName}'s teeth are all shiny.` : "Scrub the teeth"}</strong>
            <span>
              {teethAreClean
                ? `${completedBrush.label} cleaned every tooth.`
                : `${progressPercent}% clean - ${Math.max(0, MIN_STROKES - strokeCount)} wiggles left`}
            </span>
            <div className="brush-progress-track" aria-hidden="true">
              <span style={{ width: `${progressPercent}%` }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
