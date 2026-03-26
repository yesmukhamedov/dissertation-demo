import { C, GEN, GEN_AUC, G_RATIO } from '../data';
import { Card, Sec, DataTable, Paired, Note, ImageFigure } from '../components';

export default function ExpH4() {
  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 4px 0', color: 'var(--color-text-primary,#222)' }}>
          H-4: Cross-Dataset Transfer Hypothesis
        </h2>
        <div style={{ fontSize: 12, color: 'var(--color-text-secondary,#666)' }}>
          Experiment 5 — Zero-shot generalization to IDRiD and Messidor-2
        </div>
      </div>

      <Sec title="Generalization Ratio G">
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          {G_RATIO.map(d => (
            <Card
              key={d.dataset}
              label={`G (${d.dataset})`}
              value={d.G_pipeline.toFixed(2)}
              delta={d.G_pipeline >= d.threshold ? `≥ ${d.threshold} ✓` : `< ${d.threshold} ✗`}
              color={d.G_pipeline >= d.threshold ? 'green' : 'red'}
              sub={`Baseline: ${d.G_baseline.toFixed(2)}`}
            />
          ))}
        </div>
        <Note>
          H-4: G = F1_external / F1_EyePACS ≥ 0.85 on both datasets.
          Baseline fails threshold (G=0.81 IDRiD, G=0.84 Messidor-2). Pipeline passes both (G=0.88, G=0.90).
          Preprocessing enables cross-domain transfer by normalizing device-specific imaging characteristics.
        </Note>
      </Sec>

      <Sec title="Cross-Dataset F1 — Baseline vs Pipeline">
        <Paired
          items={GEN.map(d => ({ label: d.d, v1: d.fb, v2: d.fp }))}
          c2={C.blue}
          l1="Baseline"
          l2="Pipeline"
        />
        <DataTable
          headers={['Dataset', 'Baseline F1', 'Pipeline F1', 'ΔF1', 'G (baseline)', 'G (pipeline)']}
          rows={GEN.map(d => [
            d.d,
            d.fb.toFixed(3),
            d.fp.toFixed(3),
            `+${((d.fp - d.fb) * 100).toFixed(1)}pp`,
            d.Gb ? d.Gb.toFixed(2) : '1.00',
            d.Gp ? `${d.Gp.toFixed(2)} ✓` : '1.00',
          ])}
        />
        <ImageFigure src={process.env.PUBLIC_URL + '/results/08_exp5_generalization.png'} caption="Cross-dataset F1 comparison: EyePACS (train), IDRiD (transfer), Messidor-2 (transfer). Pipeline reduces performance drop during domain shift." figNum="8" />
      </Sec>

      <Sec title="Cross-Dataset AUC">
        <DataTable
          headers={['Dataset', 'Baseline AUC', 'Pipeline AUC', 'ΔAUC']}
          rows={GEN_AUC.map(d => [
            d.dataset,
            d.baseline.toFixed(3),
            d.pipeline.toFixed(3),
            `+${((d.pipeline - d.baseline) * 100).toFixed(1)}pp`,
          ])}
        />
      </Sec>

      <Sec title="Generalization Ratio G — Chart">
        <ImageFigure src={process.env.PUBLIC_URL + '/results/09_exp5_G_ratio.png'} caption="Generalization ratio G for IDRiD and Messidor-2. Dashed line at G=0.85 (H-4 threshold). Baseline falls below threshold on IDRiD; pipeline exceeds threshold on both datasets." figNum="9" />
        <Note>
          Models trained on Canon CR-1 (EyePACS) evaluated on Kowa VX-10α (IDRiD) and Topcon TRC NW6 (Messidor-2)
          without any retraining. The V4 preprocessing pipeline normalizes device-specific artifacts, reducing
          domain shift and improving zero-shot transfer performance.
        </Note>
      </Sec>
    </div>
  );
}
