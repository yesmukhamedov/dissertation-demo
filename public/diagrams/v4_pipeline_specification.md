# V4 Data Processing Pipeline — Comprehensive Specification

**Dissertation:** Automated Diabetic Retinopathy Diagnosis via Fundus Image Enhancement and CNN Classification  
**Candidate:** Yesmukhamedov N.S.  
**Pipeline Version:** 4.1  
**Binding Reference:** INVARIANTS.md v4.1, preprocessing-pipeline.md v4.1

---

## 1. Introduction

The proposed diagnostic model is defined as a two-stage system:

$$
\text{model} = \text{preprocessing} + \text{CNN}
$$

The preprocessing pipeline is not an ancillary data preparation step — it is an integral model component that defines the feature space available to the CNN classifier. The pipeline standardizes retinal image appearance across imaging devices, illumination conditions, and acquisition protocols while preserving diagnostically relevant microvascular features.

The V4 pipeline comprises **six ordered stages** applied to raw fundus photographs. Each stage is either **always-on** (mandatory) or **toggleable** (can be disabled for ablation experiments). When all toggleable stages are enabled, the pipeline is **ACTIVE** (full V4). When only the always-on stages execute, the pipeline is **ABSENT** (V4 baseline: crop + resize + ImageNet normalize).

---

## 2. Pipeline Overview

### 2.1 Stage Execution Order

| Stage | Name | Toggle | Domain | Output |
|-------|------|--------|--------|--------|
| 0a | Canonical Flip | toggleable | RGB uint8 → RGB uint8 | Right-eye orientation |
| 0b | OD-Fovea Rotation Normalization | toggleable | RGB uint8 → RGB uint8 | Horizontal retinal axis |
| 1 | FOV Crop + Resize | always on | RGB uint8 → RGB uint8 | 512×512 centered fundus |
| 2 | Flat-Field Correction | toggleable | RGB uint8 → RGB uint8 | Uniform illumination |
| 3 | Upgraded CLAHE | toggleable | RGB uint8 → RGB uint8 | Enhanced local contrast |
| 5 | Integrated Augmentation | train only | RGB uint8 → RGB uint8 | Augmented training image |
| 4 | ImageNet Normalization | always on | RGB uint8 → float32 tensor | CNN-ready (3, H, W) |

Stage 5 (augmentation) is inserted **before** Stage 4 (normalization) because augmentation operates on uint8 pixel values. Stage 4 is always the final transformation, converting to a normalized float32 tensor.

### 2.2 Pipeline Configurations

| Configuration | Stages Active | Role |
|---------------|---------------|------|
| **Baseline (ABSENT)** | 1, 4 | Control condition for H-1 |
| **Full V4 (ACTIVE)** | 0a, 0b, 1, 2, 3, 5, 4 | Experimental condition for H-1 |
| **Ablation levels** | Incremental subsets | Component contribution (Exp 2) |

### 2.3 Global Variable Definitions

| Variable | Type | Dimensions | Description |
|----------|------|------------|-------------|
| $I_{\text{raw}}$ | `np.ndarray`, uint8 | $(H_0, W_0, 3)$ | Raw fundus image as loaded (BGR from `cv2.imread`) |
| $I_{\text{rgb}}$ | `np.ndarray`, uint8 | $(H_0, W_0, 3)$ | Image after BGR→RGB conversion |
| $I^{(k)}$ | `np.ndarray`, uint8 | varies | Image after Stage $k$ |
| $T$ | `torch.Tensor`, float32 | $(3, 512, 512)$ | Final normalized tensor (pipeline output) |
| $s$ | `str` | — | Eye side: `"left"`, `"right"`, or `"unknown"` |

### 2.4 Color Space Convention

All internal processing within the V4 pipeline operates in **RGB**. The entry point converts BGR→RGB when the input comes from `cv2.imread`:

$$
I_{\text{rgb}}(x,y,c) = I_{\text{raw}}(x,y, 2-c), \quad c \in \{0,1,2\}
$$

where channel 0 = Red, 1 = Green, 2 = Blue after conversion.

---

## 3. Stage 0a — Canonical Flip

### 3.1 Purpose

Standardize eye laterality so that all images share **right-eye canonical orientation**: optic disc on the right, macula on the left. This eliminates orientation-induced distribution shift between left-eye and right-eye images in the training set.

### 3.2 Method

**Name:** Horizontal Mirror Flip  
**Input:** $I_{\text{rgb}} \in \mathbb{R}^{H \times W \times 3}$ (RGB uint8), eye side $s \in \{\text{left}, \text{right}, \text{unknown}\}$  
**Output:** $I^{(0a)} \in \mathbb{R}^{H \times W \times 3}$ (RGB uint8)  
**Key Parameters:** None (deterministic binary operation)  
**Assumptions:** Eye laterality is known from image metadata (EyePACS filenames encode `_left` / `_right`). For datasets without laterality information, $s = \text{unknown}$ and no flip is applied.

### 3.3 Mathematical Formalization

$$
I^{(0a)}(x, y, c) = 
\begin{cases}
I_{\text{rgb}}(x,\; W - 1 - y,\; c) & \text{if } s = \text{left} \\
I_{\text{rgb}}(x, y, c) & \text{otherwise}
\end{cases}
$$

where $W$ is the image width and the flip is along the horizontal (column) axis.

### 3.4 Python Implementation

```python
import cv2
import numpy as np

def canonical_flip(image: np.ndarray, eye_side: str) -> np.ndarray:
    """Flip left-eye images to right-eye canonical orientation.
    
    Args:
        image: RGB uint8 array, shape (H, W, 3).
        eye_side: "left", "right", or "unknown".
    
    Returns:
        Horizontally flipped array for "left"; original otherwise.
    """
    if eye_side == "left":
        return cv2.flip(image, 1)  # flipCode=1: horizontal flip
    return image
```

---

## 4. Stage 0b — OD-Fovea Rotation Normalization

### 4.1 Purpose

Standardize the retinal axis orientation so that the optic disc (OD) → fovea axis is horizontal. This removes rotation variability introduced by different camera angles and patient positioning. Additionally, the detection uncertainty feeds an adaptive rotation σ for Stage 5 augmentation.

