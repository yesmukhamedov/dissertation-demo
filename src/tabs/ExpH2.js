import { C, ABL, ABL_INDIV, CLAHE1, CLAHE2 } from '../data';
import { Sec, DataTable, Hbar, Note, ImageFigure } from '../components';

export default function ExpH2() {
  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 4px 0', color: 'var(--color-text-primary,#222)' }}>
          H-2: CLAHE Sensitivity Hypothesis
        </h2>
        <div style={{ fontSize: 12, color: 'var(--color-text-secondary,#666)' }}>
          Experiment 2 — Ablation study + CLAHE parameter sweep on IDRiD
        </div>
      </div>

      <Sec title="Cumulative Ablation — V4 Pipeline Stages">
        <Hbar
          items={ABL.map((d, i) => ({ label: d.n, v: d.f1, color: i === 0 ? C.gray : i === ABL.length - 1 ? C.teal : C.blue }))}
          maxV={0.82}
        />
        <ImageFigure src={process.env.PUBLIC_URL + '/results/04_exp2_ablation.png'} caption="Cumulative ablation: each row adds one pipeline stage. Starting from baseline (F1=0.727), each component adds incremental improvement, reaching F1=0.780 at full V4." figNum="4" />
        <DataTable
          headers={['Pipeline State', 'F1', 'AUC', 'ΔF1 vs Prev']}
          rows={ABL.map((d, i) => [
            d.n,
            d.f1.toFixed(3),
            d.auc.toFixed(3),
            i === 0 ? '—' : `+${((d.f1 - ABL[i - 1].f1) * 100).toFixed(1)}pp`,
          ])}
          highlightRow={(row, i) => i === ABL.length - 1}
        />
        <Note>
          CLAHE (Stage 3) is the largest single-stage contributor (+1.4pp). Consistent with literature:
          contrast enhancement is critical for DR feature visibility in fundus images.
          Flat-field (Stage 2) and canonical orientation (Stages 0a/0b) each contribute ~1.0pp cumulatively.
          Augmentation shows diminishing returns (+0.6pp) as earlier stages already normalize variability.
        </Note>
      </Sec>

      <Sec title="Per-Stage Marginal Contribution (ΔF1)">
        <Hbar
          items={ABL.slice(1).map((d, i) => ({
            label: d.n,
            v: parseFloat(((d.f1 - ABL[i].f1) * 100).toFixed(2)),
            color: (d.f1 - ABL[i].f1) >= 0.012 ? C.teal : C.blue,
          }))}
          maxV={2.0}
        />
        <ImageFigure src={process.env.PUBLIC_URL + '/results/05_exp2_per_stage.png'} caption="Marginal F1 contribution of each pipeline stage. CLAHE contributes the most (+1.4pp), followed by flat-field correction (+1.0pp) and OD-fovea rotation (+1.0pp)." figNum="5" />
      </Sec>

      <Sec title="Individual Ablation — Single-Stage Contribution">
        <DataTable
          headers={['Stage', 'Individual ΔF1 (pp)']}
          rows={ABL_INDIV.map(d => [d.stage, `+${d.individual_f1.toFixed(1)}pp`])}
        />
        <ImageFigure src={process.env.PUBLIC_URL + '/results/23_exp2_individual_ablation.png'} caption="Individual ablation: each stage removed from full pipeline in isolation. Sum of individual contributions (5.5pp) slightly exceeds actual gain (5.3pp), consistent with synergistic interaction between stages." figNum="23" />
        <Note>
          Individual ablation (each stage removed from full pipeline) yields sum of 5.5pp individual contributions vs
          5.3pp actual. This small positive interaction confirms the stages are not fully independent — CLAHE benefits
          from the flat-field correction providing a cleaner input.
        </Note>
      </Sec>

      <Sec title="H-2: CLAHE Parameter Sensitivity Heatmap">
        <Note>
          Dual-constraint CLAHE parameters swept on IDRiD across clip_factor ∈ [1.0–4.0] and global_threshold ∈ [0.01–0.05].
          DR 1 optimum: (clip_factor=2.5, threshold=0.03). DR 2 optimum: (2.0, 0.03).
          Over-enhancement (clip_factor &gt; 3.0) degrades performance by amplifying noise. ★ marks optimal cell.
        </Note>
        {[['DR Grade 1 — F1', CLAHE1, C.coral], ['DR Grade 2 — F1', CLAHE2, C.teal]].map(([title, data, hi], ti) => {
          const flat = data.flat(), mx = Math.max(...flat);
          const mn = Math.min(...flat);
          return (
            <div key={ti} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 4 }}>{title}</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ borderCollapse: 'collapse', fontSize: 10 }}>
                  <thead>
                    <tr>
                      <td style={{ padding: 3, fontSize: 9, color: 'var(--color-text-secondary,#888)' }}>clip↓ / thresh→</td>
                      {[0.01, 0.02, 0.03, 0.04, 0.05].map(g => (
                        <th key={g} style={{ padding: '3px 8px', fontWeight: 400, color: 'var(--color-text-secondary,#888)' }}>{g}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((row, ri) => (
                      <tr key={ri}>
                        <td style={{ padding: '3px 8px', fontWeight: 400, color: 'var(--color-text-secondary,#888)', textAlign: 'right' }}>
                          {[1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0][ri]}
                        </td>
                        {row.map((v, ci) => {
                          const t = (v - mn) / (mx - mn);
                          const isMax = v === mx;
                          return (
                            <td key={ci} style={{
                              padding: '4px 8px', textAlign: 'center', fontWeight: isMax ? 700 : 400,
                              background: `rgba(${hi === C.coral ? '216,90,48' : '29,158,117'},${0.08 + t * 0.55})`,
                              color: t > 0.55 ? 'white' : 'inherit', borderRadius: 2,
                            }}>
                              {v.toFixed(2)}{isMax ? ' ★' : ''}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
        <ImageFigure src={process.env.PUBLIC_URL + '/results/13_exp2_clahe_sensitivity.png'} caption="CLAHE parameter sensitivity heatmap for DR grades 1 and 2. Optimal parameters identified at clip_factor=2.5 (DR 1) and 2.0 (DR 2) with global_threshold=0.03." figNum="13" />
      </Sec>
    </div>
  );
}
