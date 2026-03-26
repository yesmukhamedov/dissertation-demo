import { C, CLIN, CALIBRATION, TRAIN_TEST_GAP } from '../data';
import { Card, Sec, DataTable, Paired, Note, ImageFigure } from '../components';

export default function ValClinical() {
  return (
    <div>
      <Sec title="Clinical Screening — Referable DR (Grade ≥ 2)">
        <Paired
          items={CLIN.map(d => ({ label: d.m, v1: d.b, v2: d.v }))}
          c1={C.gray}
          c2={C.teal}
          l1="Baseline"
          l2="Pipeline"
        />
        <DataTable
          headers={['Metric', 'Baseline', 'Pipeline', 'Δ']}
          rows={CLIN.map(d => [
            d.m, d.b.toFixed(3), d.v.toFixed(3),
            `+${((d.v - d.b) * 100).toFixed(1)}pp`,
          ])}
        />
        <ImageFigure
          src={process.env.PUBLIC_URL + '/results/14_clinical_metrics.png'}
          caption="Clinical screening metrics for referable DR (binary: non-referable DR 0–1 vs referable DR 2–4). Pipeline improves sensitivity by +8pp (0.82→0.90), reducing missed referrals."
          figNum="14"
        />
        <Note>
          WHO screening guidelines recommend Sensitivity ≥ 80%, Specificity ≥ 80%.
          Preprocessing improves sensitivity from 0.82 to 0.90 (+8pp) — clinically significant for reducing
          missed referrals. NPV 0.92→0.96 means fewer false negatives in the non-referable classification.
          Both baseline and pipeline exceed WHO thresholds; pipeline provides meaningful additional safety margin.
        </Note>
      </Sec>

      <Sec title="Model Calibration">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
          <Card label="ECE (Baseline)" value="0.082" color="gray" />
          <Card label="ECE (Pipeline)" value="0.045" color="purple" delta="−45% ✓" />
          <Card label="Brier (Baseline)" value="0.185" color="gray" />
          <Card label="Brier (Pipeline)" value="0.142" color="purple" delta="−23% ✓" />
        </div>
        <DataTable
          headers={['Calibration Metric', 'Baseline', 'Pipeline', 'Improvement']}
          rows={CALIBRATION.map(d => [d.metric, d.baseline.toFixed(3), d.pipeline.toFixed(3), d.improvement])}
        />
        <ImageFigure
          src={process.env.PUBLIC_URL + '/results/15_calibration.png'}
          caption="Reliability diagram (calibration curves) for baseline and pipeline. Pipeline curve is closer to the diagonal (perfect calibration), particularly for high-confidence predictions."
          figNum="15"
        />
        <Note>
          Expected Calibration Error (ECE) reduced by 45% (0.082→0.045): probability outputs are significantly
          more trustworthy. Brier Score reduced by 23% (0.185→0.142). Well-calibrated probabilities are
          essential for clinical decision support, where probability thresholds determine referral decisions.
        </Note>
      </Sec>

      <Sec title="Training-Test Gap">
        <DataTable
          headers={['Config', 'Train F1', 'Test F1', 'Gap (pp)']}
          rows={TRAIN_TEST_GAP.map(d => [
            d.config, d.trainF1.toFixed(3), d.testF1.toFixed(3), `${d.gap.toFixed(1)}pp`,
          ])}
        />
        <Note>
          Gaps of 5.8–7.3pp are consistent across configurations, indicating no systematic overfitting.
          Patient-level 5-fold CV prevents data leakage through bilateral correlation.
        </Note>
      </Sec>
    </div>
  );
}
