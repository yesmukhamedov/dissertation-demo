# CLAUDE.md — dissertation-demo

## Project identity

**Repository:** `yesmukhamedov/dissertation-demo`
**Purpose:** Interactive React dashboard for PhD dissertation defense. Visualises all experiment results, hypothesis status, and the V4 preprocessing pipeline walkthrough.
**Stack:** React 19 (Create React App), single-page app, no router, no external UI library.
**Deployed at:** Local (`npm start` → localhost:3000) for defense presentation; may be deployed to GitHub Pages later via `npm run build`.

## Relationship to other repos

| Repo | Role | Interaction |
|---|---|---|
| `dissertation` | Governance docs, chapter text, literature cards | Dashboard data constants must match governance numbers exactly |
| `dr-classifier` | Experiment codebase (Python/PyTorch) | Actual experiment outputs → update dashboard data constants |

**Data flow:** `dr-classifier` runs → produces metrics JSON/logs → numbers are transcribed into `App.js` data constants (`p`, `ABL`, `ALO`, `GEN`, `DEV`, `CLS`, `CLIN`, `IQ`, `CLAHE1/2`, `PIPE`).

## Architecture

```
dissertation-demo/
├── public/              # CRA static assets (favicon, index.html)
├── src/
│   ├── App.js           # ★ ALL dashboard logic — single-file architecture
│   ├── App.css          # Unused CRA boilerplate (can be deleted)
│   ├── index.js         # CRA entry point
│   └── index.css        # Base body styles
├── package.json         # CRA + React 19
└── .gitignore
```

### App.js structure

The entire dashboard lives in `src/App.js` (~500 lines). Structure:

1. **Data constants** (lines ~3–80): `C` (colours), `p` (Exp1 configs A/B/C/D), `ABL` (ablation), `ALO` (lesion overlap), `GEN` (generalization), `DEV` (device robustness), `CLS` (per-class F1), `CLIN` (clinical metrics), `IQ` (image quality), `CLAHE1/2` (heatmap grids), `PIPE` (pipeline stages).
2. **Reusable components** (~80–160): `Badge`, `Card`, `Note`, `Hbar`, `Paired`, `Sec`.
3. **Tab definitions** (`TABS` array): `overview`, `exp1`, `exp2`, `exp4`, `exp5`, `exp6`, `clinical`, `quality`, `compute`, `pipe`.
4. **Main `App` component** (~165–end): Tab navigation + conditional renders per tab.

### Design decisions

- **Single-file intentionally.** Defense demo, not a production app. Keep it simple for quick edits.
- **No external charting library.** All charts are hand-rolled divs/SVGs — full control, zero dependencies.
- **CSS-in-JS (inline styles).** No build tooling complexity. Uses CSS variables for theme compatibility (`--color-text-primary`, `--color-background-secondary`, etc.) with hardcoded fallbacks.
- **Colour palette** in constant `C` — blue/teal/coral/purple/amber/gray/green/red with Bg (background) and T (text) variants.

## Data status

| Data constant | Source | Status |
|---|---|---|
| `p` (A/B/C) | Exp 1 actual results | ✅ Actual (3-fold CV, 40% EyePACS) |
| `p` (D) | Projected | ⚡ Pending — Config D interrupted by fp16 overflow |
| `ABL`, `ALO`, `GEN`, `DEV`, `CLS`, `CLIN`, `IQ` | Synthesized/projected | 🟣 Will be replaced with actual results |
| `CLAHE1/2` | Synthesized | 🟣 Will be replaced after Exp 2 |
| `PIPE` | Pipeline spec | ✅ Stable (V4 6-stage) |

**Critical rule:** When updating data from actual experiment results, update BOTH the data constant AND the corresponding badge (change `'projected'`/`'synthesized'` → `'actual'`).

## Dissertation governance alignment

The dashboard must respect these invariants from `DISSERTATION_INVARIANTS.md`:

- **Pipeline:** "5-component pipeline" (Stages 0a, 0b, 1, 2, 3 + normalization + augmentation = V4 6-stage total). Never say "6-stage pipeline" in scientific claims — it's "5-component" where components are the scientifically novel contributions.
- **EyePACS size:** ~35,126 labeled images (not 35,000 or 88,000).
- **Exp 1 subset:** 40% EyePACS (~14,050 images), 3-fold CV.
- **Hypotheses:** H-1 through H-6 (H-3 dropped in V3). Dashboard shows H-1, H-2, H-4, H-5, H-6.
- **ALO** is primary explainability metric; IoU is secondary.
- **EH-3 threshold:** ΔF1 ≥ 5pp, ΔAUC ≥ 2pp, independently for both architectures.
- **H-4 threshold:** Generalization ratio G ≥ 0.85.
- **Standard preprocessing** (Config A/C) = conventional techniques (not resize-only).

## Development workflow

```bash
# Start dev server
cd ~/dissertation-demo
npm start          # → localhost:3000

# Build for deployment
npm run build      # → build/ directory
```

### Common tasks

**Update experiment data:** Edit data constants at top of `App.js` → change badge type → verify tab renders correctly.

**Add a new tab:**
1. Add entry to `TABS` array
2. Add `{tab === 'newtab' && <>...</>}` block in the main render
3. Use existing components (`Sec`, `Card`, `Hbar`, `Paired`, `Note`, `Badge`)

**Add pipeline images (future):**
Replace placeholder div in the `pipe` tab with `<img>` tags pointing to actual fundus images. Images will come from the preprocessing pipeline output.

## Coding conventions

- All inline styles (no CSS classes except CRA boilerplate).
- Component names: PascalCase. Data constants: short uppercase or camelCase.
- Numbers always to 3 decimal places for metrics (`.toFixed(3)`), percentages as `pp` (percentage points).
- Badge types: `'actual'` (green), `'projected'` (amber), `'synthesized'` (purple).
- Tab IDs match experiment numbers: `exp1`, `exp2`, `exp4`, `exp5`, `exp6` (no `exp3` — H-3 dropped).

## Known issues / TODO

- [ ] Config D results pending (fp16 fix → rerun → update `p.D` + change badge to `'actual'`)
- [ ] Replace synthesized data with actual experiment results as experiments complete
- [ ] Pipeline tab: add actual fundus images (currently placeholders)
- [ ] `public/index.html`: update `<title>` from "React App" to dissertation title
- [ ] `App.css`: CRA boilerplate, unused — can delete
- [ ] `package.json` `name` field is "dashboard" — rename to "dissertation-demo"
- [ ] Add GitHub Pages deployment config (`homepage` field + `gh-pages` package)
- [ ] Consider splitting `App.js` into separate tab components if it grows past ~800 lines
