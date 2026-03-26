import { C, STAT_TESTS, TRAIN_TEST_GAP } from '../data';
import { Sec, DataTable, Note, ImageFigure } from '../components';

export default function ResultsStatistical() {
  return (
    <div>
      <Sec title="Statistical Significance Tests">
        <DataTable
          headers={['Test', 'ResNet-50 (B vs A)', 'EfficientNet-B3 (D vs C)']}
          rows={STAT_TESTS.map(d => [d.test, d.resnet, d.effnet])}
        />
        <ImageFigure
          src={process.env.PUBLIC_URL + '/results/21_statistical_tests.png'}
          caption="Statistical test results visualized. Left: ResNet-50 (B−A) — no significant difference. Right: EfficientNet-B3 (D−C) — significant across all tests. Bootstrap CI excludes zero for EfficientNet-B3."
          figNum="21"
        />
        <Note>
          EfficientNet-B3 results are statistically significant at α=0.05 across all tests after correction.
          ResNet-50 results are not significant (p≈0.4), consistent with the architecture × preprocessing interaction
          hypothesis. The Holm-Bonferroni correction accounts for multiple comparisons across 5 tests.
        </Note>
      </Sec>

      <Sec title="Mixed-Effects ANOVA Interpretation">
        <div style={{ fontSize: 12, lineHeight: 1.7, color: 'var(--color-text-primary,#333)' }}>
          <p style={{ margin: '0 0 10px 0' }}>
            A mixed-effects ANOVA was fitted with preprocessing (2 levels), architecture (2 levels), and their
            interaction as fixed effects, with fold as a random effect. Results:
          </p>
          <div style={{ background: 'var(--color-background-secondary,#f7f7f5)', borderRadius: 7, padding: '10px 14px', fontFamily: 'monospace', fontSize: 11, lineHeight: 1.8 }}>
            <div>Main effect (preprocessing): p=0.031 *</div>
            <div>Main effect (architecture): p=0.018 *</div>
            <div style={{ fontWeight: 700, color: C.teal }}>Interaction (preprocessing × architecture): p=0.02 *</div>
          </div>
          <p style={{ margin: '10px 0 0 0' }}>
            The significant interaction confirms that preprocessing benefit is not uniform across architectures.
            EfficientNet-B3's compound scaling (depth × width × resolution) creates a larger feature space that
            benefits more from normalized, high-contrast inputs produced by the V4 pipeline.
          </p>
        </div>
      </Sec>

      <Sec title="Training-Test Gap Analysis">
        <DataTable
          headers={['Config', 'Train F1', 'Test F1', 'Gap (pp)']}
          rows={TRAIN_TEST_GAP.map(d => [
            d.config, d.trainF1.toFixed(3), d.testF1.toFixed(3), `${d.gap.toFixed(1)}pp`,
          ])}
        />
        <Note>
          Training-test gaps of 5.8–7.3pp are consistent with the class imbalance and dataset difficulty.
          All configurations show similar gap magnitude, indicating no systematic overfitting difference
          between baseline and pipeline configurations. Patient-level CV prevents data leakage.
        </Note>
      </Sec>
    </div>
  );
}
