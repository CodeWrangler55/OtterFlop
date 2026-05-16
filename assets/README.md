# Assets

This folder is the review-first asset pipeline for OtterFlop.

## Rules

- Every asset has one stable ID.
- That ID is reused everywhere:
  - in the game content model
  - in `assets/catalog.json`
  - in the prompt filename
  - in the generated image filename
- Prompt files are reviewed before image generation.
- Generated images should later land in `assets/generated/` using the same ID-based filename.

## Layout

```text
assets/
|- catalog.json
|- generated/
\- prompts/
```

## Workflow

1. Define or update the asset in `catalog.json`.
2. Edit the matching prompt file in `prompts/`.
3. Review prompts.
4. Generate images later in Codex.
5. Save the resulting bitmap into `generated/` using the same asset ID.

