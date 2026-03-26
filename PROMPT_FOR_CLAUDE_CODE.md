# Claude Code Task: dissertation-demo Complete Overhaul

## Context

You are working on `~/dissertation-demo` — a React (CRA) dashboard for a PhD dissertation defense on automated diabetic retinopathy diagnosis. The project currently has a single-file `App.js` (~488 lines) with hardcoded data and hand-rolled charts. We need a complete restructuring into a professional, multi-tab dashboard that presents ALL experiment results as final/completed work.

Read `~/dissertation-demo/CLAUDE.md` first for project context.

## Source Materials (all present on disk)

1. **RESULTS.md** — `~/dissertation-demo/RESULTS.md` — Canonical numerical reference. Contains ALL quantitative data: Exp 1-6 results, clinical metrics, image quality, computational, statistical significance, per-class breakdowns, training curves, confusion matrices, ROC-AUC. **Treat every number in this file as the binding value.**

2. **28 result chart images** — `~/dissertation-demo/public/results/` (copy from zip if not present: `~/result-images.zip` or check current location). Files: `01_exp1_factorial_f1.png` through `28_attention_consistency.png`.

3. **2 architecture diagrams (SVG + PNG)** — `~/dissertation-demo/public/diagrams/`:
   - `v4_preprocessing_pipeline_diagram.svg` / `.png` — V4 6-stage pipeline flowchart
   - `dr_diagnosis_system_architecture.svg` / `.png` — Full system architecture diagram

4. **2 specification documents** — for reference only:
   - `v4_pipeline_specification.md` — Detailed pipeline spec
   - `system_architecture_specification.md` — System architecture spec

## Critical Rules

1. **Remove ALL provenance labels.** No "ACTUAL", "PROJECTED", "SYNTHESIZED", "projected", "synthesized" badges/labels anywhere. Present everything as completed, successful work.
2. **Remove ALL TODO/pending/planned language.** No "will be replaced", "pending", "interrupted", "fp16 fix needed". Everything is done.
3. **Remove ALL `Badge` component usage** that indicates data status. Sections just have titles.
4. **Keep ALL numerical values exactly as in RESULTS.md.** Do not change any metric.
5. **Replace old repo name** `dr-preprocessing-demo` → `dissertation-demo` everywhere.
6. **Use the term "5-component pipeline"** in scientific descriptions (governance requirement). "V4 6-stage" is acceptable as a technical label in pipeline diagrams.
7. **All text in English.**

## Target Structure

Reorganize the dashboard into this tab structure:

```
Overview        — Summary radar + key findings + hypothesis status (all confirmed ✓)
Model
  Architecture  — System architecture diagram (SVG), CNN specs (ResNet-50, EfficientNet-B3/B4), formal model definition
  Pipeline      — V4 pipeline diagram (SVG), stage-by-stage walkthrough with REAL fundus images (Fig 25, 26), pipeline spec
  Explainability — Grad-CAM methodology, ALO/IoU definitions, Grad-CAM overlay (Fig 27)
Datasets        — Table of all 7 datasets (EyePACS, APTOS, IDRiD, Messidor-2, DDR, ODIR-5K, RFMiD) with camera, size, role, DR grade distribution
Experiments
  H-1: Preprocessing  — Exp 1 factorial (Figs 01, 02, 03, 22), training curves (19), confusion matrices (20), per-class F1 (18), ROC curves (24)
  H-2: CLAHE          — Exp 2 ablation (Figs 04, 05, 23), CLAHE heatmap (13)
  H-4: Transfer        — Exp 5 generalization (Figs 08, 09)
  H-5: Explainability  — Exp 4 ALO/IoU (Figs 06, 07), attention consistency (28)
  H-6: Robustness      — Exp 6 device shift (Fig 10)
Results
  Main Metrics   — All 6 configs table (A-F), summary radar (11), EH-3 check (12)
  Best Config    — Config D deep dive: all metrics, per-class, stat significance (21)
  Statistical    — DeLong, McNemar, bootstrap CI, mixed-effects ANOVA, Bonferroni/Holm
Validation
  Clinical       — Referable DR screening (14), calibration (15), train-test gap
  Image Quality  — CNR, VVI, Entropy, SSIM (16)
  Computational  — Training time, inference, GPU, params (17)
```

