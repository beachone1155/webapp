// Run with Node.js 18+: node --test tests/security.test.cjs
// Static dependency checks and a DOM-stub unit test; not a browser/CDN test.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const samples = path.join(root, 'smartphonegame');
const gamePath = path.join(samples, 'ch5/1-appcahce/takarabako-game.html');
const jqueryURL = 'https://code.jquery.com/jquery-3.7.1.min.js';
const jquerySRI = 'sha256-/JqT3SQfawRcv/BIHPThkBvs0OEvtFFmqPF/lYI/Cxo=';
function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const name = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(name) : [name];
  });
}
function read(file) { return fs.readFileSync(file, 'utf8'); }
function scripts(html) {
  return [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)];
}
const files = walk(samples);
const htmlFiles = files.filter(file => file.endsWith('.html'));
const game = read(gamePath);

test('jQuery scripts use the pinned HTTPS full build with SRI', () => {
  let count = 0;
  for (const file of htmlFiles) {
    for (const [, attrs] of scripts(read(file))) {
      const src = /\bsrc\s*=\s*["']([^"']+)["']/i.exec(attrs)?.[1];
      if (!src || !/jquery/i.test(src)) continue;
      assert.equal(src, jqueryURL, file);
      assert.ok(attrs.includes(`integrity="${jquerySRI}"`), file);
      assert.ok(attrs.includes('crossorigin="anonymous"'), file);
      count++;
    }
  }
  assert.equal(count, 13, 'Expected all 13 CDN-using examples');
});

test('legacy jQuery files and runtime references are absent', () => {
  for (const file of files) {
    assert.doesNotMatch(path.basename(file), /^jquery-[12]\./i, file);
    if (/\.(?:html|js|appcache)$/i.test(file)) {
      assert.doesNotMatch(read(file), /jquery-[12]\.\d|jquery\/[12]\.\d/i, file);
    }
  }
});

test('inline scripts in the 14 migrated examples parse', () => {
  const migrated = htmlFiles.filter(file => read(file).includes(jqueryURL) || file === gamePath);
  assert.equal(migrated.length, 14);
  for (const file of migrated) {
    for (const [, attrs, source] of scripts(read(file))) {
      if (!/\bsrc\s*=/i.test(attrs)) new vm.Script(source, { filename: file });
    }
  }
});

test('treasure game cache contains only its HTML and images', () => {
  const manifest = read(gamePath.replace(/\.html$/, '.appcache'));
  const entries = manifest.split(/\r?\n/).filter(line => line && !line.startsWith('#'));
  assert.deepEqual(entries, [
    'CACHE MANIFEST', 'takarabako-game.html',
    's-box-close.gif', 'box-open.gif', 'box-open-zaihou.gif'
  ]);
  assert.ok(manifest.includes('Version.1.001'));
  assert.doesNotMatch(game, /<script\b[^>]*\bsrc\s*=/i);
});

test('treasure game starts, wins, loses and restarts without jQuery', () => {
  for (const random of [0, 0.5, 0.999999]) {
    const pages = Object.fromEntries(['question', 'atari', 'hazure'].map(id => [
      id, { style: { display: '' } }
    ]));
    let ready;
    const context = vm.createContext({
      Math: { floor: Math.floor, random: () => random },
      document: {
        addEventListener(type, handler) {
          assert.equal(type, 'DOMContentLoaded'); ready = handler;
        },
        querySelectorAll(selector) {
          assert.equal(selector, "[data-role='page']"); return Object.values(pages);
        },
        querySelector(selector) {
          assert.ok(pages[selector.slice(1)], selector); return pages[selector.slice(1)];
        }
      }
    });
    for (const [, , source] of scripts(game)) vm.runInContext(source, context, { timeout: 1000 });
    assert.equal(typeof ready, 'function');
    const visible = () => Object.keys(pages).filter(id => pages[id].style.display !== 'none');
    ready();
    assert.deepEqual(visible(), ['question']);
    assert.equal(context.atari, Math.floor(random * 3));
    context.openBox(context.atari);
    assert.deepEqual(visible(), ['atari']);
    context.playGame();
    assert.deepEqual(visible(), ['question']);
    context.openBox((context.atari + 1) % 3);
    assert.deepEqual(visible(), ['hazure']);
    context.playGame();
    assert.deepEqual(visible(), ['question']);
  }
});
