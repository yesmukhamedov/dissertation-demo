import { C, CONFIGS } from '../data';
import { Sec, DataTable, Hbar, Note, ImageFigure } from '../components';

export default function ResultsMain() {
  const all6 = ['A', 'B', 'C', 'D', 'E', 'F'];

  return (
    <div>
      <Sec title="All 6 Configurations — Summary">
        <DataTable
          headers={['Config', 'Preprocessing', 'CNN', 'W.F1 ± σ', 'ROC-AUC ± σ', 'κ ± σ', 'Acc']}
          rows={all6.map(k => {
            const v = CONFIGS[k];
            return [
              <span key={k} style={{ fontWeight: 700, color: (k === 'D' || k === 'F') ? C.teal : 'inherit' }}>{k}</span>,
              v.preprocessing, v.cnn,
              `${v.f1.toFixed(3)} ± ${v.f1s.toFixed(3)}`,
              `${v.auc.toFixed(3)} ± ${v.aucs.toFixed(3)}`,
              `${v.k.toFixed(3)} ± ${v.ks.toFixed(3)}`,
              v.acc.toFixed(3),
            ];
          })}
          highlightRow={(row, i) => i === 5}
        />
      </Sec>

      <Sec title="Weighted F1 — All 6 Configurations">
        <Hbar
          items={all6.map((k, i) => ({
            label: `${k}: ${CONFIGS[k].lbl}`,
            v: CONFIGS[k].f1,
            color: [C.gray, C.blue, C.gray, C.teal, C.blue, C.teal][i],
          }))}
          maxV={0.85}
        />
      </Sec>

      <Sec title="Summary Radar Chart">
        <ImageFigure
          src={process.env.PUBLIC_URL + '/results/11_summary_radar.png'}
          caption="Performance radar across all 6 configurations showing F1, AUC, κ, Accuracy, and robustness. Config F (binocular + EfficientNet-B3) leads overall; Config D is best single-image mode."
          figNum="11"
        />
      </Sec>

      <Sec title="EH-3 Dominance Check">
        <ImageFigure
          src={process.env.PUBLIC_URL + '/results/12_eh3_dominance.png'}
          caption="EH-3 preprocessing dominance: ΔF1 (pipeline − baseline) per architecture. EfficientNet-B3 exceeds the 5pp threshold (D−C = +5.3pp). ResNet-50 shows near-zero effect (B−A = −0.1pp), confirming architecture × preprocessing interaction."
          figNum="12"
        />
        <DataTable
          headers={['Criterion', 'ResNet-50 (B−A)', 'EfficientNet-B3 (D−C)', 'Threshold', 'Result']}
          rows={[
            ['ΔF1', `${((CONFIGS.B.f1 - CONFIGS.A.f1) * 100).toFixed(1)}pp`, `+${((CONFIGS.D.f1 - CONFIGS.C.f1) * 100).toFixed(1)}pp`, '≥ 5pp', '✓ (EfficientNet-B3)'],
            ['ΔAUC', `${((CONFIGS.B.auc - CONFIGS.A.auc) * 100).toFixed(1)}pp`, `+${((CONFIGS.D.auc - CONFIGS.C.auc) * 100).toFixed(1)}pp`, '≥ 2pp', '✓ (EfficientNet-B3)'],
            ['Δκ', `+${((CONFIGS.B.k - CONFIGS.A.k) * 100).toFixed(1)}pp`, `+${((CONFIGS.D.k - CONFIGS.C.k) * 100).toFixed(1)}pp`, '> 0', '✓ (both)'],
          ]}
        />
        <Note>
          The architecture × preprocessing interaction (mixed-effects ANOVA, p=0.02) is a primary finding.
          Preprocessing benefit scales with model capacity: compound-scaling architectures (EfficientNet-B3) exploit
          normalized inputs more effectively than shallow architectures (ResNet-50) that may exhibit ceiling effects.
        </Note>
      </Sec>
    </div>
  );
}
