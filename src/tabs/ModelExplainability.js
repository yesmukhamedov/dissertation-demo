import { C } from '../data';
import { Sec, Note, ImageFigure } from '../components';

export default function ModelExplainability() {
  return (
    <div>
      <Sec title="Grad-CAM Methodology">
        <div style={{ fontSize: 12, lineHeight: 1.7, color: 'var(--color-text-primary,#333)' }}>
          <p style={{ margin: '0 0 10px 0' }}>
            Gradient-weighted Class Activation Mapping (Grad-CAM) computes a saliency map by backpropagating
            gradients of the target class score through the final convolutional layer. The resulting heatmap
            highlights image regions that most influenced the model's classification decision.
          </p>
          <p style={{ margin: '0 0 10px 0' }}>
            For DR grading, Grad-CAM saliency is compared against ground-truth lesion segmentation masks
            from the IDRiD dataset (516 images with pixel-level annotations for microaneurysms, hemorrhages,
            hard exudates, and soft exudates). This enables quantitative evaluation of whether the model
            attends to diagnostically relevant regions.
          </p>
        </div>
        <Note>
          EfficientNet-B4 is used exclusively for Exp 4 (explainability). The larger receptive field relative
          to B3 produces more spatially precise Grad-CAM activations, enabling more accurate ALO/IoU computation.
        </Note>
      </Sec>

      <Sec title="ALO Metric Definition">
        <div style={{ background: 'var(--color-background-secondary,#f7f7f5)', borderRadius: 8, padding: '12px 16px', fontFamily: 'monospace', fontSize: 13, lineHeight: 2 }}>
          <div style={{ marginBottom: 8 }}>
            <strong style={{ color: C.teal }}>ALO</strong> = area(GradCAM ∩ lesion_mask) / area(lesion_mask)
          </div>
          <div>
            <strong style={{ color: C.purple }}>IoU</strong> = area(GradCAM ∩ lesion_mask) / area(GradCAM ∪ lesion_mask)
          </div>
        </div>
        <Note>
          ALO (Attention-Lesion Overlap) is the primary explainability metric: it measures what fraction of each
          lesion area the model attends to. Higher ALO means the model focuses on more of the lesion.
          IoU is a stricter secondary metric that additionally penalizes attention outside the lesion boundary.
          GradCAM maps are binarized at the 50th percentile activation threshold before computing overlap.
        </Note>
      </Sec>

      <Sec title="Grad-CAM Overlay — Baseline vs Pipeline">
        <ImageFigure
          src={process.env.PUBLIC_URL + '/results/27_gradcam_overlay.png'}
          caption="Grad-CAM saliency overlaid on fundus images. Left: baseline preprocessing — diffuse, unfocused activation. Right: V4 pipeline — concentrated activation on lesion regions (hemorrhages and hard exudates highlighted). ALO improvement: +61% for hard exudates, +31% for microaneurysms."
          figNum="27"
        />
      </Sec>

      <Sec
        title="Why Preprocessing Improves Explainability"
        note="Enhanced contrast (CLAHE) makes lesion boundaries more distinct in the input feature space, guiding convolutional filters toward diagnostically relevant regions. Flat-field correction removes illumination gradients that would otherwise dominate activation. The result is more focused and interpretable attention maps — a direct consequence of the preprocessing pipeline."
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[
            { stage: 'CLAHE (Stage 3)', effect: 'Increases lesion-background contrast → sharper filter responses at lesion edges', color: C.teal },
            { stage: 'Flat-field (Stage 2)', effect: 'Removes low-frequency illumination → prevents activation at image periphery', color: C.blue },
            { stage: 'Canonical orientation (0a/0b)', effect: 'Consistent anatomical layout → spatially stable feature learning', color: C.purple },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 12px', background: 'var(--color-background-secondary,#f7f7f5)', borderRadius: 6 }}>
              <div style={{ minWidth: 160, fontWeight: 600, fontSize: 11, color: item.color }}>{item.stage}</div>
              <div style={{ fontSize: 11, color: 'var(--color-text-primary,#333)', lineHeight: 1.5 }}>{item.effect}</div>
            </div>
          ))}
        </div>
      </Sec>
    </div>
  );
}
