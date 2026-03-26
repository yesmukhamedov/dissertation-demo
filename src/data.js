// src/data.js — Canonical data for DR Diagnosis Dashboard

// Colour palette
export const C = {
  blue: '#378ADD', teal: '#1D9E75', coral: '#D85A30', purple: '#7F77DD',
  amber: '#EF9F27', gray: '#888780', green: '#639922', red: '#E24B4A',
  blueBg: '#E6F1FB', tealBg: '#E1F5EE', coralBg: '#FAECE7', purpleBg: '#EEEDFE',
  amberBg: '#FAEEDA', grayBg: '#F1EFE8', greenBg: '#EAF3DE', redBg: '#FCEBEB',
  blueT: '#0C447C', tealT: '#085041', coralT: '#712B13', purpleT: '#3C3489',
  amberT: '#633806', grayT: '#444441', greenT: '#27500A', redT: '#791F1F',
};

// Exp 1: All 6 configurations (A–F)
export const CONFIGS = {
  A: { f1: 0.762, f1s: 0.006, auc: 0.853, aucs: 0.013, k: 0.654, ks: 0.033, acc: 0.755, lbl: 'Baseline + ResNet-50', preprocessing: 'Baseline', cnn: 'ResNet-50' },
  B: { f1: 0.761, f1s: 0.018, auc: 0.850, aucs: 0.012, k: 0.656, ks: 0.026, acc: 0.765, lbl: 'Full Pipeline + ResNet-50', preprocessing: 'Full V4', cnn: 'ResNet-50' },
  C: { f1: 0.727, f1s: 0.033, auc: 0.821, aucs: 0.019, k: 0.620, ks: 0.067, acc: 0.719, lbl: 'Baseline + EfficientNet-B3', preprocessing: 'Baseline', cnn: 'EfficientNet-B3' },
  D: { f1: 0.780, f1s: 0.022, auc: 0.865, aucs: 0.015, k: 0.700, ks: 0.030, acc: 0.770, lbl: 'Full Pipeline + EfficientNet-B3', preprocessing: 'Full V4', cnn: 'EfficientNet-B3' },
  E: { f1: 0.770, f1s: 0.020, auc: 0.858, aucs: 0.014, k: 0.670, ks: 0.028, acc: 0.762, lbl: 'Pipeline+Binocular + ResNet-50', preprocessing: 'Full V4 + binocular', cnn: 'ResNet-50' },
  F: { f1: 0.790, f1s: 0.018, auc: 0.872, aucs: 0.013, k: 0.715, ks: 0.025, acc: 0.782, lbl: 'Pipeline+Binocular + EfficientNet-B3', preprocessing: 'Full V4 + binocular', cnn: 'EfficientNet-B3' },
};

// Exp 2: Cumulative ablation — 7 rows
export const ABL = [
  { n: 'Baseline (crop+resize+norm)', f1: 0.727, auc: 0.821 },
  { n: '+Canonical flip (0a)', f1: 0.738, auc: 0.830 },
  { n: '+OD-fovea rotation (0b)', f1: 0.748, auc: 0.840 },
  { n: '+Flat-field (Stage 2)', f1: 0.758, auc: 0.848 },
  { n: '+CLAHE (Stage 3)', f1: 0.772, auc: 0.858 },
  { n: '+Augmentation (Stage 5)', f1: 0.778, auc: 0.863 },
  { n: 'Full V4 pipeline', f1: 0.780, auc: 0.865 },
];

// Exp 2: Individual ablation — 5 stages
export const ABL_INDIV = [
  { stage: 'Stage 0a: Canonical flip', individual_f1: 0.8 },
  { stage: 'Stage 0b: OD-fovea rotation', individual_f1: 0.7 },
  { stage: 'Stage 2: Flat-field correction', individual_f1: 1.0 },
  { stage: 'Stage 3: CLAHE (dual-constraint)', individual_f1: 1.4 },
  { stage: 'Stage 5: Augmentation', individual_f1: 0.6 },
];

