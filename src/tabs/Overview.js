import { C, CONFIGS, HYPOTHESES } from '../data';
import { Card, Sec, DataTable, ImageFigure } from '../components';

export default function Overview() {
  const D = CONFIGS.D;
  const deltaF1 = ((D.f1 - CONFIGS.C.f1) * 100).toFixed(1);
  const deltaAUC = ((D.auc - CONFIGS.C.auc) * 100).toFixed(1);

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text-primary,#222)', margin: '0 0 4px 0' }}>
          Automated Diabetic Retinopathy Diagnosis
        </h2>
        <p style={{ fontSize: 12, color: 'var(--color-text-secondary,#666)', margin: '0 0 4px 0' }}>
          Fundus Image Enhancement and CNN Classification — PhD Dissertation
        </p>
        <div style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 600, color: C.teal, background: C.tealBg, display: 'inline-block', padding: '4px 10px', borderRadius: 6 }}>
          model = preprocessing + CNN
        </div>
      </div>

      <Sec title="Best Configuration (D) — Key Metrics">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
          <Card label="Weighted F1" value="0.780" delta={`+${deltaF1}pp vs Config C`} color="blue" sub="EH-3: ≥5pp ✓" />
          <Card label="ROC-AUC" value="0.865" delta={`+${deltaAUC}pp vs Config C`} color="teal" sub="EH-3: ≥2pp ✓" />
          <Card label="Cohen's κ" value="0.700" delta="+8.0pp vs Config C" color="purple" sub="No degradation ✓" />
          <Card label="Accuracy" value="0.770" delta="+5.1pp vs Config C" color="amber" />
        </div>
      </Sec>

      <Sec title="Summary Radar Chart">
        <ImageFigure
          src={process.env.PUBLIC_URL + '/results/11_summary_radar.png'}
          caption="Summary performance radar across all 6 configurations (A–F). Config F (binocular + EfficientNet-B3) achieves highest metrics overall; Config D is best single-image configuration."
          figNum="11"
        />
      </Sec>

      <Sec title="Hypothesis Status">
        <DataTable
          headers={['Hypothesis', 'Name', 'Experiment', 'Status', 'Key Finding']}
          rows={HYPOTHESES.map(h => [
            <span key={h.id} style={{ fontWeight: 700, color: C.purple }}>{h.id}</span>,
            h.name,
            h.exp,
            <span key={h.id + 's'} style={{ color: C.teal, fontWeight: 600 }}>{h.status}</span>,
            h.detail,
          ])}
        />
      </Sec>

      <Sec
        title="Central Thesis"
        note="The 5-component preprocessing pipeline (canonical orientation, FOV normalization, flat-field correction, dual-constraint CLAHE, augmentation) is an integral part of the diagnostic model — not ancillary data preparation. Preprocessing is the primary driver of classification improvement for 5-class DR grading. The pipeline preserves diagnostic features while normalizing cross-device variability."
      >
        <div style={{ padding: '12px 14px', background: C.tealBg, borderRadius: 8, fontSize: 12, color: C.tealT, lineHeight: 1.7 }}>
          <strong>Finding:</strong> Preprocessing contributes +5.3pp F1 and +4.4pp AUC for EfficientNet-B3 (statistically significant, DeLong p=0.008).
          The benefit scales with model capacity: EfficientNet-B3 benefits significantly (+5.3pp) while ResNet-50 shows near-zero delta (−0.1pp),
          confirming an architecture × preprocessing interaction effect (mixed-effects ANOVA, p=0.02).
          Cross-device variance is reduced by 46%, and generalization ratios G=0.88–0.90 exceed the H-4 threshold of 0.85 on both external datasets.
        </div>
      </Sec>

      <Sec title="EH-3 Dominance Criterion">
        <DataTable
          headers={['Criterion', 'ResNet-50 (B−A)', 'EfficientNet-B3 (D−C)', 'Threshold']}
          rows={[
            ['ΔF1', `${((CONFIGS.B.f1 - CONFIGS.A.f1) * 100).toFixed(1)}pp`, `+${((CONFIGS.D.f1 - CONFIGS.C.f1) * 100).toFixed(1)}pp ✓`, '≥ 5pp'],
            ['ΔAUC', `${((CONFIGS.B.auc - CONFIGS.A.auc) * 100).toFixed(1)}pp`, `+${((CONFIGS.D.auc - CONFIGS.C.auc) * 100).toFixed(1)}pp ✓`, '≥ 2pp'],
            ['Δκ', `+${((CONFIGS.B.k - CONFIGS.A.k) * 100).toFixed(1)}pp`, `+${((CONFIGS.D.k - CONFIGS.C.k) * 100).toFixed(1)}pp ✓`, '> 0'],
          ]}
          highlightRow={(row, i) => i === 0}
        />
      </Sec>
    </div>
  );
}
