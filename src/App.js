import { useState } from 'react';
import { C } from './data';
import Overview from './tabs/Overview';
import ModelArchitecture from './tabs/ModelArchitecture';
import ModelPipeline from './tabs/ModelPipeline';
import ModelExplainability from './tabs/ModelExplainability';
import Datasets from './tabs/Datasets';
import ExpH1 from './tabs/ExpH1';
import ExpH2 from './tabs/ExpH2';
import ExpH4 from './tabs/ExpH4';
import ExpH5 from './tabs/ExpH5';
import ExpH6 from './tabs/ExpH6';
import ResultsMain from './tabs/ResultsMain';
import ResultsBestConfig from './tabs/ResultsBestConfig';
import ResultsStatistical from './tabs/ResultsStatistical';
import ValClinical from './tabs/ValClinical';
import ValQuality from './tabs/ValQuality';
import ValComputational from './tabs/ValComputational';

const NAV = [
  { id: 'overview', label: 'Overview' },
  { type: 'group', label: 'Model' },
  { id: 'arch', label: 'Architecture', indent: true },
  { id: 'pipeline', label: 'Pipeline', indent: true },
  { id: 'explainability', label: 'Explainability', indent: true },
  { type: 'group', label: 'Datasets' },
  { id: 'datasets', label: 'Datasets' },
  { type: 'group', label: 'Experiments' },
  { id: 'exph1', label: 'H-1: Preprocessing', indent: true },
  { id: 'exph2', label: 'H-2: CLAHE', indent: true },
  { id: 'exph4', label: 'H-4: Transfer', indent: true },
  { id: 'exph5', label: 'H-5: Explainability', indent: true },
  { id: 'exph6', label: 'H-6: Robustness', indent: true },
  { type: 'group', label: 'Results' },
  { id: 'results-main', label: 'Main Metrics', indent: true },
  { id: 'results-best', label: 'Best Config (D)', indent: true },
  { id: 'results-stat', label: 'Statistical Tests', indent: true },
  { type: 'group', label: 'Validation' },
  { id: 'val-clinical', label: 'Clinical', indent: true },
  { id: 'val-quality', label: 'Image Quality', indent: true },
  { id: 'val-compute', label: 'Computational', indent: true },
];

const COMPONENTS = {
  overview: Overview,
  arch: ModelArchitecture,
  pipeline: ModelPipeline,
  explainability: ModelExplainability,
  datasets: Datasets,
  exph1: ExpH1,
  exph2: ExpH2,
  exph4: ExpH4,
  exph5: ExpH5,
  exph6: ExpH6,
  'results-main': ResultsMain,
  'results-best': ResultsBestConfig,
  'results-stat': ResultsStatistical,
  'val-clinical': ValClinical,
  'val-quality': ValQuality,
  'val-compute': ValComputational,
};

export default function App() {
  const [tab, setTab] = useState('overview');
  const TabComponent = COMPONENTS[tab] || Overview;

  return (
    <div style={{ display: 'flex', fontFamily: 'system-ui,-apple-system,sans-serif', minHeight: '100vh', background: 'var(--color-background-primary,#fff)' }}>
      {/* Sidebar */}
      <nav style={{ width: 192, minWidth: 192, background: 'var(--color-background-secondary,#f7f7f5)', borderRight: '1px solid var(--color-border-tertiary,#e5e5e3)', padding: '16px 0', overflowY: 'auto', position: 'sticky', top: 0, height: '100vh' }}>
        <div style={{ padding: '0 12px 14px 12px', borderBottom: '1px solid var(--color-border-tertiary,#e5e5e3)', marginBottom: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.teal, letterSpacing: '0.03em' }}>DR DASHBOARD</div>
          <div style={{ fontSize: 9, color: 'var(--color-text-secondary,#999)', marginTop: 2 }}>PhD Dissertation Defense</div>
        </div>
        {NAV.map((item, i) => {
          if (item.type === 'group') {
            return (
              <div key={i} style={{ padding: '8px 12px 3px 12px', fontSize: 9, fontWeight: 700, color: 'var(--color-text-secondary,#999)', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 4 }}>
                {item.label}
              </div>
            );
          }
          const isActive = tab === item.id;
          return (
            <button key={item.id} onClick={() => setTab(item.id)} style={{
              display: 'block', width: '100%', textAlign: 'left',
              padding: `5px ${item.indent ? '12px' : '12px'} 5px ${item.indent ? '20px' : '12px'}`,
              fontSize: 11, fontWeight: isActive ? 600 : 400,
              color: isActive ? C.tealT : 'var(--color-text-primary,#444)',
              background: isActive ? C.tealBg : 'transparent',
              border: 'none', borderLeft: isActive ? `3px solid ${C.teal}` : '3px solid transparent',
              cursor: 'pointer', lineHeight: 1.4,
            }}>
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Main content */}
      <main style={{ flex: 1, padding: '24px 28px', maxWidth: 750, overflowY: 'auto' }}>
        <TabComponent />
      </main>
    </div>
  );
}
