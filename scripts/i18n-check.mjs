import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const viPath = path.join(rootDir, 'src', 'i18n', 'vi.json');
const enPath = path.join(rootDir, 'src', 'i18n', 'en.json');
const allowlistPath = path.join(rootDir, 'src', 'i18n', 'allowlist.json');

console.log('🔍 Checking i18n symmetry and purity...\n');

let hasError = false;

// 1. Read files
if (!fs.existsSync(viPath) || !fs.existsSync(enPath) || !fs.existsSync(allowlistPath)) {
  console.error('❌ Error: Translation files or allowlist.json missing!');
  process.exit(1);
}

const viData = JSON.parse(fs.readFileSync(viPath, 'utf8'));
const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const allowlist = new Set(JSON.parse(fs.readFileSync(allowlistPath, 'utf8')));

// Helper to flatten nested object keys
function getDeepKeys(obj, prefix = '') {
  let keys = [];
  for (const [k, v] of Object.entries(obj)) {
    const fullPath = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      keys = keys.concat(getDeepKeys(v, fullPath));
    } else {
      keys.push(fullPath);
    }
  }
  return keys;
}

function getValueByPath(obj, pathStr) {
  return pathStr.split('.').reduce((acc, part) => (acc ? acc[part] : undefined), obj);
}

const viKeys = new Set(getDeepKeys(viData));
const enKeys = new Set(getDeepKeys(enData));

// Check Key Parity
console.log(`Checking key parity (${viKeys.size} keys in VI, ${enKeys.size} keys in EN)...`);

const missingInEn = [...viKeys].filter(k => !enKeys.has(k));
const missingInVi = [...enKeys].filter(k => !viKeys.has(k));

if (missingInEn.length > 0) {
  hasError = true;
  console.error('❌ Keys in vi.json but missing in en.json:');
  missingInEn.forEach(k => console.error(`   - ${k}`));
}

if (missingInVi.length > 0) {
  hasError = true;
  console.error('❌ Keys in en.json but missing in vi.json:');
  missingInVi.forEach(k => console.error(`   - ${k}`));
}

if (missingInEn.length === 0 && missingInVi.length === 0) {
  console.log('✓ 100% key symmetry achieved between vi.json and en.json.');
}

// Check Vietnamese purity against disallowed English words
console.log('\nChecking Vietnamese string purity against allowlist...');

// English indicators: words with 3+ Latin chars that aren't Vietnamese words or in allowlist
// Common leaked English words
const englishIndicators = [
  'button', 'card', 'header', 'footer', 'overview', 'dashboard', 'settings',
  'history', 'results', 'tailor', 'studio', 'scan', 'start', 'cancel',
  'delete', 'edit', 'login', 'register', 'submit', 'measurements', 'confidence',
  'accuracy', 'tolerance', 'dossier', 'feedback', 'guidance', 'camera', 'mode',
  'avatar', 'mannequin', 'profile', 'logout', 'privacy', 'error', 'success', 'warning'
];

let rogueWordsCount = 0;

for (const key of viKeys) {
  const val = getValueByPath(viData, key);
  if (typeof val === 'string') {
    // Check if any allowlisted phrases appear, mask them out before checking words
    let maskedVal = val;
    for (const allowed of allowlist) {
      maskedVal = maskedVal.split(allowed).join(' ');
    }

    // Tokenize
    const words = maskedVal.match(/[A-Za-zÀ-ỹ0-9_-]+/g) || [];
    for (const word of words) {
      const lower = word.toLowerCase();
      if (englishIndicators.includes(lower)) {
        console.error(`❌ Disallowed English word "${word}" found in vi.json at key "${key}": "${val}"`);
        hasError = true;
        rogueWordsCount++;
      }
    }
  }
}

if (rogueWordsCount === 0) {
  console.log('✓ No disallowed English words detected in vi.json.');
}

if (hasError) {
  console.error('\n❌ i18n Check Failed. Please resolve the errors above.');
  process.exit(1);
} else {
  console.log('\n✨ i18n Check Passed Successfully!\n');
  process.exit(0);
}
