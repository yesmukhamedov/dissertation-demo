import { C, DEV } from '../data';
import { Card, Sec, DataTable, Paired, Note, ImageFigure } from '../components';

export default function ExpH6() {
  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 4px 0', color: 'var(--color-text-primary,#222)' }}>
          H-6: Device Robustness Hypothesis
        </h2>
        <div style={{ fontSize: 12, color: 'var(--color-text-secondary,#666)' }}>
          Experiment 6 — Cross-device evaluation on 5 external camera systems
        </div>
      </div>

      <Sec title="Cross-Device F1 — Baseline vs Pipeline">
        <Paired
          items={DEV.map(d => ({ label: d.c, v1: d.fb, v2: d.fp }))}
          c1={C.gray}
          c2={C.coral}
          l1="Baseline"
          l2="Pipeline"
        />
        <DataTable
          headers={['Camera / Dataset', 'Baseline F1', 'Pipeline F1', 'ΔF1']}
          rows={DEV.map(d => [
            d.c,
            d.fb.toFixed(3),
            d.fp.toFixed(3),
            `+${((d.fp - d.fb) * 100).toFixed(1)}pp`,
          ])}
          highlightRow={(row, i) => i === 0}
        />
        <ImageFigure src={process.env.PUBLIC_URL + '/results/10_exp6_device_shift.png'} caption="Cross-device F1 across 6 camera systems. Pipeline (orange) consistently outperforms baseline (gray). Largest improvement on most distant cameras: ODIR-5K (+9pp), RFMiD (+9pp)." figNum="10" />
        <Note>
          Models trained exclusively on Canon CR-1 (EyePACS) evaluated on 5 external camera systems without retraining.
          Preprocessing pipeline reduces device-specific artifacts (vignetting, illumination gradients, color cast),
          enabling more consistent performance across camera hardware.
        </Note>
      </Sec>

      <Sec title="Cross-Device Variance">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Card label="Variance (Baseline)" value="0.0052" color="red" sub="σ² across camera groups" />
          <Card label="Variance (Pipeline)" value="0.0028" color="green" delta="−46% ✓" sub="σ² across camera groups" />
        </div>
        <Note>
          H-6 confirmation: the V4 preprocessing pipeline reduces cross-device F1 variance by 46% (0.0052 → 0.0028).
          Variance computed across 5 external camera groups (excluding EyePACS training domain).
          Smaller variance indicates more consistent diagnostic performance regardless of imaging device —
          a critical requirement for real-world deployment in diverse clinical settings.
        </Note>
      </Sec>
    </div>
  );
}
