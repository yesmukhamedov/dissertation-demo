import { C, ALO, IOU, ATTENTION_CONSISTENCY } from '../data';
import { Sec, DataTable, Paired, Hbar, Note, ImageFigure } from '../components';

export default function ExpH5() {
  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 4px 0', color: 'var(--color-text-primary,#222)' }}>
          H-5: Explainability (ALO) Hypothesis
        </h2>
        <div style={{ fontSize: 12, color: 'var(--color-text-secondary,#666)' }}>
          Experiment 4 — Grad-CAM attention analysis with EfficientNet-B4 on IDRiD lesion masks
        </div>
      </div>

      <Sec title="ALO by Lesion Type — Baseline vs Pipeline">
        <Paired
          items={ALO.map(d => ({ label: d.l, v1: d.ab, v2: d.ap }))}
          c1={C.gray}
          c2={C.teal}
          l1="Baseline"
          l2="Pipeline"
        />
        <DataTable
          headers={['Lesion Type', 'Baseline ALO', 'Pipeline ALO', 'ΔALO', 'Relative Improvement']}
          rows={ALO.map(d => [
            d.l,
            d.ab.toFixed(2),
            d.ap.toFixed(2),
            `+${((d.ap - d.ab)).toFixed(2)}`,
            `+${((d.ap - d.ab) / d.ab * 100).toFixed(0)}%`,
          ])}
        />
        <ImageFigure src={process.env.PUBLIC_URL + '/results/06_exp4_alo.png'} caption="ALO (Attention-Lesion Overlap) by lesion type. Pipeline increases ALO across all 4 lesion types. Hard exudates achieve highest absolute ALO (0.72); microaneurysms lowest (0.45) due to point-like morphology." figNum="6" />
        <Note>
          ALO = area(GradCAM ∩ lesion_mask) / area(lesion_mask). Primary explainability metric.
          Preprocessing improves ALO by +31–61% across all lesion types.
          Hard exudates benefit most (bright, well-defined boundary → strong contrast response after CLAHE).
          Microaneurysms benefit least (tiny, point-like → difficult to localize with diffuse Grad-CAM).
        </Note>
      </Sec>

      <Sec title="IoU by Lesion Type — Baseline vs Pipeline">
        <Paired
          items={IOU.map(d => ({ label: d.l, v1: d.baseline, v2: d.pipeline }))}
          c1={C.gray}
          c2={C.purple}
          l1="Baseline"
          l2="Pipeline"
        />
        <DataTable
          headers={['Lesion Type', 'Baseline IoU', 'Pipeline IoU', 'ΔIoU']}
          rows={IOU.map(d => [
            d.l,
            d.baseline.toFixed(2),
            d.pipeline.toFixed(2),
            `+${(d.pipeline - d.baseline).toFixed(2)}`,
          ])}
        />
        <ImageFigure src={process.env.PUBLIC_URL + '/results/07_exp4_iou.png'} caption="IoU (Intersection over Union) by lesion type. IoU values are lower than ALO due to stricter penalization of activation outside lesion boundaries. Pipeline consistently improves IoU across all lesion types." figNum="7" />
        <Note>
          IoU = area(GradCAM ∩ lesion_mask) / area(GradCAM ∪ lesion_mask). Secondary metric — stricter than ALO
          because it penalizes excessive activation outside lesions. Lower absolute values are expected since Grad-CAM
          activations are inherently diffuse. Pipeline reduces off-lesion activation by suppressing non-diagnostic
          image regions through flat-field correction and CLAHE.
        </Note>
      </Sec>

      <Sec title="Relative ALO Improvement by Lesion Type">
        <Hbar
          items={ALO.map(d => ({
            label: d.l,
            v: parseFloat(((d.ap - d.ab) / d.ab * 100).toFixed(1)),
            color: C.coral,
          }))}
          maxV={75}
        />
      </Sec>

      <Sec title="Attention Consistency Across Datasets">
        <DataTable
          headers={['Dataset Pair', 'Baseline Consistency', 'Pipeline Consistency', 'Δ']}
          rows={ATTENTION_CONSISTENCY.map(d => [
            d.pair,
            d.baseline.toFixed(2),
            d.pipeline.toFixed(2),
            `+${(d.pipeline - d.baseline).toFixed(2)}`,
          ])}
        />
        <ImageFigure src={process.env.PUBLIC_URL + '/results/28_attention_consistency.png'} caption="Attention consistency (cosine similarity of Grad-CAM maps) between dataset pairs. Pipeline increases cross-dataset attention consistency by 0.20–0.22 points, confirming more stable feature localization across cameras." figNum="28" />
        <Note>
          Attention consistency measures cosine similarity of Grad-CAM heatmaps (normalized) between paired images
          of the same patient across different datasets/cameras. Higher consistency indicates the model attends to
          the same anatomical structures regardless of camera device — a key robustness indicator.
        </Note>
      </Sec>
    </div>
  );
}
