import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import ts from 'typescript';

const modulePath = resolve('src/data/automationSettings.ts');

async function loadAutomationModule() {
  assert.ok(existsSync(modulePath), 'Expected automationSettings.ts to exist');
  const source = readFileSync(modulePath, 'utf8');
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2020,
    },
  });

  const encoded = Buffer.from(transpiled.outputText, 'utf8').toString('base64');
  return import(`data:text/javascript;base64,${encoded}`);
}

test('creates sensible default settings', async () => {
  const mod = await loadAutomationModule();
  const settings = mod.createDefaultAutomationSettings();

  assert.equal(settings.enabled, false);
  assert.equal(settings.postTime, '08:00');
  assert.deepEqual(settings.sources, ['tiktok', 'threads']);
  assert.equal(settings.trendRangeMode, 'week');
  assert.deepEqual(settings.customDateRange, { start: null, end: null });
});

test('validates missing sources and invalid custom range', async () => {
  const mod = await loadAutomationModule();
  const base = mod.createDefaultAutomationSettings();

  const noSources = mod.validateAutomationSettings({
    ...base,
    sources: [],
  });
  assert.equal(noSources.ok, false);
  assert.match(noSources.message, /nguồn/i);

  const badCustom = mod.validateAutomationSettings({
    ...base,
    trendRangeMode: 'custom',
    customDateRange: { start: null, end: null },
  });
  assert.equal(badCustom.ok, false);
  assert.match(badCustom.message, /ngày|range|custom/i);
});

test('generates a post and avoids recent duplicate source-topic combos', async () => {
  const mod = await loadAutomationModule();
  const settings = mod.createDefaultAutomationSettings();
  const history = [
    {
      id: 1,
      title: 'TikTok đang đẩy video ngắn kiểu checklist buổi sáng',
      content: '...',
      source: 'tiktok',
      topicKey: 'morning-checklist',
      createdAt: '2026-03-22T08:00:00.000Z',
      posted: true,
    },
  ];

  const post = mod.generateAutomationPost(settings, history, '2026-03-23T08:00:00.000Z');

  assert.equal(typeof post.title, 'string');
  assert.equal(typeof post.content, 'string');
  assert.equal(post.posted, false);
  assert.notEqual(`${post.source}:${post.topicKey}`, 'tiktok:morning-checklist');
});

test('merges generated posts ahead of older feed items', async () => {
  const mod = await loadAutomationModule();

  const merged = mod.mergeFeedPosts(
    [
      { id: 1, createdAt: '2026-03-22T10:00:00.000Z' },
      { id: 2, createdAt: '2026-03-20T10:00:00.000Z' },
    ],
    [
      { id: 100, createdAt: '2026-03-23T09:00:00.000Z' },
    ],
  );

  assert.deepEqual(
    merged.map((item) => item.id),
    [100, 1, 2],
  );
});

test('decides whether open-app automation should run only once per local day', async () => {
  const mod = await loadAutomationModule();
  const settings = mod.createDefaultAutomationSettings();

  const shouldRunFirst = mod.shouldRunAutomationNow(
    { ...settings, enabled: true, postTime: '08:00' },
    null,
    '2026-03-23T08:30:00.000Z',
  );
  assert.equal(shouldRunFirst, true);

  const shouldRunAgain = mod.shouldRunAutomationNow(
    { ...settings, enabled: true, postTime: '08:00' },
    '2026-03-23T08:05:00.000Z',
    '2026-03-23T11:00:00.000Z',
  );
  assert.equal(shouldRunAgain, false);
});
