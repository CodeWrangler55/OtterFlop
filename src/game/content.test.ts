import { describe, expect, it } from "vitest";
import {
  assetCatalog,
  conceptAssets,
  hasAssetId,
  kids,
  outfits,
  starterKidId,
  starterOutfitId
} from "./content";

describe("content catalog", () => {
  it("keeps asset ids unique", () => {
    const ids = assetCatalog.map((asset) => asset.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("keeps one concept sheet entry for review", () => {
    expect(conceptAssets).toHaveLength(1);
    expect(conceptAssets[0].id).toBe("concept-family-lineup");
  });

  it("keeps kid ids aligned with asset ids", () => {
    expect(kids).toHaveLength(4);

    for (const kid of kids) {
      expect(kid.id).toBe(kid.baseAssetId);
      expect(hasAssetId(kid.baseAssetId)).toBe(true);
    }
  });

  it("keeps outfit ids aligned with asset ids", () => {
    for (const outfit of outfits) {
      expect(outfit.id).toBe(outfit.assetId);
      expect(hasAssetId(outfit.assetId)).toBe(true);
    }
  });

  it("uses filenames that match asset ids", () => {
    for (const asset of assetCatalog) {
      expect(asset.promptFile).toContain(`${asset.id}.md`);
      expect(asset.imageFile).toContain(`${asset.id}.png`);
    }
  });

  it("keeps starter unlock ids valid", () => {
    expect(kids.some((kid) => kid.id === starterKidId)).toBe(true);
    expect(outfits.some((outfit) => outfit.id === starterOutfitId)).toBe(true);
  });
});