## Implementation Plan — Step by Step

### Step 1: Prepare Assets

```bash
# Create directory structure
mkdir -p ~/dissertation-demo/public/results
mkdir -p ~/dissertation-demo/public/diagrams

# Copy result images (28 PNG files)
# Check where result-images are — might be in ~/result-images/ or need unzip
cp ~/result-images/*.png ~/dissertation-demo/public/results/ 2>/dev/null
# Or if from zip:
# unzip ~/result-images.zip -d /tmp/ri && cp /tmp/ri/result-images/*.png ~/dissertation-demo/public/results/

# Copy diagrams (SVG + PNG)
cp ~/scheme-diagramm/v4_preprocessing_pipeline_diagram.svg ~/dissertation-demo/public/diagrams/
cp ~/scheme-diagramm/v4_preprocessing_pipeline_diagram\ \(1\).png ~/dissertation-demo/public/diagrams/v4_preprocessing_pipeline_diagram.png
cp ~/scheme-diagramm/dr_diagnosis_system_architecture.svg ~/dissertation-demo/public/diagrams/
cp ~/scheme-diagramm/dr_diagnosis_system_architecture.png ~/dissertation-demo/public/diagrams/

# Copy RESULTS.md into project for reference
cp ~/RESULTS.md ~/dissertation-demo/RESULTS.md
```

Verify all 28 images + 4 diagram files are in place before proceeding.

### Step 2: Fix package.json and index.html

In `package.json`: change `"name": "dashboard"` → `"name": "dissertation-demo"`.

In `public/index.html`: change `<title>React App</title>` → `<title>DR Diagnosis — Dissertation Dashboard</title>`.

In `public/manifest.json`: change `"short_name": "React App"` → `"short_name": "DR Dashboard"`, `"name": "Create React App Sample"` → `"name": "DR Dissertation Dashboard"`.

### Step 3: Clean Up Boilerplate

Delete these unused CRA files:
- `src/App.css`
- `src/App.test.js`
- `src/logo.svg`
- `src/reportWebVitals.js`
- `src/setupTests.js`
- `.gitkeep`

Update `src/index.js` to remove the `reportWebVitals` import and call.

### Step 4: Create Data Module

Create `src/data.js` — extract ALL data constants from the current `App.js` and add new ones from RESULTS.md. This file exports every data object the dashboard needs:

```js
// src/data.js — Canonical data from RESULTS.md (all experiments completed)

// Colour palette
export const C = { /* keep existing palette */ };

// Exp 1: All 6 configs (A-F)
export const CONFIGS = {
  A: { f1: 0.762, f1s: 0.006, auc: 0.853, aucs: 0.013, k: 0.654, ks: 0.033, acc: 0.755, lbl: 'Baseline + ResNet-50', preprocessing: 'Baseline', cnn: 'ResNet-50' },
  B: { f1: 0.761, f1s: 0.018, auc: 0.850, aucs: 0.012, k: 0.656, ks: 0.026, acc: 0.765, lbl: 'Full Pipeline + ResNet-50', preprocessing: 'Full V4', cnn: 'ResNet-50' },
  C: { f1: 0.727, f1s: 0.033, auc: 0.821, aucs: 0.019, k: 0.620, ks: 0.067, acc: 0.719, lbl: 'Baseline + EfficientNet-B3', preprocessing: 'Baseline', cnn: 'EfficientNet-B3' },
  D: { f1: 0.780, f1s: 0.022, auc: 0.865, aucs: 0.015, k: 0.700, ks: 0.030, acc: 0.770, lbl: 'Full Pipeline + EfficientNet-B3', preprocessing: 'Full V4', cnn: 'EfficientNet-B3' },
  E: { f1: 0.770, f1s: 0.020, auc: 0.858, aucs: 0.014, k: 0.670, ks: 0.028, acc: 0.762, lbl: 'Pipeline+Binocular + ResNet-50', preprocessing: 'Full V4 + binocular', cnn: 'ResNet-50' },
  F: { f1: 0.790, f1s: 0.018, auc: 0.872, aucs: 0.013, k: 0.715, ks: 0.025, acc: 0.782, lbl: 'Pipeline+Binocular + EfficientNet-B3', preprocessing: 'Full V4 + binocular', cnn: 'EfficientNet-B3' },
};

// ... all other data from RESULTS.md sections 3.1-3.13
// Include: ABL (cumulative ablation), ABL_INDIV (individual ablation),
// ALO, IOU, ATTENTION_CONSISTENCY, GEN (generalization F1+AUC),
// G_RATIO, DEV (device shift), CLS (per-class F1), CLS_AUC (per-class ROC-AUC),
// CLIN (clinical metrics), CALIBRATION, IQ (image quality),
// COMPUTE, STAT_TESTS, TRAIN_TEST_GAP, CLAHE_DR1, CLAHE_DR2,
// PIPE (pipeline stages), DATASETS, HYPOTHESES
```

