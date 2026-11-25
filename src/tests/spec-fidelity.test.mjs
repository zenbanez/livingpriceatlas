import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..', '..');

const CANONICAL_SHA256 = 'a4cc1124dba29a55f9cf04c8e496d88852388a4a60987c1502333c625411ed0a';
const CANONICAL_BYTES = 28920;

function readUtf8(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf8');
}

function readBytes(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath));
}

// 1. Byte-exactness of both LPA001 v1.0 Markdown files
for (const relPath of ['public/LPA001-v1.0.md', 'src/corpus/LPA001-v1.0.md']) {
  const bytes = readBytes(relPath);
  assert.equal(bytes.length, CANONICAL_BYTES, `${relPath} must be exactly ${CANONICAL_BYTES} bytes`);
  assert.equal(bytes.includes(0x0d), false, `${relPath} must use LF line endings without CR bytes`);
  const sha = crypto.createHash('sha256').update(bytes).digest('hex');
  assert.equal(sha, CANONICAL_SHA256, `${relPath} SHA-256 mismatch`);
}

// 2. Structural fidelity of LPA001-v1.0.md
const specText = readUtf8('src/corpus/LPA001-v1.0.md');
const lines = specText.split('\n');

const expectedSections = [
  '## Preamble',
  '## 1. Identity',
  '## 2. Foundational Declaration',
  '## 3. Purpose',
  '## 4. Foundational Principles',
  '## 5. Epistemic Framework',
  '## 6. Layers of Cost Intelligence',
  '## 7. Evidence Before Structure',
  '## 8. The Role of Artificial Intelligence',
  '## 9. Distributed Knowledge and Accountable Governance',
  '## 10. Protection Against Capture and Manipulation',
  '## 11. Privacy and Responsible Accessibility',
  '## 12. Historical Integrity and Revision',
  '## 13. Interpretation Without Presumption',
  '## 14. The Continuous Learning Lifecycle',
  '## 15. The Right to Understand and Challenge',
  '## 16. Institutional and Technological Independence',
  '## 17. Scope of Authority',
  '## 18. Stewardship Across Generations',
  '## 19. Foundational Invariants',
  '## Closing Declaration',
];

const h2Headings = lines.filter(
  (line) => line.startsWith('## ') && line !== '## Foundational Principles and Epistemic Framework'
);
assert.deepEqual(h2Headings, expectedSections, 'All 21 major sections must match verbatim order');

const expectedSubsections = [
  '### 4.1 Truthfulness',
  '### 4.2 Transparency',
  '### 4.3 Accountability',
  '### 4.4 Open Participation',
  '### 4.5 Contextual Integrity',
  '### 4.6 Continuity',
  '### 4.7 Human Stewardship',
  '### 5.1 The Nature of Price',
  '### 5.2 Evidence and Claims',
  '### 5.3 Epistemic Properties',
  '### 5.4 Confidence',
  '### 5.5 Uncertainty',
  '### 5.6 Contradiction',
  '### 6.1 Historical Baseline',
  '### 6.2 Economic Adjustment',
  '### 6.3 Market Evidence',
  '### 6.4 Contextual Intelligence',
  '### 6.5 Realized Development Costs',
  '### 6.6 Synthesis',
];

const h3Headings = lines.filter((line) => line.startsWith('### '));
assert.deepEqual(h3Headings, expectedSubsections, 'All 19 subsections must match verbatim order');

const expectedProperties = [
  'Observed',
  'Declared',
  'Corroborated',
  'Derived',
  'Inferred',
  'Disputed',
  'Stale',
  'Superseded',
];
for (const prop of expectedProperties) {
  assert.ok(specText.includes(`| ${prop} |`), `Epistemic property ${prop} missing in Section 5.3`);
}

const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
for (const numeral of romanNumerals) {
  assert.ok(
    lines.some((line) => line.startsWith(`**${numeral}.** `)),
    `Invariant ${numeral} missing in Section 19`
  );
}

assert.ok(lines.includes('*End of LPA001*'), 'Closing colophon *End of LPA001* must be present');

// 3. CSP origins in index.html for Pulse widget + 1-click Google Sign-In
const indexHtml = readUtf8('index.html');
const requiredCspOrigins = [
  'https://cdn.pulsemessages.com',
  'https://apis.google.com',
  'https://accounts.google.com',
  'https://*.firebaseapp.com',
  'https://*.googleusercontent.com',
];
for (const origin of requiredCspOrigins) {
  assert.ok(indexHtml.includes(origin), `index.html CSP must include ${origin}`);
}

// 4. Hallmark CSS craft floor checks
const stylesCss = readUtf8('src/styles.css');
assert.ok(stylesCss.includes('overflow-x: clip;'), 'styles.css must enforce overflow-x: clip');
assert.ok(stylesCss.includes(':focus-visible'), 'styles.css must include :focus-visible styling');
assert.ok(
  stylesCss.includes('prefers-reduced-motion: reduce'),
  'styles.css must support prefers-reduced-motion: reduce'
);
assert.ok(stylesCss.includes('oklch('), 'styles.css must use OKLCH design tokens');
assert.equal(
  /transition\s*:\s*all/i.test(stylesCss),
  false,
  'styles.css must never use transition: all'
);

// 5. Zero UI-chrome em-dashes or glued arrows in App.tsx and index.html
const appTsx = readUtf8('src/App.tsx');
for (const [label, src] of [
  ['index.html', indexHtml],
  ['src/App.tsx', appTsx],
]) {
  assert.equal(src.includes('—'), false, `${label} must not contain UI-chrome em-dashes`);
  assert.equal(src.includes('→'), false, `${label} must not contain glued arrow glyphs`);
}

// 6. Secret hygiene: no populated VITE_PULSE_CLIENT_ID in .env.example or src/
const envExample = readUtf8('.env.example');
assert.match(envExample, /^VITE_PULSE_CLIENT_ID=\s*$/m, '.env.example must keep empty placeholder');
const trackedEnv = execFileSync('git', ['ls-files', '.env', '.env.local', '.env.production.local'], {
  cwd: ROOT,
  encoding: 'utf8',
}).trim();
assert.equal(trackedEnv, '', 'Local .env files must never be tracked in Git');

console.log('ALL SPEC-FIDELITY & HALLMARK FLOOR CHECKS PASSED (6/6 groups)');
