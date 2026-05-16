import { useMemo, useState, type CSSProperties } from "react";

export type SnackChoice = {
  id: string;
  label: string;
  emoji: string;
  accentColor: string;
};

export type SnackStepProps = {
  kidName: string;
  onComplete: (snackId: string) => void;
  disabled?: boolean;
  choices?: SnackChoice[];
};

export const defaultSnackChoices: SnackChoice[] = [
  { id: "snack-berries", label: "Berry Bowl", emoji: "🫐", accentColor: "#d6dcff" },
  { id: "snack-crackers", label: "Moon Crackers", emoji: "🌙", accentColor: "#ffe6b8" },
  { id: "snack-apple", label: "Apple Slices", emoji: "🍎", accentColor: "#ffd0d6" }
];

export function SnackStep({
  kidName,
  onComplete,
  disabled = false,
  choices = defaultSnackChoices
}: SnackStepProps) {
  const [draggingSnackId, setDraggingSnackId] = useState<string | null>(null);
  const [deliveredSnackId, setDeliveredSnackId] = useState<string | null>(null);

  const deliveredSnack = useMemo(
    () => choices.find((choice) => choice.id === deliveredSnackId) ?? null,
    [choices, deliveredSnackId]
  );

  function complete(snackId: string) {
    if (disabled || deliveredSnackId) {
      return;
    }

    setDeliveredSnackId(snackId);
    setDraggingSnackId(null);
    onComplete(snackId);
  }

  return (
    <div className="snack-step">
      <p className="snack-step-hint">
        Drag a snack to {kidName}, or tap one to hand it over.
      </p>

      <div className="snack-step-layout">
        <div className="snack-tray" aria-label="Bedtime snacks">
          {choices.map((choice) => {
            const isDragging = draggingSnackId === choice.id;

            return (
              <button
                type="button"
                key={choice.id}
                className={`snack-card ${isDragging ? "snack-card-dragging" : ""}`}
                style={{ "--snack-accent": choice.accentColor } as CSSProperties}
                draggable={!disabled && !deliveredSnackId}
                disabled={disabled || !!deliveredSnackId}
                onClick={() => complete(choice.id)}
                onDragStart={(event) => {
                  event.dataTransfer.effectAllowed = "move";
                  event.dataTransfer.setData("text/plain", choice.id);
                  setDraggingSnackId(choice.id);
                }}
                onDragEnd={() => setDraggingSnackId(null)}
              >
                <span className="snack-card-emoji" aria-hidden="true">
                  {choice.emoji}
                </span>
                <span className="snack-card-label">{choice.label}</span>
              </button>
            );
          })}
        </div>

        <div
          className={`snack-target ${deliveredSnack ? "snack-target-complete" : ""}`}
          aria-label={`${kidName} snack target`}
          onDragOver={(event) => {
            if (disabled || deliveredSnackId) {
              return;
            }

            event.preventDefault();
            event.dataTransfer.dropEffect = "move";
          }}
          onDrop={(event) => {
            event.preventDefault();
            const snackId = event.dataTransfer.getData("text/plain") || draggingSnackId;

            if (snackId) {
              complete(snackId);
            }
          }}
        >
          <div className="snack-target-plate" aria-hidden="true">
            {deliveredSnack ? deliveredSnack.emoji : "🍽️"}
          </div>
          <div className="snack-target-copy">
            <strong>{deliveredSnack ? `${kidName} got a snack` : `Feed ${kidName}`}</strong>
            <span>
              {deliveredSnack
                ? `${deliveredSnack.label} is ready for bedtime.`
                : "Drop a bedtime snack here."}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