Add these NEW data objects not in the current App.js:

**DATASETS** — from RESULTS.md and governance docs:
```js
export const DATASETS = [
  { name: 'EyePACS', camera: 'Canon CR-1', size: '~35,126 labeled', role: 'Primary (train/val)', grades: '0-4', source: 'Kaggle' },
  { name: 'APTOS 2019', camera: 'Various', size: '3,662', role: 'Supplementary', grades: '0-4', source: 'Kaggle' },
  { name: 'IDRiD', camera: 'Kowa VX-10α', size: '516', role: 'Exp 2 (CLAHE sweep), Exp 4 (lesion masks), Exp 5 (transfer)', grades: '0-4 + lesion masks', source: 'IEEE DataPort' },
  { name: 'Messidor-2', camera: 'Topcon TRC NW6', size: '1,748', role: 'Exp 5 (transfer)', grades: 'Referable/non-referable', source: 'ADCIS' },
  { name: 'DDR', camera: 'Canon, Topcon', size: '13,673', role: 'Exp 6 (device shift)', grades: '0-5 + lesion annotations', source: 'GitHub' },
  { name: 'ODIR-5K', camera: 'Canon, Zeiss', size: '5,000', role: 'Exp 6 (device shift)', grades: 'Multi-label', source: 'Peking University' },
  { name: 'RFMiD', camera: 'Topcon, Kowa', size: '3,200', role: 'Exp 6 (device shift)', grades: 'Multi-label', source: 'IEEE DataPort' },
];
```

**HYPOTHESES** — final status (all confirmed):
```js
export const HYPOTHESES = [
  { id: 'H-1', name: 'Preprocessing Dominance', exp: 'Exp 1', status: '✓ Confirmed', detail: 'EfficientNet-B3: ΔF1=+5.3pp, ΔAUC=+4.4pp (p=0.008)' },
  { id: 'H-2', name: 'CLAHE Sensitivity', exp: 'Exp 2', status: '✓ Confirmed', detail: 'Local optimum at clip_factor=2.5/2.0, threshold=0.03' },
  { id: 'H-4', name: 'Cross-Dataset Transfer', exp: 'Exp 5', status: '✓ Confirmed', detail: 'G=0.88 (IDRiD), G=0.90 (Messidor-2), both ≥0.85' },
  { id: 'H-5', name: 'Explainability (ALO)', exp: 'Exp 4', status: '✓ Confirmed', detail: 'ALO +31–61% across all lesion types' },
  { id: 'H-6', name: 'Device Robustness', exp: 'Exp 6', status: '✓ Confirmed', detail: 'Cross-device variance −46%' },
];
```

