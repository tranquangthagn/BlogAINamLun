import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const settingsPath = resolve('src/pages/Settings.tsx');
const appPath = resolve('src/App.tsx');

test('settings page file exists with backend automation sections', () => {
  assert.ok(existsSync(settingsPath), 'Expected Settings.tsx to exist');

  const source = readFileSync(settingsPath, 'utf8');
  const expectedTexts = [
    'getAutomationSettings',
    'listAutomationHistory',
    'previewAutomationCandidates',
    'postAutomationNow',
    'updateAutomationSettings',
    'settings-status-card',
    'settings-preview-card',
    'fixedTimeTopResultsCount',
  ];

  for (const text of expectedTexts) {
    assert.ok(source.includes(text), `Expected Settings.tsx to contain "${text}"`);
  }
});

test('app route points settings path to Settings page', () => {
  const source = readFileSync(appPath, 'utf8');

  assert.ok(source.includes("import Settings from './pages/Settings'"));
  assert.ok(source.includes('<Route path="/settings" element={<Settings />} />'));
});
