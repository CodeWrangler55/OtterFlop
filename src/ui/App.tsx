import {
  assetCatalog,
  kids,
  outfits,
  parentAssets,
  sceneAssets
} from "../game/content";
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

  if (!loadSave()) {
    saveGame(save);
  }

  return (
    <main className="app-shell">
      <section className="hero">
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
          <ul>
            <li>Kid IDs: {kids.map((kid) => kid.id).join(", ")}</li>
            <li>Outfit IDs: {outfits.map((outfit) => outfit.id).join(", ")}</li>
            <li>Scene assets: {sceneAssets.length}</li>
            <li>Parent assets: {parentAssets.length}</li>
          </ul>
        </article>

        <article className="panel">
          <h2>Asset prompt catalog</h2>
          <ul>
            <li>Total assets: {assetCatalog.length}</li>
            <li>Prompt files: one per asset ID in <code>assets/prompts/</code></li>
            <li>Export preview bytes: {exportSaveToJson(save).length}</li>
          </ul>
        </article>
      </section>
    </main>
  );
}

