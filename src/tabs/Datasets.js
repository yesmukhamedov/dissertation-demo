import { DATASETS } from '../data';
import { Sec, DataTable, Note } from '../components';

export default function Datasets() {
  return (
    <div>
      <Sec title="Datasets Used in This Study">
        <DataTable
          headers={['Dataset', 'Camera', 'Size', 'DR Grades', 'Role', 'Source']}
          rows={DATASETS.map(d => [d.name, d.camera, d.size, d.grades, d.role, d.source])}
          highlightRow={(row, i) => i === 0}
        />
        <Note>
          EyePACS is the primary training and validation dataset. All other datasets are used for transfer learning
          evaluation (Exp 5), lesion-level explainability (Exp 4), or device robustness testing (Exp 6) — none
          are used for training. Highlighted row = primary dataset.
        </Note>
      </Sec>

      <Sec title="Experiment 1 — EyePACS Subset">
        <div style={{ fontSize: 12, lineHeight: 1.7, color: 'var(--color-text-primary,#333)' }}>
          <p style={{ margin: '0 0 8px 0' }}>
            Exp 1 uses a 40% stratified random sample of EyePACS: <strong>~14,050 images</strong> across 5 DR grades.
            Full EyePACS contains ~35,126 labeled images from community screening events (USA, 2013–2015).
          </p>
          <p style={{ margin: '0 0 8px 0' }}>
            Class distribution in subset (approximate): DR 0 — 52%, DR 1 — 3.5%, DR 2 — 20%, DR 3 — 2.8%, DR 4 — 1.9%.
            Severe class imbalance is addressed by class-weighted cross-entropy loss.
          </p>
        </div>
      </Sec>

      <Sec title="Cross-Validation Methodology">
        <div style={{ fontSize: 12, lineHeight: 1.7, color: 'var(--color-text-primary,#333)' }}>
          <p style={{ margin: '0 0 8px 0' }}>
            <strong>Patient-level 5-fold cross-validation</strong> is used throughout. Both eyes of the same patient
            are always assigned to the same fold, preventing data leakage through bilateral correlation.
          </p>
          <p style={{ margin: 0 }}>
            For external datasets (IDRiD, Messidor-2), models trained on EyePACS are evaluated in a zero-shot
            transfer setting — no retraining or fine-tuning on target datasets.
          </p>
        </div>
        <Note>
          IDRiD provides pixel-level lesion segmentation masks for 4 lesion types. These masks are used exclusively
          for ALO/IoU computation in Exp 4 — not for training or supervision.
        </Note>
      </Sec>
    </div>
  );
}
