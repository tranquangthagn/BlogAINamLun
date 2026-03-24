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
  assert.equal(settings.scheduleMode, 'fixed_time');
  assert.equal(settings.postTime, '08:00');
  assert.equal(settings.intervalMinutes, 30);
  assert.deepEqual(settings.sources, ['tiktok', 'threads']);
  assert.equal(settings.trendRangeMode, 'week');
  assert.deepEqual(settings.customDateRange, { start: null, end: null });
});

test('validates missing sources, invalid custom range, and invalid interval', async () => {
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

  const badInterval = mod.validateAutomationSettings({
    ...base,
    scheduleMode: 'interval_minutes',
    intervalMinutes: 0,
  });
  assert.equal(badInterval.ok, false);
  assert.match(badInterval.message, /phút|chu kỳ|interval/i);
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
      category: 'general',
    },
  ];

  const post = mod.generateAutomationPost(settings, history, '2026-03-23T08:00:00.000Z');

  assert.equal(typeof post.title, 'string');
  assert.equal(typeof post.content, 'string');
  assert.equal(post.posted, false);
  assert.notEqual(`${post.source}:${post.topicKey}`, 'tiktok:morning-checklist');
});

test('builds top 5 candidates for fixed-time schedule mode', async () => {
  const mod = await loadAutomationModule();
  const settings = mod.createDefaultAutomationSettings();

  const candidates = mod.generateAutomationCandidates(settings, [], '2026-03-24T08:00:00.000Z');

  assert.equal(candidates.length, 5);
  assert.equal(new Set(candidates.map((item) => `${item.source}:${item.topicKey}`)).size, 5);
});

test('builds a single candidate for interval schedule mode', async () => {
  const mod = await loadAutomationModule();
  const settings = {
    ...mod.createDefaultAutomationSettings(),
    scheduleMode: 'interval_minutes',
    intervalMinutes: 15,
  };

  const candidates = mod.generateAutomationCandidates(settings, [], '2026-03-24T08:00:00.000Z');

  assert.equal(candidates.length, 1);
});

test('merges generated posts ahead of older feed items', async () => {
  const mod = await loadAutomationModule();

  const merged = mod.mergeFeedPosts(
    [
      { id: 1, createdAt: '2026-03-22T10:00:00.000Z' },
      { id: 2, createdAt: '2026-03-20T10:00:00.000Z' },
    ],
    [{ id: 100, createdAt: '2026-03-23T09:00:00.000Z' }],
  );

  assert.deepEqual(
    merged.map((item) => item.id),
    [100, 1, 2],
  );
});

test('decides whether open-app automation should run only once per local day in fixed mode', async () => {
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

test('decides whether interval automation should wait for enough minutes', async () => {
  const mod = await loadAutomationModule();
  const settings = {
    ...mod.createDefaultAutomationSettings(),
    enabled: true,
    scheduleMode: 'interval_minutes',
    intervalMinutes: 20,
  };

  const tooSoon = mod.shouldRunAutomationNow(
    settings,
    '2026-03-24T08:05:00.000Z',
    '2026-03-24T08:20:00.000Z',
  );
  assert.equal(tooSoon, false);

  const ready = mod.shouldRunAutomationNow(
    settings,
    '2026-03-24T08:05:00.000Z',
    '2026-03-24T08:26:00.000Z',
  );
  assert.equal(ready, true);
});