// Exp 4: ALO by lesion type
export const ALO = [
  { l: 'Microaneurysms', ab: 0.28, ap: 0.45, ib: 0.12, ip: 0.22 },
  { l: 'Hemorrhages', ab: 0.42, ap: 0.62, ib: 0.20, ip: 0.35 },
  { l: 'Hard exudates', ab: 0.55, ap: 0.72, ib: 0.28, ip: 0.42 },
  { l: 'Soft exudates', ab: 0.38, ap: 0.56, ib: 0.18, ip: 0.32 },
];

// Exp 4: IoU by lesion type
export const IOU = [
  { l: 'Microaneurysms', baseline: 0.12, pipeline: 0.22 },
  { l: 'Hemorrhages', baseline: 0.20, pipeline: 0.35 },
  { l: 'Hard exudates', baseline: 0.28, pipeline: 0.42 },
  { l: 'Soft exudates', baseline: 0.18, pipeline: 0.32 },
];

// Exp 4: Attention consistency across dataset pairs
export const ATTENTION_CONSISTENCY = [
  { pair: 'EyePACS vs IDRiD', baseline: 0.58, pipeline: 0.78 },
  { pair: 'EyePACS vs Messidor-2', baseline: 0.62, pipeline: 0.82 },
  { pair: 'IDRiD vs Messidor-2', baseline: 0.64, pipeline: 0.84 },
];

// Exp 5: Cross-dataset generalization — F1
export const GEN = [
  { d: 'EyePACS (train)', fb: 0.762, fp: 0.780 },
  { d: 'IDRiD', fb: 0.620, fp: 0.690, Gb: 0.81, Gp: 0.88 },
  { d: 'Messidor-2', fb: 0.640, fp: 0.700, Gb: 0.84, Gp: 0.90 },
];

// Exp 5: Cross-dataset generalization — AUC
export const GEN_AUC = [
  { dataset: 'EyePACS (train)', baseline: 0.853, pipeline: 0.865 },
  { dataset: 'IDRiD', baseline: 0.780, pipeline: 0.830 },
  { dataset: 'Messidor-2', baseline: 0.790, pipeline: 0.840 },
];

// Exp 5: Generalization ratio G
export const G_RATIO = [
  { dataset: 'IDRiD', G_baseline: 0.81, G_pipeline: 0.88, threshold: 0.85 },
  { dataset: 'Messidor-2', G_baseline: 0.84, G_pipeline: 0.90, threshold: 0.85 },
];

// Exp 6: Cross-device performance — 6 rows
export const DEV = [
  { c: 'Canon CR-1 (EyePACS)', fb: 0.762, fp: 0.780 },
  { c: 'Topcon (Messidor)', fb: 0.640, fp: 0.700 },
  { c: 'Kowa (IDRiD)', fb: 0.620, fp: 0.690 },
  { c: 'Canon+Topcon (DDR)', fb: 0.590, fp: 0.670 },
  { c: 'Canon+Zeiss (ODIR-5K)', fb: 0.560, fp: 0.650 },
  { c: 'Topcon+Kowa (RFMiD)', fb: 0.550, fp: 0.640 },
];

// Per-class F1
export const CLS = [
  { g: 'DR 0', b: 0.88, pp: 0.91, n: 7320 },
  { g: 'DR 1', b: 0.35, pp: 0.47, n: 490 },
  { g: 'DR 2', b: 0.55, pp: 0.62, n: 2840 },
  { g: 'DR 3', b: 0.42, pp: 0.54, n: 390 },
  { g: 'DR 4', b: 0.48, pp: 0.58, n: 260 },
];

// Per-class ROC-AUC
export const CLS_AUC = [
  { g: 'DR 0', baseline: 0.94, pipeline: 0.96 },
  { g: 'DR 1', baseline: 0.72, pipeline: 0.81 },
  { g: 'DR 2', baseline: 0.82, pipeline: 0.88 },
  { g: 'DR 3', baseline: 0.78, pipeline: 0.85 },
  { g: 'DR 4', baseline: 0.84, pipeline: 0.90 },
];

// Clinical metrics
export const CLIN = [
  { m: 'Sensitivity', b: 0.82, v: 0.90 },
  { m: 'Specificity', b: 0.88, v: 0.91 },
  { m: 'PPV', b: 0.76, v: 0.82 },
  { m: 'NPV', b: 0.92, v: 0.96 },
];

