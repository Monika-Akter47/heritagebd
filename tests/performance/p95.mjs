// p95 response time of key read endpoints (Guideline §3, Baseline: "p95 measured for 3 key endpoints").
//   node tests/performance/p95.mjs [baseUrl] [requestsPerEndpoint] [concurrency]
// Defaults to the deployed site with a gentle load (60 requests, 5 concurrent) so it is safe to run
// against the free-tier production API. A warm-up request is sent first, so the Render cold start
// (up to ~50 s after idle) is reported separately and not counted.
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const base = (process.argv[2] || 'https://heritagebd-flax.vercel.app').replace(/\/+$/, '');
const total = Number(process.argv[3] || 60);
const concurrency = Number(process.argv[4] || 5);
const endpoints = ['/api/places', '/api/products?limit=50', '/api/guides', '/api/places/p1', '/api/events?upcoming=1'];

const pct = (sorted, p) => sorted[Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)];

async function timed(url) {
  const t = performance.now();
  try { const r = await fetch(url); await r.arrayBuffer(); return { ms: performance.now() - t, ok: r.ok }; }
  catch { return { ms: performance.now() - t, ok: false }; }
}

const results = [];
const warm = await timed(base + '/api/health');
console.log(`Target ${base} · ${total} requests/endpoint · ${concurrency} concurrent · warm-up ${warm.ms.toFixed(0)} ms\n`);
for (const path of endpoints) {
  const samples = [];
  let next = 0;
  await Promise.all(Array.from({ length: concurrency }, async () => {
    while (next < total) { next++; samples.push(await timed(base + path)); }
  }));
  const ms = samples.map(s => s.ms).sort((a, b) => a - b);
  const row = { endpoint: path, requests: samples.length, errors: samples.filter(s => !s.ok).length,
    p50: Math.round(pct(ms, 50)), p95: Math.round(pct(ms, 95)), max: Math.round(ms.at(-1)) };
  results.push(row);
  console.log(`${path.padEnd(26)} p50 ${String(row.p50).padStart(5)} ms   p95 ${String(row.p95).padStart(5)} ms   max ${String(row.max).padStart(5)} ms   errors ${row.errors}/${row.requests}`);
}

const out = join(import.meta.dirname, '..', '..', 'docs', 'testing', 'evidence');
mkdirSync(out, { recursive: true });
writeFileSync(join(out, 'performance-p95.json'), JSON.stringify({ base, total, concurrency, warmupMs: Math.round(warm.ms), at: new Date().toISOString(), results }, null, 2));
