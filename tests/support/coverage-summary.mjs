// Per-layer and per-file line coverage of the API from docs/testing/evidence/coverage-clover.xml.
// Writes docs/testing/evidence/coverage-summary.json (used by the test report).
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const evidence = join(import.meta.dirname, '..', '..', 'docs', 'testing', 'evidence');
const xml = readFileSync(join(evidence, 'coverage-clover.xml'), 'utf8');

const files = [];
for (const m of xml.matchAll(/<file name="([^"]+)">([\s\S]*?)<\/file>/g)) {
  const metrics = m[2].match(/<metrics ([^/]*)\/>\s*$/)?.[1] ?? '';
  const attr = name => Number(metrics.match(new RegExp(`\\b${name}="(\\d+)"`))?.[1] ?? 0);
  const path = m[1].split(/[\\/]backend[\\/]/).pop().replaceAll('\\', '/');
  files.push({ path, lines: attr('statements'), covered: attr('coveredstatements'), methods: attr('methods'), coveredMethods: attr('coveredmethods') });
}

const layerOf = p => p.startsWith('helpers/') ? 'Business logic / helpers'
  : p.startsWith('controllers/') ? 'Controllers / API'
  : p.startsWith('config/') ? 'Data access / config' : 'Router (index.php)';
const layers = {};
for (const f of files) {
  const l = (layers[layerOf(f.path)] ??= { lines: 0, covered: 0, methods: 0, coveredMethods: 0 });
  for (const k of ['lines', 'covered', 'methods', 'coveredMethods']) l[k] += f[k];
}
const pct = (a, b) => (b ? Math.round((1000 * a) / b) / 10 : null);
const total = Object.values(layers).reduce((t, l) => ({ lines: t.lines + l.lines, covered: t.covered + l.covered,
  methods: t.methods + l.methods, coveredMethods: t.coveredMethods + l.coveredMethods }), { lines: 0, covered: 0, methods: 0, coveredMethods: 0 });

const summary = {
  layers: Object.entries(layers).map(([name, l]) => ({ name, ...l, linePct: pct(l.covered, l.lines), functionPct: pct(l.coveredMethods, l.methods) })),
  overall: { ...total, linePct: pct(total.covered, total.lines), functionPct: pct(total.coveredMethods, total.methods) },
  files: files.map(f => ({ ...f, linePct: pct(f.covered, f.lines) })).sort((a, b) => a.linePct - b.linePct),
};
writeFileSync(join(evidence, 'coverage-summary.json'), JSON.stringify(summary, null, 2));
for (const l of summary.layers) console.log(`${l.name.padEnd(26)} lines ${String(l.linePct).padStart(5)}% (${l.covered}/${l.lines})  functions ${l.functionPct ?? '-'}%`);
console.log(`${'Overall'.padEnd(26)} lines ${summary.overall.linePct}% (${total.covered}/${total.lines})  functions ${summary.overall.functionPct}%\n`);
for (const f of summary.files) console.log(`${String(f.linePct).padStart(6)}%  ${String(`${f.covered}/${f.lines}`).padStart(9)}  ${f.path}`);
