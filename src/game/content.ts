import assetCatalogJson from "../../assets/catalog.json";

export type AssetType = "kid" | "outfit" | "parent" | "scene" | "prop" | "concept";

export type AssetRecord = {
  id: string;
  type: AssetType;
  label: string;
  group: string;
  promptFile: string;
  imageFile: string;
  status: "prompted" | "generated";
};

export type KidDefinition = {
  id: string;
  displayName: string;
  baseAssetId: string;
};

export type OutfitDefinition = {
  id: string;
  displayName: string;
  assetId: string;
};

type AssetCatalogFile = {
  meta: {
    version: number;
    generatedFor: string;
  };
  assets: AssetRecord[];
};

const assetCatalogFile = assetCatalogJson as AssetCatalogFile;

export const assetCatalog = assetCatalogFile.assets;
export const runtimeAssetCatalog = assetCatalog.filter((asset) => asset.type !== "concept");

export const kids: KidDefinition[] = [
  { id: "kid-pip", displayName: "Pip", baseAssetId: "kid-pip" },
  { id: "kid-moss", displayName: "Moss", baseAssetId: "kid-moss" },
  { id: "kid-bubble", displayName: "Bubble", baseAssetId: "kid-bubble" },
  { id: "kid-ember", displayName: "Ember", baseAssetId: "kid-ember" }
];

export const outfits: OutfitDefinition[] = [
  {
    id: "outfit-pajamas-moon",
    displayName: "Moon Pajamas",
    assetId: "outfit-pajamas-moon"
  },
  {
    id: "outfit-pajamas-stars",
    displayName: "Stars Pajamas",
    assetId: "outfit-pajamas-stars"
  },
  {
    id: "outfit-nightgown-cloud",
    displayName: "Cloud Nightgown",
    assetId: "outfit-nightgown-cloud"
  },
  {
    id: "outfit-sweater-sunset",
    displayName: "Sunset Sweater",
    assetId: "outfit-sweater-sunset"
  },
  {
    id: "outfit-hat-nightcap",
    displayName: "Nightcap",
    assetId: "outfit-hat-nightcap"
  },
  {
    id: "outfit-hat-bow",
    displayName: "Bow Hat",
    assetId: "outfit-hat-bow"
  },
  {
    id: "outfit-accessory-plush-fish",
    displayName: "Plush Fish",
    assetId: "outfit-accessory-plush-fish"
  },
  {
    id: "outfit-accessory-shell-necklace",
    displayName: "Shell Necklace",
    assetId: "outfit-accessory-shell-necklace"
  }
];

export const parentAssets = assetCatalog.filter((asset) => asset.type === "parent");
export const sceneAssets = assetCatalog.filter((asset) => asset.type === "scene");
export const conceptAssets = assetCatalog.filter((asset) => asset.type === "concept");

export const starterKidId = kids[0].id;
export const starterOutfitId = outfits[0].id;

export function hasAssetId(id: string): boolean {
  return assetCatalog.some((asset) => asset.id === id);
}

export function getAssetById(id: string): AssetRecord {
  const asset = assetCatalog.find((entry) => entry.id === id);

  if (!asset) {
    throw new Error(`Unknown asset id: ${id}`);
  }

  return asset;
}

export function toRuntimeAssetUrl(imageFile: string): string {
  return `${import.meta.env.BASE_URL}${imageFile}`;
}