// Calibration metrics
export const CALIBRATION = [
  { metric: 'ECE', baseline: 0.082, pipeline: 0.045, improvement: '-45%' },
  { metric: 'Brier Score', baseline: 0.185, pipeline: 0.142, improvement: '-23%' },
];

// Image quality metrics
export const IQ = [
  { m: 'CNR', b: 2.1, a: 3.8, pct: '+81%' },
  { m: 'Vessel Visibility Index', b: 0.45, a: 0.68, pct: '+51%' },
  { m: 'Image Entropy (bits)', b: 6.2, a: 7.1, pct: '+15%' },
  { m: 'SSIM', b: 0.72, a: 0.85, pct: '+18%' },
];

// CLAHE heatmap grids
export const CLAHE1 = [[.32,.35,.37,.36,.34],[.36,.39,.41,.40,.38],[.38,.42,.44,.43,.41],[.40,.44,.47,.46,.43],[.39,.43,.45,.44,.42],[.37,.41,.43,.42,.40],[.35,.38,.40,.39,.37]];
export const CLAHE2 = [[.48,.51,.53,.52,.50],[.52,.55,.58,.57,.54],[.54,.58,.62,.61,.57],[.53,.57,.60,.59,.56],[.51,.55,.57,.56,.54],[.49,.53,.55,.54,.52],[.47,.50,.52,.51,.49]];

// Pipeline stages — 8 entries
export const PIPE = [
  { id: 0, nm: 'Raw input', desc: 'Original bilateral fundus photographs. Variable illumination, vignetting, different eye orientations. Canon CR-1 at EyePACS.', detail: 'Resolution: 3888×2592, 8-bit RGB JPEG' },
  { id: 1, nm: 'Stage 0a: Canonical flip', desc: 'Left eyes (OS) horizontally flipped to right-eye (OD) orientation. Optic disc consistently on the right side.', detail: 'If OS detected → np.fliplr(). OD → passthrough.' },
  { id: 2, nm: 'Stage 0b: OD-fovea rotation', desc: 'Detect optic disc and fovea. Rotate so OD→fovea axis is horizontal. Normalizes retinal orientation across cameras.', detail: 'OD: brightest region (Gaussian-blurred green ch). Fovea: darkest with 2–4× OD-radius distance prior. Fallback if low confidence.' },
  { id: 3, nm: 'Stage 1: FOV crop + resize', desc: 'Detect circular FOV, remove black borders, center, resize to 512×512. Eliminates device-specific border artifacts.', detail: 'Green channel threshold → largest contour → bounding circle. PIL LANCZOS to 512×512.' },
  { id: 4, nm: 'Stage 2: Flat-field correction', desc: 'Remove illumination gradients: corrected = image − GaussianBlur(σ=45) + 128. Preserves local detail.', detail: 'Gaussian σ=45 captures illumination envelope. +128 offset keeps valid range. Per-channel RGB.' },
  { id: 5, nm: 'Stage 3: CLAHE (dual-constraint)', desc: 'Adaptive histogram equalization on LAB L-channel. clip_limit = min(clip_factor×tile_area/256, threshold×tile_area). Stochastic 80% at train.', detail: 'Tile: 8×8. Parameters from Exp 2 sweep. Stochastic = regularization.' },
  { id: 6, nm: 'Stage 4: ImageNet normalization', desc: 'Channel-wise: (pixel − mean) / std with ImageNet statistics [0.485, 0.456, 0.406] / [0.229, 0.224, 0.225].', detail: 'Standard torchvision pretrained normalization.' },
  { id: 7, nm: 'Stage 5: Augmentation (train)', desc: 'Random rotation (±σ° from OD confidence), flips, color jitter, random crop. Train only — not at inference.', detail: '360° rotation justified by circular FOV. σ adapted from Stage 0b confidence.' },
];

// Computational metrics
export const COMPUTE = [
  { metric: 'Parameters', resnet: '25.6M', effnet: '12.2M', unit: '' },
  { metric: 'Train time/epoch', resnet: '8.5', effnet: '12.3', unit: 'min' },
  { metric: 'Inference (baseline)', resnet: '18.2', effnet: '24.5', unit: 'ms/img' },
  { metric: 'Inference (+pipeline)', resnet: '45.3', effnet: '51.8', unit: 'ms/img' },
  { metric: 'Pipeline overhead', resnet: '27.1', effnet: '27.3', unit: 'ms/img' },
  { metric: 'GPU memory (train)', resnet: '4.2', effnet: '6.8', unit: 'GB' },
  { metric: 'Batch size', resnet: '32', effnet: '16', unit: 'images' },
];

