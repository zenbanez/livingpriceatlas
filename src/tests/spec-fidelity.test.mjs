import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..', '..');

const SPECS = [
  {
    id: 'LPA001',
    file: 'LPA001-v1.0.md',
    bytes: 28920,
    sha256: 'a4cc1124dba29a55f9cf04c8e496d88852388a4a60987c1502333c625411ed0a',
    headerSubtitle: '## Foundational Principles and Epistemic Framework',
    bodyH2Count: 21,
    invariantCount: 12,
    colophon: '*End of LPA001*',
  },
  {
    id: 'LPA002',
    file: 'LPA002-v1.0.md',
    bytes: 45707,
    sha256: '4214f463917b7297da20b058cbf4b11ae38c12f46d000a060fbd0927c33e90f3',
    headerSubtitle: '## Domain Architecture and Foundational Inheritance',
    bodyH2Count: 27,
    invariantCount: 12,
    colophon: '*End of LPA002*',
  },
  {
    id: 'LPA003',
    file: 'LPA003-v1.0.md',
    bytes: 56218,
    sha256: '42535796e33e184f5c3007c716a4c55737da5f799c35b7413783a8da49e8f2ba',
    headerSubtitle: '## The Contextual Cost Model',
    bodyH2Count: 32,
    invariantCount: 16,
    colophon: '*End of LPA003*',
  },
  {
    id: 'LPA004',
    file: 'LPA004-v1.0.md',
    bytes: 65839,
    sha256: 'af431791af9c1f5ca55bdfdfcb2f1fb1451c10c504388f07c456db39825953ff',
    headerSubtitle: '## Contribution and Participation Protocol',
    bodyH2Count: 35,
    invariantCount: 16,
    colophon: '*End of LPA004*',
  },
];

const FIGURES = [
  {
    file: 'LPA003-fig-01-economic-triangulation.png',
    bytes: 80207,
    sha256: 'b9634546b56edd6f773ffa53ac17911a5ff457afd9e4b91121b4708968ace313',
  },
  {
    file: 'LPA003-fig-02-contextual-cost-model.jpg',
    bytes: 60649,
    sha256: 'd56ee47200bfdca0aaad5b9b9f91d034b9cc9db92052db626e03924b39fef959',
  },
  {
    file: 'LPA004-fig-01-reciprocal-ecosystem.png',
    bytes: 95641,
    sha256: '2f4d4f5c69fc9c98e323ae9d769dda8434f25f9f43b8cf47da2e7e19692acdcd',
  },
  {
    file: 'LPA004-fig-02-anticipatory-demand-readiness.png',
    bytes: 69955,
    sha256: 'a8c436fc687c506283ac7bc33f060acce118af8f833a26dbed0e9a64df01a0a1',
  },
  {
    file: 'LPA004-fig-03-participation-flywheel.png',
    bytes: 67963,
    sha256: '683171b96ed0649833eec49d12fbd35ddf59e591851b4bfda10034c594f31aa5',
  },
];

function readUtf8(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf8');
}

function readBytes(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath));
}

// 1 & 2. Byte-exactness and structural fidelity across LPA001-LPA004
let totalInvariants = 0;
for (const spec of SPECS) {
  for (const prefix of ['public', 'src/corpus']) {
    const relPath = `${prefix}/${spec.file}`;
    const bytes = readBytes(relPath);
    assert.equal(bytes.length, spec.bytes, `${relPath} must be ${spec.bytes} bytes`);
    assert.equal(bytes.includes(0x0d), false, `${relPath} must use LF line endings`);
    const sha = crypto.createHash('sha256').update(bytes).digest('hex');
    assert.equal(sha, spec.sha256, `${relPath} SHA-256 mismatch`);
  }

  const text = readUtf8(`src/corpus/${spec.file}`);
  const lines = text.split('\n');
  const h2Body = lines.filter((line) => line.startsWith('## ') && line !== spec.headerSubtitle);
  assert.equal(
    h2Body.length,
    spec.bodyH2Count,
    `${spec.id} must have ${spec.bodyH2Count} body sections (got ${h2Body.length})`
  );

  const invariantLines = lines.filter((line) =>
    /^\*\*[IVX]+\.\*\*\s+|^\*\*[IVX]+\.\s+.+\*\*$/.test(line.trim())
  );
  assert.equal(
    invariantLines.length,
    spec.invariantCount,
    `${spec.id} must have ${spec.invariantCount} Roman-numeral invariants`
  );
  totalInvariants += invariantLines.length;
  assert.ok(lines.includes(spec.colophon), `${spec.id} closing colophon ${spec.colophon} missing`);
}
assert.equal(totalInvariants, 56, 'Cumulative invariant count across LPA001-LPA004 must be 56');

