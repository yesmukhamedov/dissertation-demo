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
| `dr-classifier` | Experiment codebase (Python/PyTorch) | Experiment outputs → data constants in `src/data.js` |

**Data flow:** `dr-classifier` runs → produces metrics → numbers are transcribed into `src/data.js` data constants.

## Architecture

```
dissertation-demo/
├── public/
│   ├── results/          # 28 PNG result charts (01–28)
│   └── diagrams/         # SVG + PNG pipeline and architecture diagrams
├── src/
│   ├── data.js           # ALL data constants (single source of truth)
│   ├── components.js     # Reusable UI components
│   ├── App.js            # Shell: sidebar navigation + conditional rendering (~80 lines)
│   ├── tabs/             # 16 tab components (one file per tab)
│   │   ├── Overview.js
│   │   ├── ModelArchitecture.js
│   │   ├── ModelPipeline.js
│   │   ├── ModelExplainability.js
│   │   ├── Datasets.js
│   │   ├── ExpH1.js
│   │   ├── ExpH2.js
│   │   ├── ExpH4.js
│   │   ├── ExpH5.js
│   │   ├── ExpH6.js
│   │   ├── ResultsMain.js
│   │   ├── ResultsBestConfig.js
│   │   ├── ResultsStatistical.js
│   │   ├── ValClinical.js
│   │   ├── ValQuality.js
│   │   └── ValComputational.js
│   ├── index.js          # CRA entry point
│   └── index.css         # Base body styles
├── package.json
└── .gitignore
```

### App.js structure

`src/App.js` (~80 lines) — shell only:
1. Imports all 16 tab components
2. Defines NAV array with sidebar structure (group headers + tab entries)
3. Renders sidebar navigation + active tab component

### data.js structure

`src/data.js` — all data constants:
- `C` — colour palette
- `CONFIGS` — 6 experiment configurations (A–F)
- `ABL`, `ABL_INDIV` — ablation study data
- `ALO`, `IOU`, `ATTENTION_CONSISTENCY` — explainability metrics
- `GEN`, `GEN_AUC`, `G_RATIO` — generalization metrics
- `DEV` — cross-device robustness
- `CLS`, `CLS_AUC` — per-class metrics
- `CLIN`, `CALIBRATION` — clinical validation
- `IQ` — image quality metrics
- `CLAHE1`, `CLAHE2` — CLAHE heatmap grids
- `PIPE` — pipeline stage definitions
- `COMPUTE` — computational benchmarks
- `STAT_TESTS`, `TRAIN_TEST_GAP` — statistical analysis
- `DATASETS` — 7 datasets used in experiments
- `HYPOTHESES` — 5 hypotheses (H-1, H-2, H-4, H-5, H-6), all confirmed

### components.js exports

- `Card({ label, value, delta, color, sub })` — metric display card
- `Note({ children })` — explanatory note block
- `Hbar({ items, maxV, height })` — horizontal bar chart
- `Paired({ items, c1, c2, l1, l2 })` — paired comparison bars
- `Sec({ title, note, children })` — section wrapper
- `DataTable({ headers, rows, highlightRow })` — generic table
- `ImageFigure({ src, caption, figNum })` — result image with caption
- `DiagramViewer({ src, alt, caption })` — full-width diagram

### Design decisions

- **Multi-file architecture.** Each tab is a separate file in `src/tabs/`. Data is in `src/data.js`. Components in `src/components.js`.
- **Sidebar navigation.** ~192px fixed sidebar with group headers and indented sub-tabs. Active tab highlighted in teal.
- **No external charting library.** All charts are hand-rolled divs — full control, zero dependencies.
- **CSS-in-JS (inline styles).** No build tooling complexity. Uses CSS variables for theme compatibility.
- **No status labels.** Everything presented as completed work.
- **Colour palette** in `C` constant (data.js) — blue/teal/coral/purple/amber/gray/green/red.

## Data status

All experiment data is complete. Results are from the completed experimental runs.

| Data constant | Source | Description |
|---|---|---|
| `CONFIGS` (A–D) | Exp 1 | 3-fold CV, 40% EyePACS |
| `CONFIGS` (E–F) | Exp 1 | Binocular extension |
| `ABL`, `ABL_INDIV` | Exp 2 | CLAHE ablation |
| `ALO`, `IOU` | Exp 4 | Grad-CAM/ALO on IDRiD |
| `GEN`, `GEN_AUC`, `G_RATIO` | Exp 5 | Cross-dataset transfer |
| `DEV` | Exp 6 | Cross-device robustness |
| `CLS`, `CLS_AUC`, `CLIN`, `CALIBRATION` | Exp 1/clinical | Per-class and clinical metrics |
| `STAT_TESTS` | Statistical analysis | DeLong, McNemar, bootstrap CI |
| `PIPE` | Pipeline spec | V4 6-stage pipeline definition |
| `DATASETS` | Dataset registry | 7 datasets used |
| `HYPOTHESES` | Governance | All 5 hypotheses confirmed |

## Dissertation governance alignment

The dashboard respects these invariants from `DISSERTATION_INVARIANTS.md`:

- **Pipeline:** "5-component pipeline" (Stages 0a, 0b, 2, 3, 5 are novel). "V4 6-stage" acceptable as technical label.
- **EyePACS size:** ~35,126 labeled images.
- **Exp 1 subset:** 40% EyePACS (~14,050 images), 3-fold CV.
- **Hypotheses:** H-1, H-2, H-4, H-5, H-6 (H-3 dropped in V3).
- **ALO** is primary explainability metric; IoU is secondary.
- **EH-3 threshold:** ΔF1 ≥ 5pp, ΔAUC ≥ 2pp for EfficientNet-B3.
- **H-4 threshold:** Generalization ratio G ≥ 0.85.

## Development workflow

```bash
# Start dev server
cd ~/dissertation-demo
npm start          # → localhost:3000

# Build for deployment
npm run build      # → build/ directory
```

### Common tasks

**Update experiment data:** Edit constants in `src/data.js` → verify tab renders correctly.

**Add a new tab:**
1. Create `src/tabs/NewTab.js`
2. Import it in `App.js`
3. Add entry to `NAV` array and `COMPONENTS` map in `App.js`
4. Use existing components from `components.js`

**Add/replace result images:**
Use `ImageFigure` component with `src={process.env.PUBLIC_URL + '/results/NN_name.png'}`.

## Coding conventions

- All inline styles (no CSS classes except CRA boilerplate).
- Component names: PascalCase. Data constants: short uppercase or camelCase.
- Numbers to 3 decimal places for metrics (`.toFixed(3)`), percentages as `pp`.
- No status badges anywhere.
- Tab IDs: `exph1`, `exph2`, `exph4`, `exph5`, `exph6` (no `exph3` — H-3 dropped).
- Images use `process.env.PUBLIC_URL` prefix for CRA compatibility.
