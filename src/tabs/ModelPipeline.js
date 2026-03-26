import { useState } from 'react';
import { C, PIPE } from '../data';
import { Sec, Note, DataTable, ImageFigure, DiagramViewer } from '../components';

export default function ModelPipeline() {
  const [stg, setStg] = useState(0);

  return (
    <div>
      <Sec title="V4 Preprocessing Pipeline Diagram">
        <DiagramViewer
          src={process.env.PUBLIC_URL + '/diagrams/v4_preprocessing_pipeline_diagram.svg'}
          alt="V4 6-stage preprocessing pipeline"
          caption="V4 6-stage preprocessing pipeline flowchart. Five scientifically novel components (Stages 0a, 0b, 2, 3, 5) plus standard FOV crop/resize and ImageNet normalization."
        />
      </Sec>

      <Sec title="Stage-by-Stage Walkthrough">
        <div style={{ display: 'flex', gap: 3, marginBottom: 14 }}>
          {PIPE.map((s, i) => (
            <button key={i} onClick={() => setStg(i)} style={{
              flex: 1, height: 6, border: 'none', borderRadius: 3, cursor: 'pointer',
              background: i <= stg ? C.teal : 'var(--color-background-secondary,#e5e5e3)',
              opacity: i === stg ? 1 : 0.5,
            }} />
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <span style={{ background: stg === 0 ? C.grayBg : C.tealBg, color: stg === 0 ? C.grayT : C.tealT, padding: '3px 10px', borderRadius: 5, fontSize: 11, fontWeight: 600 }}>
            {stg === 0 ? 'INPUT' : `Stage ${stg}/${PIPE.length - 1}`}
          </span>
          <span style={{ fontSize: 14, fontWeight: 600 }}>{PIPE[stg].nm}</span>
        </div>

        <ImageFigure
          src={process.env.PUBLIC_URL + '/results/25_pipeline_stages_real.png'}
          caption="Real fundus images at each pipeline stage. Top row: left-eye canonical flip + rotation. Subsequent rows: FOV crop, flat-field, CLAHE, normalized output."
          figNum="25"
        />

        <div style={{ fontSize: 12, lineHeight: 1.65, marginBottom: 8 }}>{PIPE[stg].desc}</div>

        <details style={{ fontSize: 11, color: 'var(--color-text-secondary,#666)' }}>
          <summary style={{ cursor: 'pointer', fontWeight: 500 }}>Technical details</summary>
          <div style={{ padding: '6px 10px', background: 'var(--color-background-secondary,#f7f7f5)', borderRadius: 5, marginTop: 4, fontFamily: 'monospace', fontSize: 10, lineHeight: 1.5 }}>
            {PIPE[stg].detail}
          </div>
        </details>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14 }}>
          <button onClick={() => setStg(Math.max(0, stg - 1))} disabled={stg === 0} style={{ padding: '5px 14px', fontSize: 11, border: '1px solid var(--color-border-secondary,#ccc)', borderRadius: 5, background: 'transparent', cursor: stg === 0 ? 'default' : 'pointer', opacity: stg === 0 ? 0.3 : 1 }}>
            ← Previous
          </button>
          <button onClick={() => setStg(Math.min(PIPE.length - 1, stg + 1))} disabled={stg === PIPE.length - 1} style={{ padding: '5px 14px', fontSize: 11, border: 'none', borderRadius: 5, background: stg === PIPE.length - 1 ? 'transparent' : C.tealBg, color: C.tealT, fontWeight: 500, cursor: stg === PIPE.length - 1 ? 'default' : 'pointer', opacity: stg === PIPE.length - 1 ? 0.3 : 1 }}>
            Next →
          </button>
        </div>
      </Sec>

      <Sec title="Bilateral Fundus Pair Example">
        <ImageFigure
          src={process.env.PUBLIC_URL + '/results/26_bilateral_pair.png'}
          caption="Bilateral fundus pair (left/right eye) after canonical orientation normalization. Both images aligned to right-eye (OD) convention for consistent anatomical reference."
          figNum="26"
        />
      </Sec>

      <Sec title="Pipeline Configurations">
        <DataTable
          headers={['Configuration', 'Stages Active', 'Novel Components', 'Used In']}
          rows={[
            ['Baseline', 'Stage 1 + Stage 4', '0', 'Configs A, C (Exp 1 control)'],
            ['Full V4 pipeline', 'All stages (0a, 0b, 1, 2, 3, 4, 5)', '5', 'Configs B, D (Exp 1 treatment)'],
            ['V4 + binocular', 'All stages + bilateral fusion', '5 + fusion', 'Configs E, F (Exp 1 extension)'],
            ['CLAHE sweep', 'Stage 3 parameter grid', '1', 'Exp 2 (IDRiD subset)'],
          ]}
        />
        <Note>
          "5-component pipeline" refers to the five scientifically novel contributions: canonical flip (0a),
          OD-fovea rotation (0b), flat-field correction (2), dual-constraint CLAHE (3), stochastic augmentation (5).
          Stage 1 (FOV crop/resize) and Stage 4 (ImageNet normalization) are standard techniques included in both baseline and pipeline configurations.
        </Note>
      </Sec>
    </div>
  );
}
