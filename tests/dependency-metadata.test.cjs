// Keep Dependabot's inventory aligned with the library actually used by browsers.
// No npm install or network access is needed to run these tests.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const version = manifest.dependencies?.jquery;

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

test('the browser dependency has an exact version in a private npm manifest', () => {
  assert.equal(manifest.private, true, 'This site is not an npm package for publication');
  assert.equal(typeof version, 'string');
  assert.match(version, /^\d+\.\d+\.\d+$/, 'Do not use a range for a fixed CDN release');
  assert.equal(manifest.scripts.test, 'node --test tests/*.test.cjs');
});

test('all jQuery CDN references match the dependency graph inventory', () => {
  const expected = `https://code.jquery.com/jquery-${version}.min.js`;
  let count = 0;
  for (const file of walk(path.join(root, 'smartphonegame')).filter(p => p.endsWith('.html'))) {
    const html = fs.readFileSync(file, 'utf8');
    for (const [, attrs] of html.matchAll(/<script\b([^>]*)>/gi)) {
      const src = /\bsrc\s*=\s*["']([^"']+)["']/i.exec(attrs)?.[1];
      if (!src || !/jquery/i.test(src)) continue;
      assert.equal(src, expected, `Update package.json, HTML, approved version and SRI together: ${file}`);
      assert.match(attrs, /\bintegrity\s*=\s*["']sha256-[A-Za-z0-9+/]+=*["']/i, file);
      count++;
    }
  }
  assert.equal(count, 13, 'Review intentional changes to the set of jQuery examples');
});