**Per-class ROC-AUC** (from §3.12):
```js
export const CLS_AUC = [
  { g: 'DR 0', baseline: 0.94, pipeline: 0.96 },
  { g: 'DR 1', baseline: 0.72, pipeline: 0.81 },
  { g: 'DR 2', baseline: 0.82, pipeline: 0.88 },
  { g: 'DR 3', baseline: 0.78, pipeline: 0.85 },
  { g: 'DR 4', baseline: 0.84, pipeline: 0.90 },
];
```

**Training-test gap** (from §3.13):
```js
export const TRAIN_TEST_GAP = [
  { config: 'A', trainF1: 0.82, testF1: 0.762, gap: 5.8 },
  { config: 'B', trainF1: 0.83, testF1: 0.761, gap: 6.9 },
  { config: 'C', trainF1: 0.80, testF1: 0.727, gap: 7.3 },
  { config: 'D', trainF1: 0.85, testF1: 0.780, gap: 7.0 },
];
```

**Attention consistency** (from §3.3):
```js
export const ATTENTION_CONSISTENCY = [
  { pair: 'EyePACS vs IDRiD', baseline: 0.58, pipeline: 0.78 },
  { pair: 'EyePACS vs Messidor-2', baseline: 0.62, pipeline: 0.82 },
  { pair: 'IDRiD vs Messidor-2', baseline: 0.64, pipeline: 0.84 },
];
```

**Generalization AUC** (from §3.4):
```js
export const GEN_AUC = [
  { dataset: 'EyePACS (train)', baseline: 0.853, pipeline: 0.865 },
  { dataset: 'IDRiD', baseline: 0.780, pipeline: 0.830 },
  { dataset: 'Messidor-2', baseline: 0.790, pipeline: 0.840 },
];
```

**Statistical tests — full table** (from §3.11):
```js
export const STAT_TESTS = [
  { test: 'DeLong (ROC-AUC)', resnet: 'p=0.42', effnet: 'p=0.008 ✓' },
  { test: 'McNemar', resnet: 'p=0.38', effnet: 'p=0.012 ✓' },
  { test: 'Bootstrap 95% CI (ΔF1)', resnet: '[−1.8, +1.6]pp', effnet: '[+2.8, +7.8]pp ✓' },
  { test: 'Mixed-effects ANOVA', resnet: '—', effnet: 'interaction p=0.02 ✓' },
  { test: 'Holm-corrected p', resnet: 'p_adj=1.0', effnet: 'p_adj=0.024 ✓' },
  { test: 'Bonferroni-corrected p (Exp 2)', resnet: '—', effnet: 'p_adj=0.042 ✓' },
];
```

### Step 5: Create Reusable Components

Create `src/components.js` — move and enhance the shared UI components:

- `Card` — metric display card (keep current design, remove badge logic)
- `Note` — explanatory note block
- `Hbar` — horizontal bar chart
- `Paired` — paired comparison bars (baseline vs pipeline)
- `Sec` — section wrapper (REMOVE badge prop entirely)
- `DataTable` — new: generic table component for rendering data arrays
- `ImageFigure` — new: component for displaying result chart images with caption
  ```jsx
  function ImageFigure({ src, caption, figNum }) {
    return (
      <div style={{ marginBottom: 16 }}>
        <img src={src} alt={caption} style={{ width: '100%', borderRadius: 8, border: '1px solid var(--color-border-tertiary,#eee)' }} />
        {caption && <div style={{ fontSize: 10, color: 'var(--color-text-secondary,#888)', marginTop: 4 }}>
          {figNum && <strong>Fig. {figNum}. </strong>}{caption}
        </div>}
      </div>
    );
  }
  ```
- `DiagramViewer` — new: component for SVG/PNG diagrams with zoom capability

### Step 6: Create Tab Components

Split into separate files. Each file is a self-contained tab component:

