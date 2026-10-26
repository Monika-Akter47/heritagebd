// Builds the test catalogue and Requirements Traceability Matrix from the tests themselves:
// every test carries a tag line "TC-ID | FR-xx[, FR-yy] | Level | Technique | Priority | +/−", and each
// result comes from the JUnit files in docs/testing/evidence. Nothing is typed in by hand.
//   node tests/support/rtm.mjs   →  docs/testing/evidence/test-catalogue.json, rtm.csv
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = join(import.meta.dirname, '..', '..');
const evidence = join(root, 'docs', 'testing', 'evidence');
const TAG = /(TC-[A-Z]?\d+|E2E-\d+)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*(P\d)\s*\|\s*([+−±-])/;

function files(dir, ext) {
  const out = [];
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, name.name);
    if (name.isDirectory()) out.push(...files(p, ext));
    else if (ext.some(e => name.name.endsWith(e))) out.push(p);
  }
  return out;
}

// 1. Catalogue from source tags. The test name follows the tag (PHP method or JS test title).
const catalogue = [];
for (const file of [...files(join(root, 'tests', 'unit'), ['.php']), ...files(join(root, 'tests', 'integration'), ['.php']),
                    ...files(join(root, 'tests', 'frontend'), ['.tsx', '.ts']), ...files(join(root, 'tests', 'e2e'), ['.ts'])]) {
  const lines = readFileSync(file, 'utf8').split(/\r?\n/);
  lines.forEach((line, i) => {
    const m = line.match(TAG);
    if (!m) return;
    const next = lines.slice(i + 1, i + 6).join(' ');
    const name = next.match(/function\s+(test_\w+)/)?.[1] ?? next.match(/(?:it|test)(?:\.each\([\s\S]*?\))?\(\s*['"`]([^'"`]+)/)?.[1] ?? '';
    const title = name.replace(/^test_(TC_[A-Z]?\d+|E2E_\d+)_/, '').replace(/^(TC-F\d+|E2E-\d+)\s*/, '').replaceAll('_', ' ').replace(/\s*%s.*$/, '').trim();
    catalogue.push({
      id: m[1], requirements: m[2].split(/\s*,\s*/), level: m[3], technique: m[4], priority: m[5],
      polarity: m[6] === '+' ? '+' : m[6] === '±' ? '±' : '−', title, name, file: relative(root, file).replaceAll('\\', '/'),
      source: 'Own', results: [],
    });
  });
}

// 2. Results from JUnit (data-provider rows and E2E projects become several results per test case).
const junit = ['junit-php.xml', 'junit-frontend.xml', 'junit-e2e.xml'].map(f => join(evidence, f)).filter(existsSync);
for (const f of junit) {
  const xml = readFileSync(f, 'utf8');
  for (const m of xml.matchAll(/<testcase\b([^>]*?)(\/>|>([\s\S]*?)<\/testcase>)/g)) {
    const attrs = Object.fromEntries([...m[1].matchAll(/(\w+)="([^"]*)"/g)].map(a => [a[1], a[2]]));
    const body = m[3] ?? '';
    const status = /<(failure|error)\b/.test(body) ? 'Fail' : /<skipped\b/.test(body) ? 'Skipped' : 'Pass';
    const label = `${attrs.classname ?? ''} ${attrs.name ?? ''}`;
    const id = label.match(/(TC_[A-Z]?\d+|TC-F\d+|E2E-\d+)(?![0-9])/)?.[1]?.replace(/^TC_/, 'TC-');
    const tc = catalogue.find(t => t.id === id);
    if (tc) tc.results.push({ status, case: attrs.name, file: f.split(/[\\/]/).pop() });
  }
}
for (const tc of catalogue) {
  tc.executions = tc.results.length;
  tc.result = !tc.results.length ? 'Not run' : tc.results.some(r => r.status === 'Fail') ? 'Fail' : 'Pass';
  tc.automated = 'Y';
}

// 3. Requirements → test cases.
const rtm = {};
for (const tc of catalogue) for (const req of tc.requirements) (rtm[req] ??= []).push(tc.id);

writeFileSync(join(evidence, 'test-catalogue.json'), JSON.stringify({ generatedAt: new Date().toISOString(), catalogue, rtm }, null, 2));
writeFileSync(join(evidence, 'rtm.csv'), 'Requirement,Test cases\n' + Object.entries(rtm)
  .sort(([a], [b]) => a.localeCompare(b, 'en', { numeric: true })).map(([r, ids]) => `${r},"${ids.join(' ')}"`).join('\n') + '\n');
const byResult = catalogue.reduce((a, t) => ({ ...a, [t.result]: (a[t.result] ?? 0) + 1 }), {});
console.log(`${catalogue.length} test cases, ${catalogue.reduce((n, t) => n + t.executions, 0)} executions`, byResult);
console.log(`${Object.keys(rtm).filter(r => r.startsWith('FR-')).length} FRs traced`);