### 4.2 Method

**Name:** Classical CV Anatomical Landmark Detection + Image Rotation  
**Input:** $I^{(0a)} \in \mathbb{R}^{H \times W \times 3}$ (RGB uint8)  
**Output:** $I^{(0b)} \in \mathbb{R}^{H \times W \times 3}$ (RGB uint8), detection result $\mathcal{R}$  
**Key Parameters:**

| Parameter | Symbol | Default | Description |
|-----------|--------|---------|-------------|
| OD blur σ | $\sigma_{\text{od}}$ | 15.0 | Gaussian blur for OD detection |
| OD percentile | $p_{\text{od}}$ | 97.0 | Intensity percentile for OD mask |
| Fovea blur σ | $\sigma_{\text{fov}}$ | 25.0 | Gaussian blur for fovea detection |
| Inner annulus factor | $f_{\text{inner}}$ | 1.5 | Inner search radius (× OD diameter) |
| Outer annulus factor | $f_{\text{outer}}$ | 3.5 | Outer search radius (× OD diameter) |

**Assumptions:** The optic disc is the brightest region in the green channel after heavy blur. The fovea is the darkest region within an anatomically plausible annulus around the OD. Detection is fallible; a confidence flag gates whether rotation is applied.

### 4.3 Mathematical Formalization

**Step 1 — OD Detection.** Extract the green channel $G = I^{(0a)}_{:,:,1}$ (best vessel/lesion contrast). Apply Gaussian blur and threshold:

$$
G_{\text{blur}}(x,y) = (G * \mathcal{N}_{\sigma_{\text{od}}})(x,y)
$$

$$
\tau_{\text{od}} = \text{percentile}(G_{\text{blur}},\; p_{\text{od}})
$$

$$
M_{\text{od}}(x,y) = \mathbb{1}[G_{\text{blur}}(x,y) \geq \tau_{\text{od}}]
$$

The OD center $\mathbf{c}_{\text{od}} = (c_x, c_y)$ is the centroid of $M_{\text{od}}$ via image moments:

$$
c_x = \frac{m_{10}}{m_{00}}, \quad c_y = \frac{m_{01}}{m_{00}}
$$

where $m_{pq} = \sum_{x,y} x^p y^q M_{\text{od}}(x,y)$. The equivalent OD radius:

$$
r_{\text{od}} = \sqrt{\frac{m_{00}}{\pi}}
$$

**Step 2 — Fovea Detection.** Construct an annular search mask around $\mathbf{c}_{\text{od}}$:

$$
A(x,y) = \mathbb{1}\bigl[f_{\text{inner}} \cdot d_{\text{od}} \leq \|\mathbf{p} - \mathbf{c}_{\text{od}}\| \leq f_{\text{outer}} \cdot d_{\text{od}}\bigr] \;\wedge\; \mathbb{1}[G(x,y) > 15]
$$

where $d_{\text{od}} = 2 r_{\text{od}}$ is the OD diameter and $\mathbf{p} = (x,y)$. The fovea background threshold (15) excludes non-fundus black border pixels. The fovea center is the darkest point in the blurred, masked green channel:

$$
\mathbf{c}_{\text{fov}} = \arg\min_{\mathbf{p}:\; A(\mathbf{p})=1} (G * \mathcal{N}_{\sigma_{\text{fov}}})(\mathbf{p})
$$

The fovea radius is estimated as $r_{\text{fov}} = \max(0.5 \cdot r_{\text{od}},\; 10)$ (anatomical prior).

**Step 3 — Rotation Angle.** The OD→fovea vector angle:

$$
\theta = \arctan2\!\bigl(c_{\text{fov},y} - c_{\text{od},y},\; c_{\text{fov},x} - c_{\text{od},x}\bigr) \quad [\text{radians}]
$$

**Step 4 — Adaptive Rotation σ.** The per-image augmentation σ is derived from localization uncertainty:

$$
\sigma_{\text{pos}} = \sqrt{r_{\text{od}}^2 + r_{\text{fov}}^2}
$$

$$
\sigma_{\theta} = \arctan\!\left(\frac{\sigma_{\text{pos}}}{d(\mathbf{c}_{\text{od}}, \mathbf{c}_{\text{fov}})}\right) \quad [\text{radians} \to \text{degrees}]
$$

Capped at $\sigma_{\theta} \leq 15°$.

**Step 5 — Sanity Checks.** Detection is marked as confident ($\mathcal{R}.\text{confident} = \text{True}$) only if all hold:

- $r_{\text{od}} \geq 10$ pixels (minimum credible OD size)
- $r_{\text{od}} < 0.15 \cdot W$ (OD not unreasonably large)
- $1.0 \leq \frac{d(\mathbf{c}_{\text{od}}, \mathbf{c}_{\text{fov}})}{d_{\text{od}}} \leq 5.0$ (anatomical distance range)
- Both centers within image bounds (margin ≥ 10 pixels)

**Step 6 — Conditional Rotation.** If confident:

$$
I^{(0b)} = \text{warpAffine}\!\bigl(I^{(0a)},\; \mathbf{R}(-\theta),\; \text{BORDER\_REFLECT}\bigr)
$$

where $\mathbf{R}(-\theta)$ is the 2×3 rotation matrix that brings the OD→fovea axis to $0°$ (horizontal). If not confident, $I^{(0b)} = I^{(0a)}$ (identity fallback).

### 4.4 Python Implementation

