import { C } from '../data';
import { Sec, DataTable, Note, DiagramViewer } from '../components';

export default function ModelArchitecture() {
  return (
    <div>
      <Sec title="System Architecture Diagram">
        <DiagramViewer
          src={process.env.PUBLIC_URL + '/diagrams/dr_diagnosis_system_architecture.svg'}
          alt="DR Diagnosis System Architecture"
          caption="Full system architecture: bilateral input → V4 5-component preprocessing pipeline → CNN backbone → feature fusion (binocular mode) → 5-class DR grading output."
        />
      </Sec>

      <Sec title="Formal Model Definition">
        <div style={{ background: 'var(--color-background-secondary,#f7f7f5)', borderRadius: 8, padding: '14px 16px', fontFamily: 'monospace', fontSize: 13, lineHeight: 2 }}>
          <div><strong>Image-level:</strong> ŷ = f(CNN(P(I)))</div>
          <div><strong>Binocular:</strong> ŷ = S(I<sub>L</sub>, I<sub>R</sub>) = g(Φ(CNN(P(I<sub>L</sub>)), CNN(P(I<sub>R</sub>))))</div>
        </div>
        <Note>
          P(·) — V4 5-component preprocessing pipeline. CNN — backbone (ResNet-50 or EfficientNet-B3).
          Φ — feature concatenation. g — classification head (FC + softmax). S — binocular scoring function.
          The pipeline P is an integral component of the model, not a data preparation step.
        </Note>
      </Sec>

      <Sec title="CNN Backbone Specifications">
        <DataTable
          headers={['Backbone', 'Parameters', 'Library', 'Pretrain', 'Used in']}
          rows={[
            ['ResNet-50', '25.6M', 'torchvision', 'ImageNet', 'Exp 1 (Configs A, B, E)'],
            ['EfficientNet-B3', '12.2M', 'timm', 'ImageNet', 'Exp 1 (Configs C, D, F)'],
            ['EfficientNet-B4', '19.3M', 'timm', 'ImageNet', 'Exp 4 (Grad-CAM/ALO only)'],
          ]}
        />
        <Note>
          All models trained with patient-level 5-fold cross-validation. Input: 512×512 RGB.
          Mixed precision disabled for EfficientNet models; batch size 16 (EfficientNet) / 32 (ResNet-50).
          Hardware: NVIDIA RTX 3060 12GB, WSL2 Ubuntu, PyTorch 2.5.
        </Note>
      </Sec>

      <Sec title="Operating Modes">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { mode: 'Image-level', desc: 'Single fundus image → 5-class DR grade. Standard mode for Exp 1–3.', color: C.blue },
            { mode: 'Patient-level (binocular)', desc: 'Left + right eye images processed jointly. Feature concatenation before classification head. Configs E and F.', color: C.teal },
            { mode: 'Explainability', desc: 'EfficientNet-B4 + Grad-CAM overlay. ALO/IoU metrics computed against IDRiD lesion masks. Exp 4 only.', color: C.purple },
          ].map((m, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 12px', background: 'var(--color-background-secondary,#f7f7f5)', borderRadius: 7 }}>
              <div style={{ minWidth: 130, fontWeight: 600, fontSize: 12, color: m.color }}>{m.mode}</div>
              <div style={{ fontSize: 12, color: 'var(--color-text-primary,#333)', lineHeight: 1.5 }}>{m.desc}</div>
            </div>
          ))}
        </div>
      </Sec>
    </div>
  );
}
