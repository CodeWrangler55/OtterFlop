import type { BedtimeStepDefinition, OutfitDefinition } from "../../game/content";
import { getAssetById, toRuntimeAssetUrl } from "../../game/content";
import { LullabyStep } from "./LullabyStep";
import { OtterFlopStep } from "./OtterFlopStep";
import { SnackStep } from "./SnackStep";

export function RoutineStepContent({
  step,
  activeKidId,
  unlockedOutfits,
  selectedOutfitId,
  onSelectOutfit,
  activeKidName = "this otter kid",
  onCompleteSnack = () => undefined,
  onCompleteFlop = () => undefined,
  onCompleteLullaby = () => undefined
}: {
  step: BedtimeStepDefinition;
  activeKidId?: string;
  unlockedOutfits: OutfitDefinition[];
  selectedOutfitId?: string;
  onSelectOutfit: (outfitId: string) => void;
  activeKidName?: string;
  onCompleteSnack?: (snackId: string) => void;
  onCompleteFlop?: () => void;
  onCompleteLullaby?: () => void;
}) {
  if (step.id === "feed") {
    return <SnackStep kidName={activeKidName} onComplete={onCompleteSnack} />;
  }

  if (step.id === "flop" && activeKidId) {
    return (
      <OtterFlopStep
        kidId={activeKidId}
        outfitId={selectedOutfitId}
        onComplete={onCompleteFlop}
      />
    );
  }

  if (step.id === "lullaby") {
    return <LullabyStep onComplete={onCompleteLullaby} />;
  }

  if (step.id === "dress") {
    return (
      <div className="outfit-grid">
        {unlockedOutfits.map((outfit) => {
          const asset = getAssetById(outfit.assetId);
          const selected = selectedOutfitId === outfit.id;

          return (
            <button
              type="button"
              key={outfit.id}
              className={`outfit-card selectable-card ${selected ? "card-selected" : ""}`}
              onClick={() => onSelectOutfit(outfit.id)}
            >
              <img
                src={toRuntimeAssetUrl(asset.imageFile)}
                alt={outfit.displayName}
                className="outfit-image"
              />
              <span>{outfit.displayName}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return null;
}