```python
import math
import cv2
import numpy as np
from dataclasses import dataclass

@dataclass
class ODFoveaResult:
    od_center: tuple[int, int]      # (x, y) pixel coordinates
    od_radius: float                # pixels
    fovea_center: tuple[int, int]   # (x, y) pixel coordinates
    fovea_radius: float             # pixels
    distance: float                 # OD-fovea Euclidean distance (pixels)
    angle_deg: float                # OD→fovea angle (degrees)
    rotation_sigma_deg: float       # adaptive augmentation σ (degrees)
    confident: bool                 # True if all sanity checks pass

def detect_od_fovea(image_rgb: np.ndarray) -> ODFoveaResult:
    """Detect optic disc and fovea via classical CV.
    
    Args:
        image_rgb: RGB uint8 array, shape (H, W, 3).
    Returns:
        ODFoveaResult with detection outputs and confidence flag.
    """
    h, w = image_rgb.shape[:2]
    green = image_rgb[:, :, 1]
    
    # Step 1: OD detection (brightest region)
    blurred = cv2.GaussianBlur(green, (0, 0), 15.0)
    threshold = np.percentile(blurred, 97.0)
    od_mask = (blurred >= threshold).astype(np.uint8)
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    od_mask = cv2.morphologyEx(od_mask, cv2.MORPH_CLOSE, kernel)
    od_mask = cv2.morphologyEx(od_mask, cv2.MORPH_OPEN, kernel)
    
    M = cv2.moments(od_mask)
    cx = int(M["m10"] / M["m00"])
    cy = int(M["m01"] / M["m00"])
    od_radius = math.sqrt(M["m00"] / math.pi)
    
    # Step 2: Fovea detection (darkest in annular search region)
    od_diameter = od_radius * 2.0
    Y, X = np.ogrid[:h, :w]
    dist = np.sqrt((X - cx)**2 + (Y - cy)**2)
    annular = ((dist >= 1.5 * od_diameter) & (dist <= 3.5 * od_diameter))
    fov_mask = (green > 15)
    search = (annular & fov_mask).astype(np.uint8)
    
    heavily_blurred = cv2.GaussianBlur(green, (0, 0), 25.0)
    search_image = heavily_blurred.copy()
    search_image[search == 0] = 255
    _, _, fovea_center, _ = cv2.minMaxLoc(search_image)
    fovea_radius = max(od_radius * 0.5, 10.0)
    
    # Step 3: Geometry
    dx = fovea_center[0] - cx
    dy = fovea_center[1] - cy
    distance = math.sqrt(dx*dx + dy*dy)
    angle_deg = math.degrees(math.atan2(dy, dx))
    
    # Step 4: Adaptive σ
    sigma_pos = math.sqrt(od_radius**2 + fovea_radius**2)
    rotation_sigma = math.degrees(math.atan(sigma_pos / max(distance, 1e-6)))
    rotation_sigma = min(rotation_sigma, 15.0)
    
    # Step 5: Sanity checks
    confident = (od_radius >= 10
                 and od_radius < 0.15 * w
                 and 1.0 <= distance / max(od_diameter, 1e-6) <= 5.0
                 and 10 <= cx < w - 10 and 10 <= cy < h - 10
                 and 10 <= fovea_center[0] < w - 10
                 and 10 <= fovea_center[1] < h - 10)
    
    return ODFoveaResult(
        od_center=(cx, cy), od_radius=od_radius,
        fovea_center=fovea_center, fovea_radius=fovea_radius,
        distance=distance, angle_deg=angle_deg,
        rotation_sigma_deg=rotation_sigma, confident=confident,
    )

def rotate_to_horizontal(image: np.ndarray, angle_deg: float) -> np.ndarray:
    """Rotate image so OD-fovea axis becomes horizontal.
    
    Args:
        image: RGB uint8 array, shape (H, W, 3).
        angle_deg: OD→fovea angle from detection. Image rotated by -angle_deg.
    Returns:
        Rotated RGB uint8 array, same shape.
    """
    h, w = image.shape[:2]
    center = (w // 2, h // 2)
    M = cv2.getRotationMatrix2D(center, angle_deg, 1.0)
    return cv2.warpAffine(image, M, (w, h),
                          flags=cv2.INTER_LINEAR,
                          borderMode=cv2.BORDER_REFLECT)
```

---

## 5. Stage 1 — FOV Crop and Resize

### 5.1 Purpose

Remove non-retinal black background (common in fundus cameras with circular fields of view embedded in rectangular sensors) and resize all images to a uniform spatial resolution of $512 \times 512$ pixels.

### 5.2 Method

**Name:** PIL-based Foreground Detection + Resize  
**Input:** $I^{(0b)} \in \mathbb{R}^{H \times W \times 3}$ (RGB uint8)  
**Output:** $I^{(1)} \in \mathbb{R}^{512 \times 512 \times 3}$ (RGB uint8)  
**Key Parameters:** `target_size = 512`  
**Assumptions:** Fundus images from wide-field cameras are landscape-oriented ($W > 1.2H$) with dark borders on left and right. Square or portrait images use a center-crop fallback.

### 5.3 Mathematical Formalization

**Background estimation.** Sample the leftmost and rightmost $\lfloor W/32 \rfloor$ columns. For each channel $c$:

$$
b_c^{(\text{left})} = \max_{x,y \in \text{left strip}} I^{(0b)}(x,y,c), \quad
b_c^{(\text{right})} = \max_{x,y \in \text{right strip}} I^{(0b)}(x,y,c)
$$

$$
b_c = \max(b_c^{(\text{left})}, b_c^{(\text{right})})
$$

**Foreground mask.** A pixel $(x,y)$ is foreground if any channel exceeds background + 10:

$$
F(x,y) = \mathbb{1}\!\left[\exists\, c \in \{0,1,2\}: I^{(0b)}(x,y,c) > b_c + 10\right]
$$

**Bounding box.** Compute the tight bounding box $\text{bbox} = (l, u, r, d)$ of $F$. If $\min(r-l, d-u) < 0.8 H$ or the image is not landscape, fall back to center-square crop:

$$
l = \max\!\left(\frac{W - H}{2},\; 0\right), \quad u = 0, \quad r = \min\!\left(W - \frac{W - H}{2},\; W\right), \quad d = H
$$

**Resize.** Crop to bbox, then resize to $512 \times 512$ via bilinear interpolation:

$$
I^{(1)} = \text{resize}\!\bigl(\text{crop}(I^{(0b)}, \text{bbox}),\; 512, 512\bigr)
$$

### 5.4 Python Implementation