// Statistical tests — 6 rows
export const STAT_TESTS = [
  { test: 'DeLong (ROC-AUC)', resnet: 'p=0.42', effnet: 'p=0.008 ✓' },
  { test: 'McNemar', resnet: 'p=0.38', effnet: 'p=0.012 ✓' },
  { test: 'Bootstrap 95% CI (ΔF1)', resnet: '[−1.8, +1.6]pp', effnet: '[+2.8, +7.8]pp ✓' },
  { test: 'Mixed-effects ANOVA', resnet: '—', effnet: 'interaction p=0.02 ✓' },
  { test: 'Holm-corrected p', resnet: 'p_adj=1.0', effnet: 'p_adj=0.024 ✓' },
  { test: 'Bonferroni-corrected p (Exp 2)', resnet: '—', effnet: 'p_adj=0.042 ✓' },
];

// Training-test gap
export const TRAIN_TEST_GAP = [
  { config: 'A', trainF1: 0.82, testF1: 0.762, gap: 5.8 },
  { config: 'B', trainF1: 0.83, testF1: 0.761, gap: 6.9 },
  { config: 'C', trainF1: 0.80, testF1: 0.727, gap: 7.3 },
  { config: 'D', trainF1: 0.85, testF1: 0.780, gap: 7.0 },
];

// Datasets — 7 entries
export const DATASETS = [
  { name: 'EyePACS', camera: 'Canon CR-1', size: '~35,126 labeled', role: 'Primary (train/val)', grades: '0–4', source: 'Kaggle' },
  { name: 'APTOS 2019', camera: 'Various', size: '3,662', role: 'Supplementary', grades: '0–4', source: 'Kaggle' },
  { name: 'IDRiD', camera: 'Kowa VX-10α', size: '516', role: 'Exp 2 (CLAHE sweep), Exp 4 (lesion masks), Exp 5 (transfer)', grades: '0–4 + lesion masks', source: 'IEEE DataPort' },
  { name: 'Messidor-2', camera: 'Topcon TRC NW6', size: '1,748', role: 'Exp 5 (transfer)', grades: 'Referable/non-referable', source: 'ADCIS' },
  { name: 'DDR', camera: 'Canon, Topcon', size: '13,673', role: 'Exp 6 (device shift)', grades: '0–5 + lesion annotations', source: 'GitHub' },
  { name: 'ODIR-5K', camera: 'Canon, Zeiss', size: '5,000', role: 'Exp 6 (device shift)', grades: 'Multi-label', source: 'Peking University' },
  { name: 'RFMiD', camera: 'Topcon, Kowa', size: '3,200', role: 'Exp 6 (device shift)', grades: 'Multi-label', source: 'IEEE DataPort' },
];

// Hypotheses — 5, all confirmed
export const HYPOTHESES = [
  { id: 'H-1', name: 'Preprocessing Dominance', exp: 'Exp 1', status: '✓ Confirmed', detail: 'EfficientNet-B3: ΔF1=+5.3pp, ΔAUC=+4.4pp (p=0.008)' },
  { id: 'H-2', name: 'CLAHE Sensitivity', exp: 'Exp 2', status: '✓ Confirmed', detail: 'Local optimum at clip_factor=2.5/2.0, threshold=0.03' },
  { id: 'H-4', name: 'Cross-Dataset Transfer', exp: 'Exp 5', status: '✓ Confirmed', detail: 'G=0.88 (IDRiD), G=0.90 (Messidor-2), both ≥0.85' },
  { id: 'H-5', name: 'Explainability (ALO)', exp: 'Exp 4', status: '✓ Confirmed', detail: 'ALO +31–61% across all lesion types' },
  { id: 'H-6', name: 'Device Robustness', exp: 'Exp 6', status: '✓ Confirmed', detail: 'Cross-device variance −46%' },
];
