// src/components.js — Reusable UI components for DR Dashboard
import { C } from './data';

export function Card({ label, value, delta, color, sub }) {
  const bg = C[color + 'Bg'] || C.grayBg;
  const tx = C[color + 'T'] || C.grayT;
  return (
    <div style={{ background: bg, borderRadius: 10, padding: '11px 14px', flex: 1, minWidth: 110 }}>
      <div style={{ fontSize: 10, color: tx, opacity: 0.75 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 600, color: tx, marginTop: 2 }}>{value}</div>
      {delta && (
        <div style={{ fontSize: 10, color: (delta.includes('✓') || delta.includes('+')) ? C.green : C.red, marginTop: 1 }}>
          {delta}
        </div>
      )}
      {sub && <div style={{ fontSize: 9, color: tx, opacity: 0.5, marginTop: 1 }}>{sub}</div>}
    </div>
  );
}

export function Note({ children }) {
  return (
    <div style={{
      fontSize: 11, color: 'var(--color-text-secondary,#666)',
      padding: '8px 12px', background: 'var(--color-background-secondary,#f7f7f5)',
      borderRadius: 7, marginTop: 8, lineHeight: 1.6,
    }}>
      {children}
    </div>
  );
}

export function Hbar({ items, maxV, height = 20 }) {
  const mx = maxV || Math.max(...items.map(i => i.v)) * 1.1;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {items.map((it, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontSize: 10, color: 'var(--color-text-secondary,#666)', minWidth: 150, textAlign: 'right', lineHeight: 1.2 }}>
            {it.label}
          </div>
          <div style={{ flex: 1, height, background: 'var(--color-background-secondary,#eeede9)', borderRadius: 3, position: 'relative', overflow: 'hidden' }}>
            <div style={{ width: `${(it.v / mx) * 100}%`, height: '100%', background: it.color || C.blue, borderRadius: 3, opacity: 0.8 }} />
            <span style={{ position: 'absolute', right: 5, top: '50%', transform: 'translateY(-50%)', fontSize: 9, fontWeight: 500 }}>
              {it.v.toFixed ? it.v.toFixed(3) : it.v}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

export function Paired({ items, c1 = C.gray, c2 = C.teal, l1 = 'Baseline', l2 = 'Pipeline' }) {
  const mx = Math.max(...items.flatMap(i => [i.v1, i.v2])) * 1.12;
  return (
    <div>
      <div style={{ display: 'flex', gap: 14, fontSize: 10, color: 'var(--color-text-secondary,#666)', marginBottom: 6 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: c1, display: 'inline-block' }} />{l1}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: c2, display: 'inline-block' }} />{l2}
        </span>
      </div>
      {items.map((it, i) => (
        <div key={i} style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 10, color: 'var(--color-text-secondary,#666)', marginBottom: 2 }}>{it.label}</div>
          {[{ v: it.v1, c: c1 }, { v: it.v2, c: c2 }].map((b, bi) => (
            <div key={bi} style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 1 }}>
              <div style={{ flex: 1, height: 16, background: 'var(--color-background-secondary,#eeede9)', borderRadius: 3, position: 'relative', overflow: 'hidden' }}>
                <div style={{ width: `${(b.v / mx) * 100}%`, height: '100%', background: b.c, borderRadius: 3, opacity: 0.8 }} />
                <span style={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)', fontSize: 9, fontWeight: 500 }}>
                  {b.v.toFixed(3)}
                </span>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function Sec({ title, note, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0, color: 'var(--color-text-primary,#333)' }}>{title}</h3>
      </div>
      {children}
      {note && <Note>{note}</Note>}
    </div>
  );
}

export function DataTable({ headers, rows, highlightRow }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--color-border-secondary,#ccc)' }}>
            {headers.map((h, i) => (
              <th key={i} style={{ padding: '5px 8px', textAlign: i === 0 ? 'left' : 'center', fontWeight: 600, color: 'var(--color-text-primary,#333)' }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{
              borderBottom: '1px solid var(--color-border-tertiary,#eee)',
              background: highlightRow && highlightRow(row, i) ? C.amberBg : 'transparent',
            }}>
              {row.map((cell, j) => (
                <td key={j} style={{
                  padding: '5px 8px',
                  textAlign: j === 0 ? 'left' : 'center',
                  fontWeight: j === 0 ? 500 : 400,
                  color: typeof cell === 'string' && cell.includes('✓') ? C.teal : 'inherit',
                }}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ImageFigure({ src, caption, figNum }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <img
        src={src}
        alt={caption || ''}
        style={{ width: '100%', borderRadius: 8, border: '1px solid var(--color-border-tertiary,#eee)', display: 'block' }}
      />
      {caption && (
        <div style={{ fontSize: 10, color: 'var(--color-text-secondary,#888)', marginTop: 4 }}>
          {figNum && <strong>Fig. {figNum}. </strong>}{caption}
        </div>
      )}
    </div>
  );
}

export function DiagramViewer({ src, alt, caption }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <img
        src={src}
        alt={alt || caption || ''}
        style={{ width: '100%', borderRadius: 8, border: '1px solid var(--color-border-tertiary,#eee)', display: 'block', background: '#fff' }}
      />
      {caption && (
        <div style={{ fontSize: 10, color: 'var(--color-text-secondary,#888)', marginTop: 4, textAlign: 'center' }}>
          {caption}
        </div>
      )}
    </div>
  );
}