```python
import numpy as np
from PIL import Image, ImageFilter

def crop_and_resize(image: np.ndarray, target_size: int = 512) -> np.ndarray:
    """Crop to FOV region and resize to target_size × target_size.
    
    Args:
        image: RGB uint8 array, shape (H, W, 3).
        target_size: Output resolution (square).
    Returns:
        RGB uint8 array, shape (target_size, target_size, 3).
    """
    pil_img = Image.fromarray(image)
    w, h = pil_img.size
    
    bbox = None
    if w > 1.2 * h:
        blurred = pil_img.filter(ImageFilter.BLUR)
        ba = np.array(blurred)
        left_max = ba[:, :w // 32, :].max(axis=(0, 1)).astype(int)
        right_max = ba[:, -w // 32:, :].max(axis=(0, 1)).astype(int)
        max_bg = np.maximum(left_max, right_max)
        foreground = (ba > max_bg + 10).any(axis=2).astype(np.uint8)
        bbox = Image.fromarray(foreground).getbbox()
        if bbox and (bbox[2] - bbox[0] < 0.8 * h or bbox[3] - bbox[1] < 0.8 * h):
            bbox = None
    
    if bbox is None:  # center-square fallback
        left = max((w - h) // 2, 0)
        bbox = (left, 0, min(w - (w - h) // 2, w), h)
    
    cropped = pil_img.crop(bbox)
    resized = cropped.resize([target_size, target_size])
    return np.array(resized, dtype=np.uint8)
```

---

## 6. Stage 2 — Flat-Field Correction

### 6.1 Purpose

Correct spatially non-uniform illumination gradients that arise from uneven lighting, camera lens vignetting, and fundus curvature. Unlike global intensity normalization, this stage preserves local contrast structure (vessels, lesions) while removing broad brightness variation.

### 6.2 Method

**Name:** Gaussian Blur Subtraction (Flat-Field Correction)  
**Input:** $I^{(1)} \in \mathbb{R}^{512 \times 512 \times 3}$ (RGB uint8)  
**Output:** $I^{(2)} \in \mathbb{R}^{512 \times 512 \times 3}$ (RGB uint8)  
**Key Parameters:** $\sigma_{\text{ff}} = 45.0$  
**Assumptions:** The illumination gradient is a low-frequency spatial signal that can be estimated by heavy Gaussian blur. The large σ ensures that only the broad illumination field — not vessel/lesion detail — is captured by the blur.

### 6.3 Mathematical Formalization

For each channel $c \in \{0, 1, 2\}$:

$$
\hat{L}_c(x,y) = \bigl(I^{(1)}_c * \mathcal{N}_{\sigma_{\text{ff}}}\bigr)(x,y)
$$

$$
I^{(2)}_c(x,y) = \text{clip}\!\Bigl(I^{(1)}_c(x,y) - \hat{L}_c(x,y) + 128,\;\; 0,\;\; 255\Bigr)
$$

where $\hat{L}_c$ is the estimated illumination field (low-pass filtered image), the subtraction removes the gradient, and the $+128$ offset re-centers the result to mid-gray. The clip operation enforces the uint8 range $[0, 255]$.

The Gaussian kernel is:

$$
\mathcal{N}_\sigma(x,y) = \frac{1}{2\pi\sigma^2} \exp\!\left(-\frac{x^2 + y^2}{2\sigma^2}\right)
$$

Kernel size is derived automatically from $\sigma$ (OpenCV convention: $k = 2 \lceil 3\sigma \rceil + 1$, passed as `ksize=(0,0)`).

### 6.4 Python Implementation

```python
import cv2
import numpy as np

def apply_flat_field(image: np.ndarray, sigma: float = 45.0) -> np.ndarray:
    """Apply flat-field correction to reduce uneven illumination.
    
    corrected = image − GaussianBlur(image, σ) + 128
    
    Args:
        image: RGB uint8 array, shape (H, W, 3).
        sigma: Gaussian blur σ (spatial scale of illumination estimate).
    Returns:
        Corrected RGB uint8 array, shape (H, W, 3).
    """
    blur = cv2.GaussianBlur(image, (0, 0), sigma)
    corrected = image.astype(np.float32) - blur.astype(np.float32) + 128.0
    return np.clip(corrected, 0, 255).astype(np.uint8)
```

---

## 7. Stage 3 — Upgraded CLAHE (Dual-Constraint, Stochastic)

### 7.1 Purpose

Enhance local contrast to improve visibility of small DR lesion features (microaneurysms, dot hemorrhages) that are often obscured by uneven illumination or low inherent contrast. The dual-constraint clip limit prevents over-enhancement artifacts. Stochastic application at train time provides implicit data augmentation.

### 7.2 Method

**Name:** Dual-Constraint CLAHE on LAB L-Channel with Stochastic Application  
**Input:** $I^{(2)} \in \mathbb{R}^{512 \times 512 \times 3}$ (RGB uint8)  
**Output:** $I^{(3)} \in \mathbb{R}^{512 \times 512 \times 3}$ (RGB uint8)  
**Key Parameters:**

| Parameter | Symbol | Default | Description |
|-----------|--------|---------|-------------|
| Tile grid | $(T_r, T_c)$ | $(8, 8)$ | Number of tiles (rows, columns) |
| Clip factor | $\alpha$ | 2.0 | Scale factor for per-tile clip limit |
| Global threshold | $\beta$ | 0.01 | Global cap as fraction of tile area |
| Train probability | $p_{\text{clahe}}$ | 0.8 | Application probability at train time |

**Assumptions:** The L-channel of LAB color space isolates luminance from chrominance, ensuring contrast enhancement does not distort color information. The 8×8 grid provides spatially adaptive enhancement.

### 7.3 Mathematical Formalization

**Color space conversion.** Convert RGB → LAB and extract the luminance channel:

$$
(L, a, b) = \text{RGB2LAB}\!\bigl(I^{(2)}\bigr), \quad L \in [0, 255]^{512 \times 512}
$$

**Tile decomposition.** Partition $L$ into an $8 \times 8$ grid of tiles. For tile at grid position $(i, j)$:

$$
L_{ij} = L\!\left[i \cdot t_h : (i+1) \cdot t_h,\;\; j \cdot t_w : (j+1) \cdot t_w\right]
$$

where $t_h = \lfloor 512 / T_r \rfloor = 64$ and $t_w = \lfloor 512 / T_c \rfloor = 64$. Each tile has area $A_{ij} = t_h \times t_w = 4096$ pixels.

**Dual-constraint clip limit.** The per-tile clip limit is:

$$
\text{CL}_{ij} = \min\!\left(\alpha \cdot \frac{A_{ij}}{256},\;\; \beta \cdot A_{ij}\right)
$$

With default values: $\text{CL} = \min(2.0 \times 16,\; 0.01 \times 4096) = \min(32.0,\; 40.96) = 32.0$.

**Histogram clipping and redistribution.** For each tile, compute the 256-bin histogram $h[k]$, $k \in \{0, \ldots, 255\}$. Clip at $\text{CL}$:

$$
e[k] = \max(h[k] - \text{CL},\; 0)
$$

$$
h_{\text{clip}}[k] = h[k] - e[k]
$$

Redistribute excess counts uniformly:

$$
E = \sum_{k=0}^{255} e[k], \quad h_{\text{redist}}[k] = h_{\text{clip}}[k] + \left\lfloor \frac{E}{256} \right\rfloor + \mathbb{1}[k < E \bmod 256]
$$

**CDF-based equalization.** Compute the cumulative distribution function and apply as a lookup table:

$$
\text{CDF}[k] = \sum_{j=0}^{k} h_{\text{redist}}[j]
$$

$$
\text{LUT}[k] = \text{clip}\!\left(\frac{\text{CDF}[k] - \text{CDF}_{\min}}{\text{CDF}_{\max} - \text{CDF}_{\min}} \times 255,\;\; 0,\;\; 255\right)
$$

$$
L'_{ij}(x,y) = \text{LUT}\!\bigl[L_{ij}(x,y)\bigr]
$$

**Reconstruction.** Merge the enhanced L-channel with the original a, b channels and convert back:

