import { getAssetById, kids, outfits, toRuntimeAssetUrl } from "../../game/content";

export function KidAvatar({
  kidId,
  outfitId,
  label,
  size = "regular"
}: {
  kidId: string;
  outfitId?: string;
  label: string;
  size?: "regular" | "large";
}) {
  const kid = kids.find((entry) => entry.id === kidId)!;
  const kidAsset = getAssetById(kid.baseAssetId);
  const outfit = outfitId ? outfits.find((entry) => entry.id === outfitId) ?? null : null;
  const outfitAsset = outfit ? getAssetById(outfit.assetId) : null;

  return (
    <div
      className={`avatar-stack avatar-stack-${size} ${outfitAsset ? "avatar-stack-dressed" : ""}`}
      aria-label={label}
    >
      <img src={toRuntimeAssetUrl(kidAsset.imageFile)} alt={label} className="avatar-base" />
      {outfitAsset ? (
        <div className="avatar-outfit-chip" aria-hidden="true">
          <img
            src={toRuntimeAssetUrl(outfitAsset.imageFile)}
            alt=""
            className="avatar-overlay"
          />
        </div>
      ) : null}
    </div>
  );
}
