import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const settingsPath = resolve('src/pages/Settings.tsx');
const cssPath = resolve('src/App.css');

test('settings page uses a split layout with flow and aside columns', () => {
  const source = readFileSync(settingsPath, 'utf8');

  assert.ok(source.includes('settings-main'));
  assert.ok(source.includes('settings-flow'));
  assert.ok(source.includes('settings-aside'));
  assert.ok(source.includes('settings-status-card'));
  assert.ok(source.includes('settings-runtime-card'));
  assert.ok(source.includes('runtimeStatus'));
  assert.ok(source.includes('settings-preview-card'));
});

test('settings css defines split layout classes', () => {
  const source = readFileSync(cssPath, 'utf8');

  assert.ok(source.includes('.settings-main'));
  assert.ok(source.includes('.settings-flow'));
  assert.ok(source.includes('.settings-aside'));
  assert.ok(source.includes('.settings-status-card'));
  assert.ok(source.includes('.settings-runtime-card'));
  assert.ok(source.includes('.settings-runtime-card__badge'));
});
