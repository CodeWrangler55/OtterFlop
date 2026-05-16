import { useState, type CSSProperties } from "react";

const toothbrushes = [
  { id: "toothbrush-moon", label: "Moon Brush", emoji: "🪥", accentColor: "#90a4ff" },
  { id: "toothbrush-bubble", label: "Bubble Brush", emoji: "🪥", accentColor: "#7fd0ae" },
  { id: "toothbrush-star", label: "Star Brush", emoji: "🪥", accentColor: "#f8b96d" }
] as const;

export function BrushStep({
  kidName,
  onComplete
}: {
  kidName: string;
  onComplete: (brushId: string) => void;
}) {
  const [draggingBrushId, setDraggingBrushId] = useState<string | null>(null);
  const [completedBrushId, setCompletedBrushId] = useState<string | null>(null);

  const completedBrush =
    completedBrushId === null
      ? null
      : toothbrushes.find((brush) => brush.id === completedBrushId) ?? null;

  function deliverBrush(brushId: string) {
    if (completedBrushId) {
      return;
    }

    setCompletedBrushId(brushId);
    onComplete(brushId);
  }

  return (
    <div className="brush-step">
      <p className="brush-step-hint">Drag a toothbrush to {kidName}, or tap one to start brushing.</p>

      <div className="brush-step-layout">
        <div className="brush-tray" aria-label="Toothbrush choices">
          {toothbrushes.map((brush) => (
            <button
              key={brush.id}
              type="button"
              className={`brush-card ${draggingBrushId === brush.id ? "brush-card-dragging" : ""}`}
              draggable={!completedBrushId}
              disabled={Boolean(completedBrushId)}
              style={{ "--brush-accent": brush.accentColor } as CSSProperties}
              onClick={() => deliverBrush(brush.id)}
              onDragStart={(event) => {
                event.dataTransfer.effectAllowed = "move";
                event.dataTransfer.setData("text/plain", brush.id);
                setDraggingBrushId(brush.id);
              }}
              onDragEnd={() => setDraggingBrushId(null)}
            >
              <span className="brush-card-emoji" aria-hidden="true">
                {brush.emoji}
              </span>
              <span className="brush-card-label">{brush.label}</span>
            </button>
          ))}
        </div>

        <div
          className={`brush-target ${completedBrush ? "brush-target-complete" : ""}`}
          onDragOver={(event) => {
            if (!completedBrushId) {
              event.preventDefault();
              event.dataTransfer.dropEffect = "move";
            }
          }}
          onDrop={(event) => {
            event.preventDefault();
            const brushId = event.dataTransfer.getData("text/plain");
            if (brushId) {
              deliverBrush(brushId);
            }
            setDraggingBrushId(null);
          }}
        >
          <div className="brush-target-mouth" aria-hidden="true">
            {completedBrush ? "✨" : "😁"}
          </div>
          <div className="brush-target-copy">
            <strong>
              {completedBrush ? `${kidName}'s teeth are all shiny.` : `Brush ${kidName}'s teeth`}
            </strong>
            <span>
              {completedBrush
                ? `${completedBrush.label} finished the bedtime brushing.`
                : "Drop a toothbrush here to help with brushing time."}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
