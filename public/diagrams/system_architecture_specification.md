# System Architecture Specification

**Automated Diabetic Retinopathy Diagnosis via Fundus Image Enhancement and CNN Classification**

Candidate: Yesmukhamedov N.S. | IITU Doctoral Programme  
Version: 1.0 | Binding Reference: INVARIANTS.md v4.1, CENTRAL_THESIS.md v4.0

---

## 1. Introduction

This document specifies the complete end-to-end architecture of the proposed automated diabetic retinopathy (DR) diagnostic system. The system operates at two levels of clinical granularity — **image-level** (per-eye DR grading) and **patient-level** (bilateral aggregation) — and includes a post-hoc **explainability module** that quantitatively links model attention to clinical lesion structures.

The central design decision of this work is that the preprocessing pipeline is not an ancillary data preparation step but an **integral model component** that defines the feature space available to the CNN classifier. The full system is accordingly defined as:

$$
\hat{y} = \mathcal{S}(I_L, I_R) = g\bigl(\Phi\bigl(\text{CNN}(\mathcal{P}(I_L)),\; \text{CNN}(\mathcal{P}(I_R))\bigr)\bigr)
$$

where $\mathcal{P}$ is the V4 preprocessing pipeline, $\text{CNN}$ is the shared feature extractor, $\Phi$ is the patient-level aggregation operator, and $g$ is the classification head.

This specification is written at a higher level of abstraction than the V4 preprocessing pipeline specification. Preprocessing internals are not re-derived here; the pipeline is treated as a module $\mathcal{P}$ with defined input-output contracts. The focus is on inter-module data flow, tensor transformations, patient-level reasoning, and clinical interpretability.

### 1.1 Scope

The architecture encompasses:

- Bilateral image acquisition and metadata extraction (Section 3)
- Deterministic fundus image preprocessing (Section 4)
- CNN-based per-eye feature extraction and classification (Sections 5–6)
- Patient-level bilateral aggregation with multiple fusion strategies (Section 7)
- DR severity prediction with calibrated probability outputs (Section 8)
- Post-hoc Grad-CAM explainability with quantitative lesion alignment (Sections 9, 13)

### 1.2 Notation Conventions

| Symbol | Meaning |
|--------|---------|
| $I$ | Raw fundus image (BGR uint8) |
| $I'$ | Preprocessed image (float32 CHW tensor) |
| $\mathbf{f}$ | Feature vector (CNN output before classification head) |
| $\mathbf{z}$ | Logit vector (pre-softmax class scores) |
| $\hat{\mathbf{p}}$ | Probability vector (post-softmax) |
| $\hat{y}$ | Predicted class label (argmax of $\hat{\mathbf{p}}$) |
| $K$ | Number of DR classes ($K = 5$: grades 0–4) |
| $B$ | Batch dimension |
| Subscript $L$, $R$ | Left eye, right eye |
| $\theta$ | Learnable model parameters |

---

## 2. Global System Definition

### 2.1 Formal System Specification

The diagnostic system $\mathcal{S}$ is a composite function mapping bilateral fundus images and associated metadata to a DR severity prediction, attention maps, and quantitative alignment metrics:

$$
\mathcal{S}: (I_L, I_R, s_L, s_R) \;\longrightarrow\; (\hat{y},\; \hat{\mathbf{p}},\; \mathbf{L}_{\text{cam}},\; \text{ALO},\; \text{IoU})
$$

where $s_L, s_R \in \{\text{left}, \text{right}, \text{unknown}\}$ are eye laterality labels.

### 2.2 Module Decomposition

| Module | Symbol | Function | Section |
|--------|--------|----------|---------|
| Preprocessing | $\mathcal{P}$ | Raw image → normalized tensor | 4 |
| CNN Backbone | $\text{CNN}_\theta^{\text{base}}$ | Tensor → spatial feature maps | 5 |
| Global Pooling | $\text{GAP}$ | Feature maps → feature vector | 6 |
| Classification Head | $h_\theta$ | Feature vector → class logits | 5 |
| Patient Aggregation | $\Phi$ | Bilateral features → fused representation | 7 |
| Prediction Layer | $g$ | Logits → class probabilities → diagnosis | 8 |
| Explainability | $\text{GradCAM}$ | Model + input → attention heatmap | 9 |
| Alignment Evaluation | $\text{ALO}, \text{IoU}$ | Heatmap + lesion mask → overlap score | 13 |

### 2.3 Operating Modes

The system operates in three distinct modes:

| Mode | Modules Active | Stochastic Components |
|------|---------------|-----------------------|
| **Training** | $\mathcal{P}$ (full), CNN, $h_\theta$ | CLAHE stochastic, augmentation, dropout |
| **Inference** | $\mathcal{P}$ (deterministic), CNN, $\Phi$, $g$ | None — fully deterministic |
| **Explainability** | $\mathcal{P}$ (deterministic), CNN, GradCAM, ALO/IoU | None — fully deterministic |

---

## 3. Input Layer

### 3.1 Input Specification

Each patient presents as a bilateral image pair with associated metadata:

$$
\mathcal{X}_{\text{patient}} = \bigl\{(I_L, s_L),\; (I_R, s_R)\bigr\}
$$