// Check LPA001 §5.3 Epistemic Properties intact
const lpa001 = readUtf8('src/corpus/LPA001-v1.0.md');
for (const prop of [
  'Observed',
  'Declared',
  'Corroborated',
  'Derived',
  'Inferred',
  'Disputed',
  'Stale',
  'Superseded',
]) {
  assert.ok(lpa001.includes(`| ${prop} |`), `LPA001 §5.3 property ${prop} missing`);
}

// 3. Exact binary fidelity of all 5 architectural figures
for (const fig of FIGURES) {
  const bytes = readBytes(`public/figures/${fig.file}`);
  assert.equal(bytes.length, fig.bytes, `${fig.file} must be ${fig.bytes} bytes`);
  const sha = crypto.createHash('sha256').update(bytes).digest('hex');
  assert.equal(sha, fig.sha256, `${fig.file} SHA-256 mismatch`);
}

// 4. CSP origins in index.html for Pulse widget + 1-click Google Sign-In
const indexHtml = readUtf8('index.html');
for (const origin of [
  'https://cdn.pulsemessages.com',
  'https://apis.google.com',
  'https://accounts.google.com',
  'https://*.firebaseapp.com',
  'https://*.googleusercontent.com',
]) {
  assert.ok(indexHtml.includes(origin), `index.html CSP must include ${origin}`);
}

// 5. Hallmark CSS craft floor checks
const stylesCss = readUtf8('src/styles.css');
assert.ok(stylesCss.includes('overflow-x: clip;'), 'styles.css must enforce overflow-x: clip');
assert.ok(stylesCss.includes(':focus-visible'), 'styles.css must include :focus-visible styling');
assert.ok(
  stylesCss.includes('prefers-reduced-motion: reduce'),
  'styles.css must support prefers-reduced-motion: reduce'
);
assert.ok(stylesCss.includes('oklch('), 'styles.css must use OKLCH design tokens');
assert.equal(/transition\s*:\s*all/i.test(stylesCss), false, 'styles.css must never use transition: all');

// 6. Zero UI-chrome em-dashes or glued arrows in HTML/TSX/catalog
const appTsx = readUtf8('src/App.tsx');
const catalogTs = readUtf8('src/lib/specsCatalog.ts');
for (const [label, src] of [
  ['index.html', indexHtml],
  ['src/App.tsx', appTsx],
  ['src/lib/specsCatalog.ts', catalogTs],
]) {
  assert.equal(src.includes('—'), false, `${label} must not contain UI-chrome em-dashes`);
  assert.equal(src.includes('→'), false, `${label} must not contain glued arrow glyphs`);
}

// 7. Secret hygiene: no tracked .env files
const envExample = readUtf8('.env.example');
assert.match(envExample, /^VITE_PULSE_CLIENT_ID=\s*$/m, '.env.example must keep empty placeholder');
const trackedEnv = execFileSync('git', ['ls-files', '.env', '.env.local', '.env.production.local'], {
  cwd: ROOT,
  encoding: 'utf8',
}).trim();
assert.equal(trackedEnv, '', 'Local .env files must never be tracked in Git');

console.log(
  'ALL SPEC-FIDELITY & HALLMARK FLOOR CHECKS PASSED (4 specs, 5 figures, 56 invariants verified)'
);
