import { C, CONFIGS, CLS, CLS_AUC } from '../data';
import { Card, Sec, DataTable, Paired, Note, ImageFigure } from '../components';

export default function ResultsBestConfig() {
  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 4px 0', color: 'var(--color-text-primary,#222)' }}>
          Config D — Best Single-Image Configuration
        </h2>
        <div style={{ fontSize: 12, color: 'var(--color-text-secondary,#666)' }}>
          Full V4 Pipeline + EfficientNet-B3 | EyePACS 40% subset | 3-fold CV
        </div>
      </div>

      <Sec title="Key Metrics">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Card label="Weighted F1" value="0.780" delta="+5.3pp vs Config C" color="blue" sub="EH-3 ≥ 5pp ✓" />
          <Card label="ROC-AUC" value="0.865" delta="+4.4pp vs Config C" color="teal" sub="EH-3 ≥ 2pp ✓" />
          <Card label="Cohen's κ" value="0.700" delta="+8.0pp vs Config C" color="purple" sub="No degradation ✓" />
          <Card label="Accuracy" value="0.770" delta="+5.1pp vs Config C" color="amber" />
        </div>
        <Note>
          Config D achieves +5.3pp weighted F1 and +4.4pp AUC over baseline (Config C, same architecture).
          Statistical significance: DeLong p=0.008, McNemar p=0.012, Bootstrap 95% CI for ΔF1: [+2.8pp, +7.8pp].
          Holm-corrected p_adj=0.024.
        </Note>
      </Sec>

      <Sec title="Per-Class F1 — Baseline (C) vs Pipeline (D)">
        <Paired
          items={CLS.map(d => ({ label: `${d.g} (n≈${d.n.toLocaleString()})`, v1: d.b, v2: d.pp }))}
          c1={C.gray}
          c2={C.teal}
          l1="Baseline (C)"
          l2="Pipeline (D)"
        />
        <DataTable
          headers={['DR Grade', 'N (samples)', 'Baseline F1', 'Pipeline F1', 'ΔF1']}
          rows={CLS.map(d => [
            d.g, d.n.toLocaleString(), d.b.toFixed(3), d.pp.toFixed(3),
            `+${((d.pp - d.b) * 100).toFixed(1)}pp`,
          ])}
          highlightRow={(row, i) => i === 1}
        />
        <Note>
          DR 1 (Mild NPDR) is the hardest class: subtle microaneurysms + severe class imbalance (n≈490 / 14,050).
          Preprocessing provides the largest relative lift on minority classes: +12pp for DR 1, +12pp for DR 3.
          DR 0 (No DR) is near-saturated at baseline (0.88) with modest additional gain (+3pp).
        </Note>
      </Sec>

      <Sec title="Per-Class ROC-AUC">
        <DataTable
          headers={['DR Grade', 'Baseline AUC', 'Pipeline AUC', 'ΔAUC']}
          rows={CLS_AUC.map(d => [
            d.g, d.baseline.toFixed(3), d.pipeline.toFixed(3),
            `+${((d.pipeline - d.baseline) * 100).toFixed(1)}pp`,
          ])}
        />
      </Sec>

      <Sec title="Confusion Matrix">
        <ImageFigure
          src={process.env.PUBLIC_URL + '/results/20_confusion_matrix.png'}
          caption="Confusion matrix for Config D. Strong diagonal dominance. Primary confusions: DR 1↔DR 0 (mild NPDR vs no DR), DR 2↔DR 3 (adjacent grades). These are clinically expected: adjacent-grade boundaries are ambiguous even for expert graders."
          figNum="20"
        />
      </Sec>
    </div>
  );
}