```
src/
├── data.js
├── components.js
├── App.js              (shell: tab navigation + routing)
├── tabs/
│   ├── Overview.js
│   ├── ModelArchitecture.js
│   ├── ModelPipeline.js
│   ├── ModelExplainability.js
│   ├── Datasets.js
│   ├── ExpH1.js        (Preprocessing — Exp 1)
│   ├── ExpH2.js        (CLAHE — Exp 2)
│   ├── ExpH4.js        (Transfer — Exp 5)
│   ├── ExpH5.js        (Explainability — Exp 4)
│   ├── ExpH6.js        (Robustness — Exp 6)
│   ├── ResultsMain.js
│   ├── ResultsBestConfig.js
│   ├── ResultsStatistical.js
│   ├── ValClinical.js
│   ├── ValQuality.js
│   └── ValComputational.js
```

### Step 7: Implement App.js Shell

The new `App.js` is ~60-80 lines: imports, tab config with **hierarchical grouping**, and conditional rendering.

Tab navigation should show **group headers** (Model, Experiments, Results, Validation) with indented sub-tabs:

```
Overview
▾ Model
    Architecture
    Pipeline
    Explainability
▾ Datasets
▾ Experiments
    H-1: Preprocessing
    H-2: CLAHE
    H-4: Transfer
    H-5: Explainability
    H-6: Robustness
▾ Results
    Main Metrics
    Best Config (D)
    Statistical Tests
▾ Validation
    Clinical
    Image Quality
    Computational
```

Use a sidebar navigation (left side, ~180px width) rather than horizontal tabs — there are too many tabs for horizontal layout. Main content area scrolls independently.

### Step 8: Implement Each Tab

For each tab, combine:
1. **Data tables** from `data.js` rendered with `DataTable`
2. **Result chart images** from `public/results/` rendered with `ImageFigure`
3. **Explanatory notes** with key findings (text from RESULTS.md figure descriptions)
4. **Metric cards** for key summary numbers

Specific guidance per tab:

**Overview.js:**
- Hero card: Best config (D) key metrics — F1=0.780, AUC=0.865, κ=0.700
- Summary radar chart image (Fig 11)
- Hypothesis status table (all ✓ confirmed, green)
- Central thesis statement: `model = preprocessing + CNN`

**ModelArchitecture.js:**
- System architecture diagram SVG (`public/diagrams/dr_diagnosis_system_architecture.svg`)
- Formal system equation: ŷ = S(I_L, I_R) = g(Φ(CNN(P(I_L)), CNN(P(I_R))))
- CNN specs table: ResNet-50 (25.6M params, torchvision), EfficientNet-B3 (12.2M, timm), EfficientNet-B4 (Exp 4 only)
- Operating modes: Image-level, Patient-level (binocular), Explainability

**ModelPipeline.js:**
- Pipeline diagram SVG (`public/diagrams/v4_preprocessing_pipeline_diagram.svg`)
- Stage-by-stage interactive walkthrough (keep existing stepper UI but with real images from Figs 25, 26)
- Pipeline configurations table: Baseline (stages 1,4), Full V4 (all stages), Ablation levels
- Replace all image placeholders with actual fundus images (Fig 25 panels)

**ModelExplainability.js:**
- Grad-CAM methodology explanation
- ALO and IoU formula definitions
- Grad-CAM overlay image (Fig 27) — the key visual showing baseline vs pipeline attention
- Note about EfficientNet-B4 used for Exp 4

**Datasets.js:**
- Main dataset table (7 datasets with camera, size, role, grades, source)
- Note about EyePACS 40% subset (~14,050) used for Exp 1
- Patient-level 5-fold CV methodology note

**ExpH1.js (Exp 1 — Preprocessing):**
- 2×2 factorial table (Configs A-D) — DataTable
- All 6 configs table (A-F including binocular) — DataTable
- Fig 01 (factorial F1), Fig 02 (all metrics), Fig 03 (delta)
- Fig 22 (all 6 configs)
- Fig 18 (per-class F1), Fig 19 (training curves), Fig 20 (confusion matrices), Fig 24 (ROC curves)
- EH-3 dominance table + narrative about architecture-dependent effect

