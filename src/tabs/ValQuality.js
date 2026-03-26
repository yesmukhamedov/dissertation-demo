import { C, IQ } from '../data';
import { Sec, ImageFigure } from '../components';

export default function ValQuality() {
  const colors = [C.coral, C.blue, C.amber, C.teal];

  return (
    <div>
      <Sec
        title="Image Quality — Before vs After V4 Pipeline"
        note="CNR (+81%): dramatically improved vessel/background contrast. VVI (+51%): enhanced vascular tree visibility. Entropy (+15%): richer local detail. SSIM (+18%): structural fidelity maintained during enhancement. These metrics quantify the visual improvements that drive downstream CNN performance gains."
      >
        {IQ.map((d, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 500, minWidth: 160 }}>{d.m}</span>
            <span style={{ fontSize: 10, color: C.gray, minWidth: 32, textAlign: 'right' }}>{d.b}</span>
            <span style={{ fontSize: 10, color: 'var(--color-text-secondary,#888)' }}>→</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: C.teal, minWidth: 36 }}>{d.a}</span>
            <div style={{ flex: 1, height: 8, background: 'var(--color-background-secondary,#eee)', borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
              <div style={{ position: 'absolute', width: `${(d.b / d.a) * 83}%`, height: '100%', background: C.gray, opacity: 0.3, borderRadius: 4 }} />
              <div style={{ width: '83%', height: '100%', background: colors[i], borderRadius: 4, opacity: 0.6 }} />
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, color: C.coral, minWidth: 45 }}>{d.pct}</span>
          </div>
        ))}

        <ImageFigure
          src={process.env.PUBLIC_URL + '/results/16_image_quality.png'}
          caption="Image quality metrics before (baseline) and after (V4 pipeline) preprocessing. CNR and VVI show the largest improvements, directly linked to CLAHE contrast enhancement and flat-field correction."
          figNum="16"
        />
      </Sec>

      <Sec title="Metric Definitions">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[
            { name: 'CNR (Contrast-to-Noise Ratio)', def: 'Mean intensity difference between vessel and background regions, normalized by background noise standard deviation. Measures vessel detectability.' },
            { name: 'VVI (Vessel Visibility Index)', def: 'Ratio of detectable vessel length to total vessel length in a reference segmentation. Measures completeness of visible vasculature.' },
            { name: 'Image Entropy (bits)', def: 'Shannon entropy of the pixel intensity histogram. Higher entropy indicates richer local detail and less compression artifacts.' },
            { name: 'SSIM (Structural Similarity Index)', def: 'Measures structural similarity between preprocessed image and a reference. SSIM ≤ 1.0; higher is better. Confirms preprocessing preserves anatomical structures.' },
          ].map((m, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 12px', background: 'var(--color-background-secondary,#f7f7f5)', borderRadius: 6 }}>
              <div style={{ minWidth: 200, fontWeight: 600, fontSize: 11, color: colors[i] }}>{m.name}</div>
              <div style={{ fontSize: 11, color: 'var(--color-text-primary,#333)', lineHeight: 1.5 }}>{m.def}</div>
            </div>
          ))}
        </div>
      </Sec>
    </div>
  );
}
