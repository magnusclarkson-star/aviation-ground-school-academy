import fs from 'node:fs';
import path from 'node:path';

const files = fs.readdirSync('.').filter(name => name.endsWith('.html'));
const known = new Set(fs.readdirSync('.'));
const errors = [];
const warnings = [];
for (const page of files) {
  const source = fs.readFileSync(page, 'utf8');
  if (!/<title>[^<]+<\/title>/i.test(source)) errors.push(page + ': missing document title');
  if (!/name=["']viewport["']/i.test(source)) errors.push(page + ': missing viewport meta tag');

  const references = [];
  for (const match of source.matchAll(/\b(?:href|src)\s*=\s*["']([^"']+)["']/gi)) references.push(match[1]);
  for (const match of source.matchAll(/url\(\s*["']?([^)"']+)["']?\s*\)/gi)) {
    if (/\.(svg|png|webp|jpe?g|css)([?#]|$)/i.test(match[1])) references.push(match[1]);
  }

  for (const raw of references) {
    const file = raw.split(/[?#]/)[0].replace(/^\.\//, '');
    if (!file || /^(https?:|data:|mailto:|tel:|javascript:|\/|\$\{)/i.test(file)) continue;
    if (!/\.(html|svg|png|webp|jpe?g|css|js)$/i.test(file)) continue;
    if (known.has(file) || fs.existsSync(file)) continue;
    if (file === 'aviation-hero.png' && source.includes("this.src='aviation-hero-fallback.svg'") && known.has('aviation-hero-fallback.svg')) {
      warnings.push(page + ': original photo not uploaded; SVG fallback active');
      continue;
    }
    errors.push(page + ': broken local reference ' + raw);
  }
}
console.log('Checked ' + files.length + ' HTML pages.');
for (const item of warnings) console.warn('WARNING: ' + item);
for (const item of errors) console.error('ERROR: ' + item);
if (errors.length) process.exit(1);
console.log('Static site integrity check passed.');