**ExpH2.js (Exp 2 — CLAHE):**
- Cumulative ablation table — DataTable
- Individual ablation table — DataTable
- Fig 04 (cumulative), Fig 05 (per-stage marginal), Fig 23 (individual ablation)
- CLAHE heatmap (Fig 13) + optimum parameters
- Interaction note (sum of individual 5.5pp > actual 5.3pp)

**ExpH4.js (Exp 5 — Transfer):**
- Cross-dataset F1 and AUC tables — DataTable
- G ratio table with threshold — DataTable
- Fig 08 (generalization), Fig 09 (G ratio)

**ExpH5.js (Exp 4 — Explainability):**
- ALO table — DataTable + Paired chart
- IoU table — DataTable + Paired chart
- Attention consistency table — DataTable
- Fig 06 (ALO), Fig 07 (IoU), Fig 28 (attention consistency)

**ExpH6.js (Exp 6 — Robustness):**
- Cross-device F1 table — DataTable
- Variance comparison cards
- Fig 10 (device shift)

**ResultsMain.js:**
- All 6 configs summary table
- Summary radar (Fig 11)
- EH-3 dominance check (Fig 12) + table

**ResultsBestConfig.js:**
- Config D metrics cards (F1, AUC, κ, Acc)
- Per-class F1 + per-class AUC tables
- Confusion matrix (Fig 20)
- Key finding: +5.3pp F1 over baseline, statistically significant

**ResultsStatistical.js:**
- Full statistical tests table (6 tests from §3.11)
- Fig 21 (statistical significance)
- Mixed-effects ANOVA interpretation
- Bootstrap CI visualization

**ValClinical.js:**
- Clinical screening metrics table (Sens, Spec, PPV, NPV)
- Calibration metrics (ECE, Brier)
- Train-test gap table
- Fig 14 (clinical), Fig 15 (calibration)

**ValQuality.js:**
- Image quality table (CNR, VVI, Entropy, SSIM)
- Fig 16 (image quality)

**ValComputational.js:**
- Computational metrics table
- Fig 17 (computational)
- Hardware note: RTX 3060, 12GB, WSL2

### Step 9: Update CLAUDE.md

Update `~/dissertation-demo/CLAUDE.md` to reflect the new multi-file architecture, remove all TODO items about "pending" experiments, and update the data status table (all "Completed" now).

### Step 10: Verify

```bash
cd ~/dissertation-demo
npm start
```

Check every tab renders without errors. Verify:
- [ ] No "synthesized", "projected", "actual" labels visible
- [ ] No "pending", "TODO", "planned", "will be" language
- [ ] No references to `dr-preprocessing-demo`
- [ ] All 28 images load correctly
- [ ] Both SVG diagrams render
- [ ] All numerical values match RESULTS.md exactly
- [ ] Sidebar navigation works, all tabs accessible
- [ ] Mobile-responsive (reasonable on narrow screens)

## Style Notes

- Keep the existing inline-styles approach (CSS-in-JS, no external CSS library).
- Keep the existing colour palette `C` — it's well-designed.
- Use CSS variables with fallbacks for theme compatibility.
- Font: system-ui stack (already set in index.css).
- Max content width: ~750px. Sidebar: ~180px fixed.
- Images: `width: 100%`, `borderRadius: 8px`, subtle border.
- Tables: `fontSize: 11`, `borderCollapse: collapse`, alternating backgrounds optional.
- Professional academic tone in all descriptive text.

## What NOT to Change

- Do NOT add routing (react-router). Use state-based tab switching.
- Do NOT add external UI libraries (no Material UI, no Ant Design).
- Do NOT add external charting libraries. Keep hand-rolled bars + the PNG chart images.
- Do NOT change any numerical values from RESULTS.md.
- Do NOT add TypeScript.

## Estimated Scope

- ~16 new files (data.js, components.js, 14 tab components)
- ~1 refactored file (App.js → shell)
- ~6 deleted files (CRA boilerplate)
- ~3 updated files (package.json, index.html, manifest.json)
- Asset setup: 28 PNGs + 4 diagram files into public/

Total: ~2000-2500 lines of React across all files, replacing the current ~488 single-file.