$$
I^{(3)} = \text{LAB2RGB}(L', a, b)
$$

**Stochastic gating.** At train time, the entire CLAHE step is skipped with probability $1 - p_{\text{clahe}}$:

$$
I^{(3)} = 
\begin{cases}
\text{CLAHE}(I^{(2)}) & \text{with probability } p_{\text{clahe}} \text{ (train) or always (inference)} \\
I^{(2)} & \text{with probability } 1 - p_{\text{clahe}} \text{ (train only)}
\end{cases}
$$

### 7.4 Python Implementation

```python
import cv2
import numpy as np
from dataclasses import dataclass

@dataclass
class ClaheParams:
    tile_grid_size: tuple[int, int] = (8, 8)
    clip_factor: float = 2.0
    global_threshold: float = 0.01

def _clip_histogram(hist: np.ndarray, clip_limit: float) -> np.ndarray:
    """Clip histogram at clip_limit and redistribute excess uniformly."""
    excess = np.maximum(hist - clip_limit, 0.0)
    clipped = hist - excess
    redistribute = excess.sum()
    if redistribute > 0:
        clipped += redistribute // 256
        remainder = int(redistribute % 256)
        if remainder > 0:
            clipped[:remainder] += 1
    return clipped

def _tile_equalize(tile: np.ndarray, clip_limit: float) -> np.ndarray:
    """Equalize a single tile using clipped, redistributed histogram."""
    hist, _ = np.histogram(tile.flatten(), bins=256, range=(0, 256))
    hist = hist.astype(np.float32)
    clipped = _clip_histogram(hist, clip_limit)
    cdf = np.cumsum(clipped)
    cdf_norm = (cdf - cdf.min()) / (cdf.max() - cdf.min() + 1e-6)
    lut = np.clip(cdf_norm * 255.0, 0, 255).astype(np.uint8)
    return lut[tile]

def apply_upgraded_clahe(image_rgb: np.ndarray,
                         params: ClaheParams = ClaheParams()) -> np.ndarray:
    """Apply dual-constraint CLAHE to the L-channel of an RGB image.
    
    Args:
        image_rgb: RGB uint8 array, shape (H, W, 3).
        params: ClaheParams controlling tile size and clip limits.
    Returns:
        Enhanced RGB uint8 array, shape (H, W, 3).
    """
    lab = cv2.cvtColor(image_rgb, cv2.COLOR_RGB2LAB)
    l_ch, a_ch, b_ch = cv2.split(lab)
    
    h, w = l_ch.shape
    ty, tx = params.tile_grid_size
    th, tw = max(h // ty, 1), max(w // tx, 1)
    enhanced = np.zeros_like(l_ch)
    
    for y in range(0, h, th):
        for x in range(0, w, tw):
            tile = l_ch[y:y+th, x:x+tw]
            area = tile.size
            cl = params.clip_factor * (area / 256)
            if params.global_threshold > 0:
                cl = min(cl, params.global_threshold * area)
            enhanced[y:y+th, x:x+tw] = _tile_equalize(tile, cl)
    
    merged = cv2.merge((enhanced, a_ch, b_ch))
    return cv2.cvtColor(merged, cv2.COLOR_LAB2RGB)

def maybe_apply_clahe(image_rgb: np.ndarray,
                      params: ClaheParams = ClaheParams(),
                      is_training: bool = True,
                      train_prob: float = 0.8) -> np.ndarray:
    """CLAHE with stochastic skip at train time; always applied at inference."""
    if is_training and np.random.rand() > train_prob:
        return image_rgb
    return apply_upgraded_clahe(image_rgb, params)
```

---

## 8. Stage 5 — Integrated Augmentation (Train Only)

### 8.1 Purpose

Expand effective training set diversity through geometric and photometric transformations while preserving diagnostic features. Augmentation is integrated into the pipeline (not a separate layer) and applied only during training. At inference, Stage 5 is an identity transform.

### 8.2 Method

**Name:** Unified Affine + Brightness/Contrast + PCA Color Jitter  
**Input:** $I^{(3)} \in \mathbb{R}^{512 \times 512 \times 3}$ (RGB uint8)  
**Output:** $I^{(5)} \in \mathbb{R}^{512 \times 512 \times 3}$ (RGB uint8)  
**Key Parameters:**

| Parameter | Symbol | Default | Description |
|-----------|--------|---------|-------------|
| Rotation σ | $\sigma_r$ | adaptive or 13.0° | Truncated Gaussian σ for rotation |
| Rotation clip | $\theta_{\max}$ | 40.0° | Hard clip on rotation angle |
| Zoom range | $[z_{\min}, z_{\max}]$ | $[0.9, 1.1]$ | Log-uniform isotropic zoom |
| Stretch range | $[s_{\min}, s_{\max}]$ | $[1/1.05, 1.05]$ | Log-uniform anisotropic stretch |
| Shear range | $[\phi_{\min}, \phi_{\max}]$ | $[-2°, 2°]$ | Uniform shear angle |
| Shear probability | $p_{\text{shear}}$ | 0.3 | Probability of applying shear |
| PCA color σ | $\sigma_{\text{pca}}$ | 0.1 | Normal σ for PCA noise magnitude |
| PCA color probability | $p_{\text{pca}}$ | 0.5 | Probability of applying PCA jitter |
| Brightness α range | $[\alpha_{\min}, \alpha_{\max}]$ | $[0.9, 1.1]$ | Contrast multiplier |
| Brightness β range | $[\beta_{\min}, \beta_{\max}]$ | $[-10, 10]$ | Additive brightness offset |
| B/C probability | $p_{\text{bc}}$ | 0.5 | Probability of brightness/contrast |

**Assumptions:** Arbitrary 360° rotation is justified by the circular FOV of fundus images (corner pixels outside the FOV are semantically empty). The truncated Gaussian distribution with adaptive σ from Stage 0b detection provides uncertainty-aware augmentation.

### 8.3 Mathematical Formalization

**Sub-step 5.1 — Unified Affine Transform.**

Sample parameters:

$$
\theta \sim \text{TruncNormal}(0, \sigma_r^2, -\theta_{\max}, \theta_{\max})
$$

where $\sigma_r = \mathcal{R}.\text{rotation\_sigma\_deg}$ if detection was confident, else $\sigma_r = 13.0°$ (fallback).

$$
z \sim \text{LogUniform}(z_{\min}, z_{\max}), \quad
s \sim \text{LogUniform}(s_{\min}, s_{\max})
$$

$$
s_x = z \cdot s, \quad s_y = z / s
$$

$$
\phi \sim 
\begin{cases}
\text{Uniform}(\phi_{\min}, \phi_{\max}) & \text{with prob } p_{\text{shear}} \\
0 & \text{otherwise}
\end{cases}
$$

Build the unified 2×3 affine matrix. Let $\mathbf{R}(\theta)$ be the standard 2×3 rotation matrix about the image center $\mathbf{c} = (256, 256)$:

$$
\mathbf{R}(\theta) = \begin{pmatrix} \cos\theta & \sin\theta & c_x(1 - \cos\theta) - c_y \sin\theta \\ -\sin\theta & \cos\theta & c_x \sin\theta + c_y(1 - \cos\theta) \end{pmatrix}
$$

The unified matrix combines rotation, scale, and shear:

$$
\mathbf{M} = \begin{pmatrix} R_{00} \cdot s_x & R_{01} + \tan(\phi) & R_{02} \\ R_{10} & R_{11} \cdot s_y & R_{12} \end{pmatrix}
$$

Apply with stochastic interpolation (60% bilinear, 30% bicubic, 10% nearest) and reflect-border padding:

$$
I_{\text{affine}}(\mathbf{p}) = I^{(3)}\!\bigl(\mathbf{M}^{-1} \mathbf{p}\bigr), \quad \text{border: REFLECT}
$$

**Sub-step 5.2 — Brightness/Contrast.** With probability $p_{\text{bc}}$:

$$
\alpha \sim \text{Uniform}(\alpha_{\min}, \alpha_{\max}), \quad \beta \sim \text{Uniform}(\beta_{\min}, \beta_{\max})
$$

$$
I_{\text{bc}}(x,y,c) = \text{clip}\!\bigl(\alpha \cdot I_{\text{affine}}(x,y,c) + \beta,\;\; 0,\;\; 255\bigr)
$$

**Sub-step 5.3 — PCA Color Jitter.** With probability $p_{\text{pca}}$, given pre-computed eigenvectors $\mathbf{V} \in \mathbb{R}^{3 \times 3}$ and eigenvalues $\boldsymbol{\lambda} \in \mathbb{R}^3$ of the RGB covariance matrix of the training set:

$$
\boldsymbol{\alpha} \sim \mathcal{N}(\mathbf{0}, \sigma_{\text{pca}}^2 \mathbf{I}_3)
$$

$$
\boldsymbol{\delta} = \mathbf{V} \cdot (\boldsymbol{\alpha} \odot \boldsymbol{\lambda}) \in \mathbb{R}^3
$$

$$
I^{(5)}(x,y,c) = \text{clip}\!\bigl(I_{\text{bc}}(x,y,c) + \delta_c,\;\; 0,\;\; 255\bigr)
$$

This is the AlexNet-style PCA color augmentation (Krizhevsky et al., 2012), adding a data-dependent color perturbation along the principal axes of the training color distribution.

### 8.4 Python Implementation

See `src/data/augmentation_v4.py` (294 lines). The key sampling logic:

```python
import cv2
import numpy as np

def sample_affine_params(config, od_fovea_result=None):
    """Sample geometric augmentation parameters.
    
    Returns dict with keys: theta (°), sx, sy, shear_rad (rad).
    """
    # Adaptive or fallback rotation σ
    if (config.adaptive_rotation_sigma 
        and od_fovea_result is not None 
        and od_fovea_result.confident):
        sigma_r = od_fovea_result.rotation_sigma_deg
    else:
        sigma_r = config.fallback_rotation_sigma  # 13.0°
    
    # Truncated Gaussian rotation
    theta = float(np.clip(np.random.normal(0, sigma_r),
                          -config.rotation_clip, config.rotation_clip))
    
    # Log-uniform zoom
    zoom = float(np.exp(np.random.uniform(
        np.log(config.zoom_range[0]), np.log(config.zoom_range[1]))))
    
    # Log-uniform anisotropic stretch
    stretch = float(np.exp(np.random.uniform(
        np.log(config.stretch_range[0]), np.log(config.stretch_range[1])))
    ) if config.use_stretch else 1.0
    
    sx, sy = zoom * stretch, zoom / stretch
    
    # Conditional shear
    if config.use_shear and np.random.rand() < config.shear_prob:
        shear_deg = float(np.random.uniform(*config.shear_range))
    else:
        shear_deg = 0.0
    
    return {"theta": theta, "sx": sx, "sy": sy,
            "shear_rad": float(np.deg2rad(shear_deg))}

def apply_pca_color(image, eigvecs, eigvals, sigma=0.1):
    """PCA color jitter (AlexNet-style).
    
    Args:
        image: RGB uint8 array, shape (H, W, 3).
        eigvecs: (3, 3) PCA eigenvectors of training RGB covariance.
        eigvals: (3,) PCA eigenvalues.
        sigma: Normal σ for noise magnitude.
    Returns:
        Jittered RGB uint8 array.
    """
    alpha = np.random.normal(0, sigma, size=3)
    noise = eigvecs @ (alpha * eigvals)  # (3,) color shift
    return np.clip(image.astype(np.float32) + noise, 0, 255).astype(np.uint8)
```

---

## 9. Stage 4 — ImageNet Normalization

### 9.1 Purpose

Convert the processed RGB uint8 image to a float32 tensor normalized with ImageNet channel statistics, matching the distribution expected by the pre-trained CNN backbone weights (ResNet-50, EfficientNet-B3).

### 9.2 Method

**Name:** ToTensor + ImageNet Channel-wise Normalization  
**Input:** $I^{(5)} \in \{0, \ldots, 255\}^{512 \times 512 \times 3}$ (RGB uint8, HWC)  
**Output:** $T \in \mathbb{R}^{3 \times 512 \times 512}$ (float32 tensor, CHW)  
**Key Parameters:**

| Parameter | Symbol | Value | Description |
|-----------|--------|-------|-------------|
| Mean | $\boldsymbol{\mu}$ | $(0.485, 0.456, 0.406)$ | ImageNet per-channel mean |
| Std | $\boldsymbol{\sigma}$ | $(0.229, 0.224, 0.225)$ | ImageNet per-channel std |

**Assumptions:** The pre-trained backbone weights were learned on ImageNet-normalized inputs. Matching this distribution preserves the transferability of learned feature representations.

### 9.3 Mathematical Formalization

**Step 1 — ToTensor.** Convert HWC uint8 to CHW float32 in $[0, 1]$:

$$
\tilde{I}_c(x,y) = \frac{I^{(5)}(x, y, c)}{255.0}, \quad c \in \{0, 1, 2\}
$$

with axis transposition $(H, W, C) \to (C, H, W)$.

**Step 2 — Channel-wise normalization:**

$$
T_c(x,y) = \frac{\tilde{I}_c(x,y) - \mu_c}{\sigma_c}
$$

The combined operation for the red channel ($c = 0$) with ImageNet statistics:

$$
T_0(x,y) = \frac{I^{(5)}(x,y,0) / 255.0 - 0.485}{0.229}
$$

### 9.4 Python Implementation

```python
import numpy as np
import torch
from torchvision import transforms

def imagenet_normalize(
    image: np.ndarray,
    mean: tuple = (0.485, 0.456, 0.406),
    std: tuple = (0.229, 0.224, 0.225),
) -> torch.Tensor:
    """Convert RGB uint8 image to ImageNet-normalized CHW float32 tensor.
    
    Args:
        image: RGB uint8 array, shape (H, W, 3).
        mean: Per-channel mean.
        std: Per-channel standard deviation.
    Returns:
        Float32 tensor, shape (3, H, W).
    """
    transform = transforms.Compose([
        transforms.ToTensor(),       # HWC uint8 → CHW float32 [0, 1]
        transforms.Normalize(mean=list(mean), std=list(std)),
    ])
    return transform(image)
```

---

## 10. Complete Pipeline Orchestration

### 10.1 Execution Flowchart

```
I_raw (BGR uint8, H₀×W₀×3)
  │
  ├─ BGR → RGB conversion
  │
  ├─ Stage 0a: Canonical Flip (if eye_side == "left")
  ├─ Stage 0b: OD-Fovea Rotation (if confident)
  │
  ├─ Stage 1: FOV Crop + Resize → 512×512      [always]
  │
  ├─ Stage 2: Flat-Field Correction              [toggleable]
  │
  ├─ Stage 3: Upgraded CLAHE (stochastic @train) [toggleable]
  │
  ├─ Stage 5: Augmentation (train only)          [train only]
  │     ├─ Unified affine (rotation+zoom+stretch+shear)
  │     ├─ Brightness/contrast
  │     └─ PCA color jitter
  │
  └─ Stage 4: ImageNet Normalize → Tensor        [always, last]
       │
       T (float32, 3×512×512)
```

### 10.2 Pipeline Presets

Two model-specific presets control augmentation intensity:

| Parameter | `resnet` preset | `efficientnet` preset |
|-----------|----------------|----------------------|
| CLAHE train prob | 0.8 | 0.5 |
| PCA color | enabled (p=0.5) | disabled |
| Brightness/contrast prob | 0.5 | 0.3 |
| Shear | enabled (p=0.3) | disabled |
| Stretch | enabled | enabled |
| OD-fovea rotation | enabled | enabled |
| Adaptive rotation σ | enabled | enabled |

The `efficientnet` preset uses reduced augmentation because EfficientNet's compound scaling already provides implicit regularization.

### 10.3 Baseline vs. Full Pipeline

| Condition | Stages Executed | Configuration |
|-----------|----------------|---------------|
| **Baseline (ABSENT)** | 1 → 4 | Crop + resize + ImageNet normalize only |
| **Full V4 (ACTIVE)** | 0a → 0b → 1 → 2 → 3 → 5 → 4 | All stages, model-specific preset |

### 10.4 Unified Pipeline Call

```python
class PreprocessingPipelineV4:
    def __call__(self, image: np.ndarray, eye_side: str = "unknown") -> torch.Tensor:
        # BGR → RGB (if input from cv2.imread)
        if self._input_color_space == "bgr":
            image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # Stage 0: Canonical orientation
        od_fovea_result = None
        if self.config.use_canonical_flip or self.config.use_od_fovea_rotation:
            image, od_fovea_result = canonical_orientation(
                image, eye_side=eye_side,
                enable_rotation=self.config.use_od_fovea_rotation)
        
        # Stage 1: FOV crop + resize (always)
        image = crop_and_resize(image, self.config.target_size)
        
        # Stage 2: Flat-field correction (toggleable)
        if self.config.use_flat_field:
            image = apply_flat_field(image, self.config.flat_field_sigma)
        
        # Stage 3: Upgraded CLAHE (toggleable, stochastic at train)
        if self.config.use_clahe:
            image = maybe_apply_clahe(image, self._clahe_params,
                                      self.is_training, self.config.clahe_train_prob)
        
        # Stage 5: Augmentation (train only)
        if self.is_training:
            image = self._augmentation(image, od_fovea_result=od_fovea_result)
        
        # Stage 4: ImageNet normalize → tensor (always last)
        return imagenet_normalize(image, self.config.normalize_mean,
                                  self.config.normalize_std)
```

---

## 11. Summary of All Variables

| Variable | Type | Shape/Range | Stage | Description |
|----------|------|-------------|-------|-------------|
| $I_{\text{raw}}$ | uint8 | $(H_0, W_0, 3)$ | Input | Raw BGR image from `cv2.imread` |
| $I_{\text{rgb}}$ | uint8 | $(H_0, W_0, 3)$ | Entry | After BGR→RGB conversion |
| $s$ | str | `{left, right, unknown}` | 0a | Eye laterality from metadata |
| $I^{(0a)}$ | uint8 | $(H_0, W_0, 3)$ | 0a | After canonical flip |
| $G$ | uint8 | $(H_0, W_0)$ | 0b | Green channel (best contrast) |
| $\mathbf{c}_{\text{od}}$ | (int, int) | pixel coords | 0b | Optic disc center |
| $r_{\text{od}}$ | float | pixels | 0b | OD equivalent radius |
| $\mathbf{c}_{\text{fov}}$ | (int, int) | pixel coords | 0b | Fovea center |
| $\theta$ | float | degrees | 0b | OD→fovea vector angle |
| $\sigma_\theta$ | float | $[0, 15]°$ | 0b | Adaptive rotation σ |
| $I^{(0b)}$ | uint8 | $(H_0, W_0, 3)$ | 0b | After rotation normalization |
| $b_c$ | int | $[0, 255]$ | 1 | Background level per channel |
| $\text{bbox}$ | (int, int, int, int) | pixels | 1 | FOV bounding box |
| $I^{(1)}$ | uint8 | $(512, 512, 3)$ | 1 | Cropped + resized |
| $\sigma_{\text{ff}}$ | float | 45.0 | 2 | Flat-field Gaussian σ |
| $\hat{L}_c$ | float32 | $(512, 512)$ | 2 | Estimated illumination field |
| $I^{(2)}$ | uint8 | $(512, 512, 3)$ | 2 | Illumination-corrected |
| $L$ | uint8 | $(512, 512)$ | 3 | LAB L-channel |
| $\alpha$ | float | 2.0 | 3 | CLAHE clip factor |
| $\beta$ | float | 0.01 | 3 | CLAHE global threshold |
| $\text{CL}_{ij}$ | float | computed | 3 | Per-tile clip limit |
| $h[k]$ | float32 | $(256,)$ | 3 | Tile histogram |
| $\text{LUT}[k]$ | uint8 | $(256,)$ | 3 | Equalization lookup table |
| $I^{(3)}$ | uint8 | $(512, 512, 3)$ | 3 | CLAHE-enhanced |
| $\sigma_r$ | float | degrees | 5 | Rotation σ (adaptive or 13°) |
| $z$ | float | $[0.9, 1.1]$ | 5 | Isotropic zoom factor |
| $s_x, s_y$ | float | — | 5 | Horizontal/vertical scale |
| $\phi$ | float | degrees | 5 | Shear angle |
| $\mathbf{M}$ | float64 | $(2, 3)$ | 5 | Unified affine matrix |
| $\mathbf{V}$ | float64 | $(3, 3)$ | 5 | PCA eigenvectors (offline) |
| $\boldsymbol{\lambda}$ | float64 | $(3,)$ | 5 | PCA eigenvalues (offline) |
| $\boldsymbol{\delta}$ | float32 | $(3,)$ | 5 | PCA color perturbation |
| $I^{(5)}$ | uint8 | $(512, 512, 3)$ | 5 | Augmented |
| $\boldsymbol{\mu}$ | float | $(0.485, 0.456, 0.406)$ | 4 | ImageNet mean |
| $\boldsymbol{\sigma}$ | float | $(0.229, 0.224, 0.225)$ | 4 | ImageNet std |
| $T$ | float32 | $(3, 512, 512)$ | 4 | **Final output tensor** |

---

## 12. Summary of All Methods

| Stage | Method Name | Purpose | Deterministic? |
|-------|-------------|---------|----------------|
| 0a | Horizontal Mirror Flip | Standardize eye laterality | Yes |
| 0b | Classical CV OD/Fovea Detection + Rotation | Standardize retinal axis | Yes (conditional) |
| 1 | PIL Foreground Detection + Resize | Remove background, unify resolution | Yes |
| 2 | Gaussian Blur Subtraction | Correct illumination gradient | Yes |
| 3 | Dual-Constraint Tile CLAHE | Enhance local contrast | Stochastic (train) |
| 5 | Unified Affine + BC + PCA Color | Data augmentation | Stochastic (train) |
| 4 | ToTensor + Channel Normalization | Convert to CNN input format | Yes |

The pipeline is **fully deterministic at inference** (all stochastic elements are gated by `is_training=False`). At training time, Stages 3 and 5 introduce controlled stochasticity for regularization and diversity.

---

## 13. Reproducibility Controls

| Control | Value | Effect |
|---------|-------|--------|
| Random seed | 42 | Fixed via `torch.manual_seed(42)` + `np.random.seed(42)` |
| Deterministic mode | `torch.use_deterministic_algorithms(True)` | Eliminates non-deterministic CUDA ops |
| Pipeline parameters | Frozen in `configs/default.yaml` | All hyperparameters version-controlled |
| Augmentation toggles | Per-preset (`resnet` / `efficientnet`) | Documented and reproducible |
| PCA eigenvectors | Pre-computed offline from training set | Stored at `data/processed/pca_eigvecs.npy` |
