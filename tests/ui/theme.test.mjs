import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../../packages/ui/src/theme-bootstrap.js', import.meta.url), 'utf8');
function boot(saved, dark, denied = false) {
  const root = { dataset: {}, style: {}, classList: { toggle(name, value) { this[name] = value; } } };
  vm.runInNewContext(source, {
    document: { documentElement: root },
    localStorage: { getItem() { if (denied) throw new Error('Storage blocked'); return saved; } },
    matchMedia: () => ({ matches: dark }),
  });
  return root;
}
test('first visit follows the operating system', () => {
  assert.equal(boot(null, true).dataset.theme, 'dark');
  assert.equal(boot(null, false).dataset.theme, 'light');
});
test('explicit choice overrides system and native controls match', () => {
  const root = boot('light', true);
  assert.equal(root.dataset.theme, 'light');
  assert.equal(root.style.colorScheme, 'light');
  assert.equal(root.classList.dark, false);
  assert.equal(boot('dark', false).dataset.theme, 'dark');
});
test('invalid preference and denied storage safely follow system', () => {
  assert.equal(boot('invalid', true).dataset.theme, 'dark');
  assert.equal(boot(null, true, true).dataset.theme, 'dark');
});