| Field | Type | Shape | Description |
|-------|------|-------|-------------|
| $I_L$, $I_R$ | `np.ndarray`, uint8 | $(H_0, W_0, 3)$ | Raw fundus photographs (BGR from `cv2.imread`) |
| $s_L$, $s_R$ | `str` | — | Eye laterality: `"left"`, `"right"`, or `"unknown"` |
| Patient ID | `str` | — | Unique patient identifier for bilateral grouping |

The raw spatial dimensions $(H_0, W_0)$ vary across imaging devices (e.g., EyePACS: $3168 \times 4752$; IDRiD: $2848 \times 4288$). The preprocessing module normalizes all images to a uniform $(512, 512, 3)$ spatial resolution.

### 3.2 Missing Eye Handling

When one eye is absent from the patient record, the system substitutes a zero tensor:

$$
I'_{\text{missing}} = \mathbf{0} \in \mathbb{R}^{3 \times 512 \times 512}
$$

accompanied by a binary presence mask $m \in \{0, 1\}$ per eye. The downstream aggregation module uses these masks to ensure that absent-eye features do not contribute to the patient-level representation.

### 3.3 Patient-Level Data Splitting

All images belonging to the same patient (identified by Patient ID) are assigned to the same cross-validation fold. This is enforced by the `PatientLevelKFold` splitter, which performs stratified $k$-fold splitting at the patient level (using the maximum DR grade across both eyes as the stratification label) and then expands patient-level fold assignments back to image-level indices. This guarantees zero data leakage: no patient appears in both training and validation partitions within any fold.

---

## 4. Preprocessing Pipeline

### 4.1 Module Contract

$$
\mathcal{P}: \bigl(\mathbb{R}^{H_0 \times W_0 \times 3}_{\text{uint8}},\; s\bigr) \;\longrightarrow\; \mathbb{R}^{3 \times 512 \times 512}_{\text{float32}}
$$

The preprocessing module $\mathcal{P}$ transforms a raw BGR fundus image and its eye laterality label into a normalized float32 tensor suitable for CNN input. It is defined by the V4 6-stage pipeline specification (see *V4 Data Processing Pipeline — Comprehensive Specification*) and comprises the following stages executed in strict order:

| Stage | Operation | Deterministic? |
|-------|-----------|---------------|
| 0a | Canonical flip (left → right eye orientation) | Yes |
| 0b | OD-fovea rotation normalization | Yes (conditional) |
| 1 | FOV crop + resize to $512 \times 512$ | Yes |
| 2 | Flat-field illumination correction ($\sigma = 45$) | Yes |
| 3 | Dual-constraint CLAHE (LAB L-channel, stochastic at train) | Stochastic (train) |
| 5 | Integrated augmentation (affine + color, train only) | Stochastic (train) |
| 4 | ImageNet normalization $\rightarrow$ tensor | Yes |

### 4.2 Pipeline Configurations

Two configurations are evaluated in the factorial design (Experiment 1):

| Name | Stages Active | Notation |
|------|---------------|----------|
| **Baseline (ABSENT)** | 1, 4 | $\mathcal{P}_{\emptyset}$ |
| **Full V4 (ACTIVE)** | 0a, 0b, 1, 2, 3, 5, 4 | $\mathcal{P}$ |

The preprocessing module is applied **identically and independently** to each eye:

$$
I'_L = \mathcal{P}(I_L, s_L), \quad I'_R = \mathcal{P}(I_R, s_R)
$$

The shared $\mathcal{P}$ instance ensures identical parameters and deterministic behavior across the bilateral pair at inference time.

---

## 5. CNN Model (Per-Eye Processing)

### 5.1 Architecture Overview

The CNN module processes each preprocessed eye image independently through a shared-weight backbone:

