import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const testDir = dirname(fileURLToPath(import.meta.url));
const frontendDir = resolve(testDir, '..');
const srcDir = resolve(frontendDir, 'src');

function read(relativePath) {
  return readFileSync(resolve(frontendDir, relativePath), 'utf8');
}

test('package.json exposes a frontend test script', () => {
  const pkg = JSON.parse(read('package.json'));

  assert.equal(pkg.scripts.test, 'node --test tests/*.test.mjs');
});

test('frontend source no longer imports Post types from mock data', () => {
  const files = [
    'src/api/archive.ts',
    'src/api/automation.ts',
    'src/api/posts.ts',
    'src/components/PostCard.tsx',
    'src/data/automationSettings.ts',
    'src/pages/Archive.tsx',
    'src/pages/Home.tsx',
  ];

  for (const file of files) {
    const source = read(file);
    assert.ok(
      !source.includes('mockData'),
      `Expected ${file} to stop importing types from mockData.ts`,
    );
  }
});

test('automation helpers no longer keep browser localStorage persistence', () => {
  const source = read('src/data/automationSettings.ts');

  assert.ok(!source.includes('localStorage'), 'Expected localStorage helpers to be removed');
  assert.ok(!source.includes('SETTINGS_KEY'), 'Expected legacy storage keys to be removed');
  assert.ok(!source.includes('HISTORY_KEY'), 'Expected legacy history keys to be removed');
  assert.ok(!source.includes('FEED_KEY'), 'Expected legacy feed keys to be removed');
});

test('app shell lazy-loads route pages', () => {
  const source = read('src/App.tsx');

  assert.ok(source.includes('lazy(() => import(\'./pages/Home\'))'));
  assert.ok(source.includes('lazy(() => import(\'./pages/Archive\'))'));
  assert.ok(source.includes('lazy(() => import(\'./pages/Settings\'))'));
  assert.ok(source.includes('<Suspense'));
});

test('vite config defines chunk splitting for the frontend build', () => {
  const source = read('vite.config.ts');

  assert.ok(source.includes('manualChunks'));
});

test('automation settings support lightweight tone controls and focus prompt', () => {
  const source = read('src/data/automationSettings.ts');

  assert.ok(source.includes("tone: 'trung_tinh'"));
  assert.ok(source.includes('focusPrompt:'));
});

test('automation api forwards tone and focus prompt to backend settings payload', () => {
  const source = read('src/api/automation.ts');

  assert.ok(source.includes('tone: settings.tone'));
  assert.ok(source.includes('focusPrompt: settings.focusPrompt'));
});
