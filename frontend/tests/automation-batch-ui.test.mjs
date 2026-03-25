import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const settingsPath = resolve('src/pages/Settings.tsx');
const dataPath = resolve('src/data/automationSettings.ts');

test('settings page explains per-source batch preview and publish-as-ready flow', () => {
  const source = readFileSync(settingsPath, 'utf8');

  assert.ok(source.includes('groupPreviewBySource'));
  assert.ok(source.includes('previewGroups.map'));
  assert.ok(source.includes('automationSourceLabels[source]'));
  assert.ok(source.includes('preview.images.length > 0'));
  assert.ok(source.includes('receipt.queuedCount'));
});

test('automation settings metadata reflects three posts per source copy', () => {
  const source = readFileSync(dataPath, 'utf8');

  assert.ok(source.includes('3 b'));
  assert.ok(source.includes('scheduleMode === \'interval_minutes\''));
  assert.ok(source.includes('settings.sources.length > 0'));
});