$$
\mathbf{z}_L = h_\theta\bigl(\text{GAP}\bigl(\text{CNN}_\theta^{\text{base}}(I'_L)\bigr)\bigr), \quad
\mathbf{z}_R = h_\theta\bigl(\text{GAP}\bigl(\text{CNN}_\theta^{\text{base}}(I'_R)\bigr)\bigr)
$$

where $\text{CNN}_\theta^{\text{base}}$ is the convolutional backbone producing spatial feature maps, $\text{GAP}$ is global average pooling, and $h_\theta$ is the classification head mapping pooled features to class logits.

### 5.2 Backbone Architectures

Two backbone families are employed, corresponding to the two arms of the factorial design:

#### 5.2.1 ResNet-50

| Property | Value |
|----------|-------|
| Architecture | Residual network, 50 layers, 4 bottleneck stages |
| Pre-training | ImageNet-1K V2 (torchvision) |
| Feature dimension | $d = 2048$ |
| Final spatial map | $\mathbf{A} \in \mathbb{R}^{2048 \times 16 \times 16}$ (for $512 \times 512$ input) |
| Pooling | Global average pooling $\rightarrow \mathbf{f} \in \mathbb{R}^{2048}$ |

The forward pass through the ResNet-50 backbone can be decomposed as:

$$
\mathbf{A} = \text{Stage}_4 \circ \text{Stage}_3 \circ \text{Stage}_2 \circ \text{Stage}_1 \circ \text{Conv}_1 \circ \text{BN} \circ \text{ReLU} \circ \text{MaxPool}(I')
$$

where each Stage$_i$ is a sequence of bottleneck residual blocks.

#### 5.2.2 EfficientNet-B3

| Property | Value |
|----------|-------|
| Architecture | Compound-scaled network (depth/width/resolution), MBConv + SE blocks |
| Pre-training | ImageNet-1K (timm) |
| Feature dimension | $d = 1536$ |
| Final spatial map | $\mathbf{A} \in \mathbb{R}^{1536 \times 16 \times 16}$ (for $512 \times 512$ input) |
| Pooling | Global average pooling $\rightarrow \mathbf{f} \in \mathbb{R}^{1536}$ |

EfficientNet employs mobile inverted bottleneck convolutions (MBConv) with squeeze-and-excitation (SE) attention. The `conv_head` layer (1×1 convolution expanding channels before pooling) serves as the Grad-CAM target layer for the explainability module.

#### 5.2.3 EfficientNet-B4 (Explainability Only)

EfficientNet-B4 ($d = 1792$) is used exclusively in Experiment 4 (Grad-CAM explainability analysis). It is not part of the factorial design but provides higher-resolution feature maps for lesion alignment evaluation.

### 5.3 Classification Head

The classification head $h_\theta$ is identical across both backbone families:

$$
h_\theta: \mathbb{R}^d \;\xrightarrow{\text{Dropout}(p)}\; \mathbb{R}^d \;\xrightarrow{\text{Linear}(d, K)}\; \mathbb{R}^K
$$

| Parameter | Symbol | Value |
|-----------|--------|-------|
| Input dimension | $d$ | 2048 (ResNet-50) or 1536 (EfficientNet-B3) |
| Output dimension | $K$ | 5 (DR grades 0–4) |
| Dropout rate | $p$ | 0.4 |

The head produces raw logits $\mathbf{z} \in \mathbb{R}^K$ (pre-softmax) for each eye independently.

### 5.4 Per-Eye Forward Pass Summary

The complete per-eye forward pass is:

$$
I' \in \mathbb{R}^{3 \times 512 \times 512} \;\xrightarrow{\text{CNN}_\theta^{\text{base}}}\; \mathbf{A} \in \mathbb{R}^{d \times H' \times W'} \;\xrightarrow{\text{GAP}}\; \mathbf{f} \in \mathbb{R}^d \;\xrightarrow{h_\theta}\; \mathbf{z} \in \mathbb{R}^K
$$

where $H' = W' = 16$ for $512 \times 512$ input images.

---

## 6. Feature Extraction and Representation

### 6.1 Spatial Feature Maps

The convolutional backbone produces a three-dimensional tensor of spatial feature maps before global pooling:

$$
\mathbf{A} = \text{CNN}_\theta^{\text{base}}(I') \in \mathbb{R}^{d \times H' \times W'}
$$

Each channel $A^k \in \mathbb{R}^{H' \times W'}$, $k \in \{1, \ldots, d\}$, is a spatial activation map encoding the presence and location of a learned visual pattern (e.g., microaneurysm-like structures, vessel bifurcation patterns, exudate textures). These spatial maps serve two functions:

1. **Classification**: aggregated via global average pooling into a feature vector for the classification head.
2. **Explainability**: used by the Grad-CAM module to produce spatially resolved attention maps (Section 9).

### 6.2 Global Average Pooling

$$
f_k = \text{GAP}(A^k) = \frac{1}{H' \cdot W'} \sum_{i=1}^{H'} \sum_{j=1}^{W'} A^k_{ij}
$$

This collapses each spatial map to a scalar, producing a compact feature vector $\mathbf{f} = (f_1, \ldots, f_d)^\top \in \mathbb{R}^d$ that retains the strength of each learned pattern while discarding spatial position.

### 6.3 Feature Vector Semantics

| Backbone | $d$ | Semantic Content |
|----------|-----|-----------------|
| ResNet-50 | 2048 | High-level residual features: vessel morphology, lesion patterns, background texture |
| EfficientNet-B3 | 1536 | Compound-scaled features with SE channel attention |

The feature vector $\mathbf{f}$ is the interface between the per-eye processing stage and all downstream modules: the image-level classification head, the patient-level aggregation layer, and (indirectly) the Grad-CAM explainability module.

---

## 7. Patient-Level Aggregation Layer

### 7.1 Rationale

Diabetic retinopathy is a bilateral disease: both eyes of a patient share systemic risk factors (blood glucose, hypertension) but may exhibit different local pathology. Clinical DR grading assigns a severity grade per eye, but screening decisions (referral, follow-up interval) are often made at the patient level. The aggregation layer $\Phi$ combines information from both eyes into a unified patient-level representation.

This system implements three aggregation strategies, corresponding to different information-theoretic trade-offs between simplicity and representational capacity.

### 7.2 Strategy 1 — Prediction-Level Aggregation (Max-Grade)

**Formulation:**

$$
\hat{y}_L = \arg\max_k\; z_{L,k}, \quad \hat{y}_R = \arg\max_k\; z_{R,k}
$$

$$
\hat{y}_{\text{patient}} = \max(\hat{y}_L,\; \hat{y}_R)
$$

**Intuition.** The patient's DR severity is determined by the worse-affected eye. This mirrors clinical practice, where the more severe eye dictates the referral pathway.

**Pros:**
- No additional learnable parameters
- Directly interpretable: the patient grade equals the grade of the more severely affected eye
- Applicable to any single-image classifier without architectural modification

**Cons:**
- Discards all feature-level information from the less affected eye
- Cannot model bilateral correlations (e.g., asymmetric DR as a risk indicator)
- Hard argmax is non-differentiable; cannot be trained end-to-end

**Implementation.** This is the default strategy for Experiment 1 configurations A–D. Each eye is classified independently; the patient label is assigned post-hoc.

### 7.3 Strategy 2 — Feature-Level Concatenation

**Formulation:**

$$
\mathbf{f}_{\text{patient}} = [\mathbf{f}_L \;\|\; \mathbf{f}_R] \in \mathbb{R}^{2d}
$$

$$
\hat{y}_{\text{patient}} = \arg\max_k\; g(\mathbf{f}_{\text{patient}})_k
$$

where $[\cdot \| \cdot]$ denotes vector concatenation and $g: \mathbb{R}^{2d} \to \mathbb{R}^K$ is a learned classification head.

**Intuition.** Both eyes contribute their full feature representations to the decision. The learned head $g$ can discover bilateral patterns (e.g., correlated severity, laterality-specific features) that are invisible to per-eye classification.

**Pros:**
- Retains full feature information from both eyes
- Trainable end-to-end

**Cons:**
- Doubles the input dimension to the head, increasing parameter count
- Does not explicitly encode bilateral symmetry; the head must learn that $\mathbf{f}_L$ and $\mathbf{f}_R$ are structurally homologous
- Sensitive to the order of concatenation (left-first vs. right-first), which is resolved by the canonical flip in Stage 0a

### 7.4 Strategy 3 — Symmetry-Aware Fusion (PatientHead)

**Formulation:**

$$
\mathbf{f}_{\text{patient}} = \bigl[\mathbf{f}_L \;\|\; \mathbf{f}_R \;\|\; |\mathbf{f}_L - \mathbf{f}_R|\bigr] \in \mathbb{R}^{3d}
$$

$$
\hat{y}_{\text{patient}} = \arg\max_k\; g_{\text{MLP}}(\mathbf{f}_{\text{patient}})_k
$$

The element-wise absolute difference $|\mathbf{f}_L - \mathbf{f}_R|$ explicitly encodes **bilateral asymmetry**: features that differ between the two eyes. This is clinically meaningful because DR often progresses asymmetrically, and the degree of inter-eye discordance is itself a diagnostic signal.

**MLP Architecture ($g_{\text{MLP}}$):**

$$
\mathbb{R}^{3d} \;\xrightarrow{\text{Linear}(3d, 256)}\; \xrightarrow{\text{BN}}\; \xrightarrow{\text{ReLU}}\; \xrightarrow{\text{Dropout}(0.3)}\; \xrightarrow{\text{Linear}(256, 128)}\; \xrightarrow{\text{ReLU}}\; \xrightarrow{\text{Linear}(128, K)}\; \mathbb{R}^K
$$

| Layer | Input $\to$ Output | Parameters |
|-------|-------------------|------------|
| Linear 1 | $3d \to 256$ | $3d \times 256 + 256$ |
| BatchNorm1d | $256 \to 256$ | $2 \times 256$ |
| ReLU | $256 \to 256$ | 0 |
| Dropout | $256 \to 256$ | 0 (rate = 0.3) |
| Linear 2 | $256 \to 128$ | $256 \times 128 + 128$ |
| ReLU | $128 \to 128$ | 0 |
| Linear 3 | $128 \to K$ | $128 \times 5 + 5$ |

For ResNet-50 ($d = 2048$): input dimension $3 \times 2048 = 6144$; total head parameters $\approx 1.6$M.  
For EfficientNet-B3 ($d = 1536$): input dimension $3 \times 1536 = 4608$; total head parameters $\approx 1.2$M.

**Pros:**
- Explicitly models bilateral asymmetry via the $|\mathbf{f}_L - \mathbf{f}_R|$ term
- Learnable end-to-end with the backbone (two-stage training protocol)
- Clinically motivated: inter-eye discordance is diagnostically informative

**Cons:**
- Triples the input dimension, requiring more parameters and training data
- Requires canonical orientation (Stage 0a) as a prerequisite — without consistent left/right alignment, the difference term is semantically undefined
- Two-stage training adds complexity (backbone pretraining then head fine-tuning)

**Implementation.** This is the strategy used in Experiment 1 configurations E and F. The backbone is shared (single `Backbone` instance processes both eyes with the same weights). Missing eyes are handled via the zero-tensor substitution described in Section 3.2.

### 7.5 Strategy Comparison Summary

| Strategy | Learned? | Input Dim | Asymmetry | Prerequisite |
|----------|----------|-----------|-----------|-------------|
| Max-Grade | No | — | No | None |
| Concatenation | Yes | $2d$ | Implicit | Stage 0a |
| Symmetry-Aware (PatientHead) | Yes | $3d$ | Explicit | Stage 0a |

The max-grade strategy is evaluated for all Experiment 1 configurations (A–F). The symmetry-aware PatientHead is an additional architectural component evaluated only for configurations E and F as an optional extension.

---

## 8. Prediction Layer

### 8.1 Softmax and Class Probabilities

The raw logit vector $\mathbf{z} \in \mathbb{R}^K$ (from either the per-eye head or the patient-level head) is converted to a probability distribution via the softmax function:

$$
\hat{p}_k = \frac{\exp(z_k)}{\sum_{j=1}^{K} \exp(z_j)}, \quad k \in \{0, 1, 2, 3, 4\}
$$

where $\hat{p}_k$ is the estimated probability of DR grade $k$.

### 8.2 Classification Decision

$$
\hat{y} = \arg\max_{k \in \{0, \ldots, K-1\}} \hat{p}_k
$$

### 8.3 Clinical Binary Decision

For screening applications, the five-class prediction is collapsed to a binary referral decision using the referable DR threshold:

$$
\hat{y}_{\text{ref}} = \mathbb{1}[\hat{y} \geq 2]
$$

where grade $\geq 2$ (moderate NPDR or worse) constitutes referable DR requiring specialist evaluation.

### 8.4 Loss Function (Training)

The model is trained with weighted cross-entropy loss to address severe class imbalance in the EyePACS dataset (grade 0 constitutes $\sim$74% of samples):

$$
\mathcal{L} = -\sum_{k=0}^{K-1} w_k \cdot y_k \cdot \log(\hat{p}_k)
$$

where $y_k$ is the one-hot encoded ground truth and $w_k$ is the inverse-frequency class weight:

$$
w_k = \frac{N}{K \cdot n_k}
$$

with $N$ the total sample count, $K = 5$ the class count, and $n_k$ the count of samples in class $k$. Weights are normalized so that $\sum_k w_k = K$.

### 8.5 Training Configuration

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| Optimizer | Adam ($\beta_1 = 0.9$, $\beta_2 = 0.999$) | Standard adaptive optimizer |
| Learning rate | $1 \times 10^{-4}$ | Fine-tuning range for pre-trained CNNs |
| Weight decay | $1 \times 10^{-4}$ | L2 regularization |
| Batch size | 16 | Hardware constrained (12 GB VRAM at $512^2$ resolution) |
| Max epochs | 20 | With early stopping |
| Early stopping | Patience 5, monitor $\text{val\_weighted\_F1}$, mode max | Prevents overfitting |
| Scheduler | ReduceOnPlateau (factor 0.5, patience 3, min LR $10^{-6}$) | Adaptive LR decay |
| Gradient clipping | max\_norm = 1.0 | Stabilizes training |
| Mixed precision | Enabled (ResNet-50); disabled (EfficientNet, fp16 overflow) | Memory/speed optimization |

### 8.6 Two-Stage Training Protocol (PatientHead Configurations E, F)

For configurations with patient-level aggregation, training proceeds in two stages:

**Stage 1 — Backbone Pre-training.** The CNN backbone is temporarily wrapped with a single-image linear head and trained as a standard per-eye classifier using the image-level training loop. This initializes the backbone features for fundus image recognition.

**Stage 2 — Patient-Level Fine-tuning.**

- *Phase 2a (head warmup):* The pre-trained backbone is frozen. Only the PatientHead MLP is trained on patient-pair batches for a warmup period, using a learning rate of $10^{-4}$.
- *Phase 2b (joint fine-tuning):* The backbone is unfrozen with a lower learning rate ($10^{-5}$) while the PatientHead continues at $10^{-4}$. Training proceeds with early stopping monitoring patient-level weighted F1.

This differential learning rate schedule prevents the backbone's pre-trained representations from being destroyed during the patient-level adaptation phase.

---

## 9. Explainability Module (Grad-CAM)

### 9.1 Purpose

The explainability module provides **post-hoc visual interpretability** of the CNN's classification decisions. It produces spatial attention maps that indicate which image regions contributed most to a particular class prediction. In the clinical context of DR diagnosis, these maps are evaluated against pixel-level lesion annotations to determine whether preprocessing directs model attention toward diagnostically relevant structures (H-5).

**Non-claim (NC-14):** Grad-CAM activation does **not** constitute clinical localization of pathology. It is an interpretability tool that indicates regions of high gradient-weighted activation in the final convolutional layer. It does not represent pixel-level diagnostic delineation of lesion boundaries.

### 9.2 Mathematical Formulation

Given a trained CNN with final convolutional layer producing feature maps $\mathbf{A} = \{A^k\}_{k=1}^d$ where $A^k \in \mathbb{R}^{H' \times W'}$, and a target class $c$ with pre-softmax score $z_c$:

**Step 1 — Gradient computation.** Compute the gradient of the target class score with respect to each spatial feature map:

$$
\frac{\partial z_c}{\partial A^k_{ij}} \in \mathbb{R}^{H' \times W'}, \quad \forall\; k \in \{1, \ldots, d\}
$$

**Step 2 — Importance weighting.** The importance weight for feature map $k$ is the global average of its gradients:

$$
\alpha_k^c = \frac{1}{H' \cdot W'} \sum_{i=1}^{H'} \sum_{j=1}^{W'} \frac{\partial z_c}{\partial A^k_{ij}}
$$

This weight $\alpha_k^c$ captures the overall importance of feature map $k$ for predicting class $c$.

**Step 3 — Weighted combination and rectification.**

$$
L_{\text{Grad-CAM}}^c(i, j) = \text{ReLU}\!\left(\sum_{k=1}^{d} \alpha_k^c \cdot A^k_{ij}\right)
$$

The ReLU eliminates negative contributions, retaining only features that positively influence the target class prediction.

**Step 4 — Upsampling and normalization.**

$$
\hat{L}_{\text{Grad-CAM}}^c = \text{Normalize}_{[0,1]}\!\left(\text{Upsample}(L_{\text{Grad-CAM}}^c,\; H, W)\right)
$$

The heatmap is upsampled from the feature map resolution ($H' \times W'$) to the input image resolution ($H \times W = 512 \times 512$) via bilinear interpolation and min-max normalized to $[0, 1]$.

### 9.3 Target Layer Selection

| Backbone | Target Layer | Output Shape | Rationale |
|----------|-------------|--------------|-----------|
| ResNet-50 | `layer4[-1]` | $2048 \times 16 \times 16$ | Last residual block before GAP |
| EfficientNet-B3/B4 | `conv_head` | $1536/1792 \times 16 \times 16$ | Last 1×1 convolution before GAP |

The final convolutional layer is chosen because it produces the highest-level semantic features with sufficient spatial resolution ($16 \times 16$) to localize attention regions at approximately $32 \times 32$-pixel granularity in the original $512 \times 512$ image.

### 9.4 Comparison Protocol (Experiment 4)

Two models are trained on EyePACS under identical conditions except for preprocessing:

| Model | Preprocessing | Notation |
|-------|---------------|----------|
| Baseline | $\mathcal{P}_\emptyset$ (crop + resize + normalize) | $\text{CNN}_{\theta_A}$ |
| Preprocessed | $\mathcal{P}$ (full V4 pipeline) | $\text{CNN}_{\theta_B}$ |

For each of $N = 50$ IDRiD images (10 per DR class):

$$
L_{\text{baseline}}^c = \text{GradCAM}(I', \text{CNN}_{\theta_A}), \quad L_{\text{preproc}}^c = \text{GradCAM}(I', \text{CNN}_{\theta_B})
$$

Both heatmaps are evaluated against the same pixel-level lesion masks from IDRiD (Section 13).

---

## 10. Output Definition

### 10.1 Image-Level Outputs

For each eye image processed individually:

| Output | Type | Shape | Description |
|--------|------|-------|-------------|
| $\hat{y}_{\text{eye}}$ | int | scalar $\in \{0, \ldots, 4\}$ | Predicted DR grade |
| $\hat{\mathbf{p}}_{\text{eye}}$ | float32 | $(K,)$ | Class probability vector |
| $\mathbf{z}_{\text{eye}}$ | float32 | $(K,)$ | Raw logit vector |

### 10.2 Patient-Level Outputs

For the bilateral patient-level prediction:

| Output | Type | Shape | Description |
|--------|------|-------|-------------|
| $\hat{y}$ | int | scalar $\in \{0, \ldots, 4\}$ | Patient-level DR grade |
| $\hat{\mathbf{p}}$ | float32 | $(K,)$ | Patient-level probability vector |
| $\hat{y}_{\text{ref}}$ | int | $\{0, 1\}$ | Binary referral decision (grade $\geq 2$) |

### 10.3 Explainability Outputs

For each image analyzed with Grad-CAM:

| Output | Type | Shape | Description |
|--------|------|-------|-------------|
| $\hat{L}_{\text{Grad-CAM}}^c$ | float32 | $(H, W)$ | Attention heatmap in $[0, 1]$ |
| ALO | float | scalar $\in [0, 1]$ | Attention-Lesion Overlap (per lesion type) |
| IoU | float | scalar $\in [0, 1]$ | Intersection-over-Union (per lesion type) |
| Overlay image | uint8 | $(H, W, 3)$ | JET-colorized heatmap blended with original |

---

## 11. Full Pipeline Flow (End-to-End)

### 11.1 Data Flow Diagram

```
Patient Record
│
├── I_left (BGR uint8, H₀×W₀×3)     ├── I_right (BGR uint8, H₀×W₀×3)
│   eye_side = "left"                 │   eye_side = "right"
│                                     │
▼                                     ▼
┌──────────────────┐                  ┌──────────────────┐
│  Preprocessing   │                  │  Preprocessing   │
│  𝒫(I_L, s_L)    │                  │  𝒫(I_R, s_R)    │
│  (V4 pipeline)   │                  │  (V4 pipeline)   │
└────────┬─────────┘                  └────────┬─────────┘
         │                                     │
    I'_L ∈ ℝ^{3×512×512}                 I'_R ∈ ℝ^{3×512×512}
         │                                     │
         ▼                                     ▼
    ┌────────────┐                        ┌────────────┐
    │ CNN Backbone│ ◄─── shared weights ──►│ CNN Backbone│
    │ (ResNet-50  │                        │ (ResNet-50  │
    │  or EffNet) │                        │  or EffNet) │
    └──────┬─────┘                        └──────┬─────┘
           │                                     │
      A_L ∈ ℝ^{d×16×16}                    A_R ∈ ℝ^{d×16×16}
           │                                     │
           ▼                                     ▼
      ┌─────────┐                           ┌─────────┐
      │   GAP   │                           │   GAP   │
      └────┬────┘                           └────┬────┘
           │                                     │
      f_L ∈ ℝ^d                            f_R ∈ ℝ^d
           │                                     │
           └──────────────┬──────────────────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │  Aggregation Φ        │
              │  [f_L ‖ f_R ‖ |Δf|]  │
              │  or max(ŷ_L, ŷ_R)    │
              └───────────┬───────────┘
                          │
                     f_patient (or ŷ_patient)
                          │
                          ▼
              ┌───────────────────────┐
              │  Prediction Layer     │
              │  softmax → ŷ, p̂      │
              └───────────┬───────────┘
                          │
              ┌───────────┴───────────┐
              │                       │
              ▼                       ▼
         ┌─────────┐          ┌──────────────┐
         │ Diagnosis│          │ Explainability│
         │ ŷ ∈{0..4}│          │  Grad-CAM     │
         │ ŷ_ref    │          │  → heatmap    │
         └─────────┘          │  → ALO, IoU   │
                              └──────────────┘
```

### 11.2 Tensor Transformation Chain

$$
I \in \mathbb{R}^{H_0 \times W_0 \times 3}_{\text{uint8}}
\;\xrightarrow{\mathcal{P}}\;
I' \in \mathbb{R}^{3 \times 512 \times 512}_{\text{float32}}
\;\xrightarrow{\text{CNN}^{\text{base}}}\;
\mathbf{A} \in \mathbb{R}^{d \times 16 \times 16}
\;\xrightarrow{\text{GAP}}\;
\mathbf{f} \in \mathbb{R}^d
\;\xrightarrow{\Phi}\;
\mathbf{f}_{\text{patient}} \in \mathbb{R}^{3d}
\;\xrightarrow{g_{\text{MLP}}}\;
\mathbf{z} \in \mathbb{R}^5
\;\xrightarrow{\sigma}\;
\hat{\mathbf{p}} \in \Delta^4
$$

where $\Delta^4$ denotes the 4-simplex (probability distribution over 5 classes).

---

## 12. Mathematical Formulation of the Entire System

### 12.1 Complete System Function

The full system maps a patient's bilateral fundus images to a DR severity prediction:

$$
\hat{y} = \mathcal{S}(I_L, I_R, s_L, s_R;\; \theta)
$$

decomposed as:

**Preprocessing (deterministic at inference):**

$$
I'_L = \mathcal{P}(I_L, s_L), \quad I'_R = \mathcal{P}(I_R, s_R)
$$

**Feature extraction (shared weights):**

$$
\mathbf{f}_L = \text{GAP}\bigl(\text{CNN}_\theta^{\text{base}}(I'_L)\bigr), \quad \mathbf{f}_R = \text{GAP}\bigl(\text{CNN}_\theta^{\text{base}}(I'_R)\bigr)
$$

**Patient-level aggregation:**

$$
\mathbf{f}_{\text{patient}} = \Phi(\mathbf{f}_L, \mathbf{f}_R) = \bigl[\mathbf{f}_L \;\|\; \mathbf{f}_R \;\|\; |\mathbf{f}_L - \mathbf{f}_R|\bigr]
$$

**Prediction:**

$$
\hat{y} = \arg\max_k\; \sigma\bigl(g_{\text{MLP}}(\mathbf{f}_{\text{patient}})\bigr)_k
$$

where $\sigma$ is the softmax function.

### 12.2 Explainability (Post-Hoc, Independent of Prediction)

$$
L^c = \text{ReLU}\!\left(\sum_{k=1}^{d} \left[\frac{1}{H'W'} \sum_{i,j} \frac{\partial z_c}{\partial A^k_{ij}}\right] \cdot A^k\right)
$$

### 12.3 Learnable Parameter Sets

| Component | Parameters | Shared? |
|-----------|-----------|---------|
| $\text{CNN}_\theta^{\text{base}}$ | Backbone convolutional weights | Yes (both eyes) |
| $h_\theta$ | Image-level classification head | Yes (both eyes) |
| $g_{\text{MLP}}$ | PatientHead MLP weights | Patient-level only |

Total learnable parameters (approximate):

| Configuration | Backbone | Head | Total |
|---------------|----------|------|-------|
| A/B (ResNet-50, image-level) | 23.5M | 10K | 23.5M |
| C/D (EfficientNet-B3, image-level) | 10.7M | 7.7K | 10.7M |
| E (ResNet-50, PatientHead) | 23.5M | 1.6M | 25.1M |
| F (EfficientNet-B3, PatientHead) | 10.7M | 1.2M | 11.9M |

---

## 13. Explainability Evaluation Metrics

### 13.1 Ground Truth: IDRiD Lesion Masks

The IDRiD dataset provides pixel-level binary segmentation masks $G^{(\ell)}$ for four lesion types:

| Lesion Type | Symbol | Clinical Significance |
|-------------|--------|----------------------|
| Microaneurysms (MA) | $G^{(\text{MA})}$ | Earliest DR sign (capillary wall weakening) |
| Hemorrhages (HE) | $G^{(\text{HE})}$ | Blood leakage from damaged vessels |
| Hard Exudates (EX) | $G^{(\text{EX})}$ | Lipid/protein deposits from vascular leakage |
| Soft Exudates (SE) | $G^{(\text{SE})}$ | Nerve fiber layer infarcts (cotton-wool spots) |

Each mask $G^{(\ell)} \in \{0, 1\}^{H \times W}$ where $G^{(\ell)}_{ij} = 1$ indicates a lesion pixel.

### 13.2 Attention–Lesion Overlap (ALO) — Primary Metric

**Definition:**

$$
\text{ALO}(L, G^{(\ell)}) = \frac{|\hat{B}(L) \cap G^{(\ell)}|}{|G^{(\ell)}|}
$$

where $\hat{B}(L) = \{(i,j) : L_{ij} \geq \tau\}$ is the binarized attention map at threshold $\tau = 0.5$, and $|\cdot|$ denotes pixel count.

**Interpretation.** ALO measures what fraction of the lesion area is covered by model attention. It answers the clinically relevant question: *Does the model attend to the lesion?*

**Properties:**
- Range: $[0, 1]$; ALO $= 1$ means all lesion pixels are attended to
- Asymmetric: insensitive to the size of the attention region outside the lesion
- Independent of false positive attention area

**Hypothesis test (H-5):** $\text{ALO}_{\text{preproc}} > \text{ALO}_{\text{baseline}}$ for each lesion type, demonstrating that preprocessing redirects model attention toward clinically relevant structures.

### 13.3 Intersection-over-Union (IoU) — Secondary Metric

**Definition:**

$$
\text{IoU}(L, G^{(\ell)}) = \frac{|\hat{B}(L) \cap G^{(\ell)}|}{|\hat{B}(L) \cup G^{(\ell)}|}
$$

**Interpretation.** IoU measures symmetric spatial precision — the overlap between the attention region and the lesion region, penalizing both missed lesion pixels and extraneous attention outside the lesion.

**Properties:**
- Range: $[0, 1]$; IoU $= 1$ requires exact spatial alignment
- Symmetric: penalizes both false negatives and false positives in attention
- More stringent than ALO; typically IoU $\leq$ ALO

**Hypothesis test (H-5, secondary):** $\text{IoU}_{\text{preproc}} > \text{IoU}_{\text{baseline}}$.

### 13.4 Relationship Between ALO and IoU

The two metrics are related by:

$$
\text{IoU} = \frac{|A \cap G|}{|A| + |G| - |A \cap G|} \leq \frac{|A \cap G|}{|G|} = \text{ALO}
$$

ALO $\geq$ IoU always holds. The gap between them indicates the degree of "attention spillover" — attention extending beyond the lesion boundary. In clinical terms, some spillover is acceptable (the model may attend to perilesional tissue), so ALO is the primary metric.

### 13.5 Effect of Preprocessing on Explainability

The dissertation's central causal chain predicts that preprocessing improves explainability metrics through two mechanisms:

1. **Feature visibility.** Flat-field correction (Stage 2) and CLAHE (Stage 3) enhance the contrast of small lesion structures (particularly microaneurysms), making them more salient to the CNN's learned filters. This should increase the gradient signal $\partial z_c / \partial A^k_{ij}$ at lesion locations, producing higher Grad-CAM activation over lesions.

2. **Attention concentration.** By reducing device-specific illumination artifacts and normalizing orientation (Stage 0), preprocessing removes spurious high-gradient regions (e.g., bright reflections, dark vignetting borders) that would otherwise compete for Grad-CAM attention. This should reduce attention spillover and improve both ALO and IoU.

The causal path is:

$$
\mathcal{P} \;\xrightarrow{\text{enhances}}\; \text{lesion contrast} \;\xrightarrow{\text{increases}}\; \text{gradient at lesion locations} \;\xrightarrow{\text{produces}}\; \text{higher ALO/IoU}
$$

---

## 14. Reproducibility and Configuration

### 14.1 Determinism Controls

| Control | Implementation |
|---------|---------------|
| Global seed | `seed = 42`; set via `torch.manual_seed`, `np.random.seed`, `random.seed` |
| CUDA determinism | `torch.use_deterministic_algorithms(True)` |
| cuDNN benchmark | `torch.backends.cudnn.benchmark = False` |
| Worker seeds | DataLoader workers seeded from global seed |

### 14.2 Hardware Specification

| Component | Value |
|-----------|-------|
| GPU | NVIDIA RTX 3060 (12 GB VRAM) |
| System RAM | 12 GB (WSL2 allocation) |
| OS | Ubuntu 24 (WSL2 on Windows) |
| CUDA | Compatible with PyTorch 2.5 |

### 14.3 Software Stack

| Library | Version | Role |
|---------|---------|------|
| Python | 3.10 | Runtime |
| PyTorch | 2.5 | Training, inference, autograd |
| timm | latest | EfficientNet model zoo |
| torchvision | compatible | ResNet-50 weights, transforms |
| OpenCV | latest | Image I/O, preprocessing |
| scikit-learn | latest | Metrics, cross-validation |
| pytorch\_grad\_cam | latest | Grad-CAM generation |

### 14.4 Configuration Management

All hyperparameters, dataset paths, and pipeline toggles are centralized in `configs/default.yaml`. Model-specific augmentation presets are defined in `PreprocessingV4Config.from_preset()`. No hyperparameters are hardcoded in source modules; all are injected via the configuration system.

### 14.5 Experimental Design Traceability

| Experiment | Configs | Hypothesis | Modules Exercised |
|------------|---------|------------|-------------------|
| Exp 1 (Factorial) | A–F | H-1 | $\mathcal{P}$, CNN, $h_\theta$, $\Phi$ (E/F) |
| Exp 2 (Ablation) | V4 levels | H-1, H-2 | $\mathcal{P}$ (incremental), CNN, $h_\theta$ |
| Exp 4 (Explainability) | baseline vs. full | H-5 | $\mathcal{P}$, CNN, GradCAM, ALO/IoU |
| Exp 5 (Generalization) | full V4 | H-4 | $\mathcal{P}$, CNN, $h_\theta$ (zero-shot) |
| Exp 6 (Device Shift) | full V4 | H-6 | $\mathcal{P}$, CNN, $h_\theta$ (zero-shot) |
