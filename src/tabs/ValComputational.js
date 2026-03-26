import { COMPUTE } from '../data';
import { Sec, DataTable, Note, ImageFigure } from '../components';

export default function ValComputational() {
  return (
    <div>
      <Sec title="Computational Efficiency">
        <DataTable
          headers={['Metric', 'ResNet-50', 'EfficientNet-B3', 'Unit']}
          rows={COMPUTE.map(d => [d.metric, d.resnet, d.effnet, d.unit])}
        />
        <ImageFigure
          src={process.env.PUBLIC_URL + '/results/17_computational.png'}
          caption="Computational cost comparison: training time, inference latency, and GPU memory for ResNet-50 and EfficientNet-B3. Pipeline adds ~27ms preprocessing overhead per image — acceptable for screening throughput."
          figNum="17"
        />
        <Note>
          EfficientNet-B3 has fewer parameters (12.2M vs 25.6M) but longer training time per epoch (12.3 vs 8.5 min)
          due to compound scaling operations. Pipeline preprocessing adds a fixed ~27ms overhead regardless of backbone,
          bringing total inference to 45–52ms/image — within acceptable range for non-real-time screening workflows
          (target: ≤100ms/image at 512×512 resolution).
        </Note>
      </Sec>

      <Sec title="Hardware Configuration">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[
            { label: 'GPU', value: 'NVIDIA RTX 3060 12GB VRAM' },
            { label: 'OS', value: 'WSL2 Ubuntu 22.04 on Windows 11' },
            { label: 'Framework', value: 'PyTorch 2.5, CUDA 12.x' },
            { label: 'Python', value: '3.10, Conda environment' },
            { label: 'Input resolution', value: '512×512 RGB' },
            { label: 'Mixed precision', value: 'Disabled (stability requirement for EfficientNet)' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, padding: '6px 12px', background: 'var(--color-background-secondary,#f7f7f5)', borderRadius: 5 }}>
              <div style={{ minWidth: 140, fontWeight: 600, fontSize: 11 }}>{item.label}</div>
              <div style={{ fontSize: 11, color: 'var(--color-text-primary,#333)' }}>{item.value}</div>
            </div>
          ))}
        </div>
      </Sec>

      <Sec title="Preprocessing Pipeline Throughput">
        <Note>
          V4 pipeline processes one 3888×2592 fundus image in ~27ms (RTX 3060, batch mode).
          Sequential stages: canonical flip (1ms), OD-fovea detection/rotation (12ms), FOV crop + resize (5ms),
          flat-field Gaussian filter (4ms), CLAHE (3ms), normalization (2ms).
          The OD-fovea rotation step (Stage 0b) dominates preprocessing time due to optic disc detection.
        </Note>
      </Sec>
    </div>
  );
}
