import {
  assetCatalog,
  conceptAssets,
  getAssetById,
  kids,
  outfits,
  parentAssets,
  sceneAssets
} from "../game/content";
import { toRuntimeAssetUrl } from "../game/content";
import {
  STORAGE_KEY,
  createInitialSave,
  exportSaveToJson,
  loadSave,
  saveGame
} from "../game/save-game";

const deployUrl = "https://codewrangler55.github.io/OtterFlop/";

export function App() {
  const save = loadSave() ?? createInitialSave();
  const heroScene = sceneAssets.find((scene) => scene.id === "scene-home-bedroom-night");
  const conceptSheet = conceptAssets[0];

  if (!loadSave()) {
    saveGame(save);
  }

  return (
    <main className="app-shell">
      <section
        className="hero"
        style={
          heroScene
            ? {
                backgroundImage: `linear-gradient(rgba(31, 41, 70, 0.18), rgba(31, 41, 70, 0.18)), url(${toRuntimeAssetUrl(heroScene.imageFile)})`
              }
            : undefined
        }
      >
        <p className="eyebrow">OtterFlop foundation</p>
        <h1>OtterFlop</h1>
        <p className="lead">
          A calm bedtime game scaffold for Amazon Fire tablet, built to deploy
          on GitHub Pages and grow through stable content IDs.
        </p>
      </section>

      <section className="panel-grid">
        <article className="panel">
          <h2>GitHub Pages target</h2>
          <p>Base path is pinned for the project site deployment.</p>
          <code>{deployUrl}</code>
        </article>

        <article className="panel">
          <h2>Save foundation</h2>
          <ul>
            <li>Storage key: <code>{STORAGE_KEY}</code></li>
            <li>Schema version: {save.schemaVersion}</li>
            <li>Unlocked kids: {save.unlockedKidIds.length}</li>
            <li>Unlocked outfits: {save.unlockedOutfitIds.length}</li>
            <li>Available spins: {save.spinState.available}</li>
          </ul>
        </article>

        <article className="panel">
          <h2>Content records</h2>
          <div className="character-strip">
            {kids.map((kid) => {
              const asset = getAssetById(kid.baseAssetId);
              return (
                <figure className="character-card" key={kid.id}>
                  <img
                    src={toRuntimeAssetUrl(asset.imageFile)}
                    alt={kid.displayName}
                    className="character-image"
                  />
                  <figcaption>{kid.displayName}</figcaption>
                </figure>
              );
            })}
          </div>
        </article>

        <article className="panel">
          <h2>Parent art</h2>
          <div className="character-strip">
            {parentAssets.map((asset) => (
              <figure className="character-card" key={asset.id}>
                <img
                  src={toRuntimeAssetUrl(asset.imageFile)}
                  alt={asset.label}
                  className="character-image"
                />
                <figcaption>{asset.label}</figcaption>
              </figure>
            ))}
          </div>
        </article>

        <article className="panel panel-wide">
          <h2>Outfit previews</h2>
          <div className="outfit-grid">
            {outfits.map((outfit) => {
              const asset = getAssetById(outfit.assetId);
              return (
                <figure className="outfit-card" key={outfit.id}>
                  <img
                    src={toRuntimeAssetUrl(asset.imageFile)}
                    alt={outfit.displayName}
                    className="outfit-image"
                  />
                  <figcaption>{outfit.displayName}</figcaption>
                </figure>
              );
            })}
          </div>
        </article>

        <article className="panel panel-wide">
          <h2>Asset prompt catalog</h2>
          <ul>
            <li>Total catalog entries: {assetCatalog.length}</li>
            <li>Runtime image assets: {assetCatalog.filter((asset) => asset.status === "generated").length}</li>
            <li>Prompt files: one per asset ID in <code>assets/prompts/</code></li>
            <li>Export preview bytes: {exportSaveToJson(save).length}</li>
          </ul>
          {conceptSheet ? (
            <img
              src={toRuntimeAssetUrl(conceptSheet.imageFile)}
              alt="Concept family lineup"
              className="concept-sheet"
            />
          ) : null}
        </article>
      </section>
    </main>
  );
}
