import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const testDir = dirname(fileURLToPath(import.meta.url));
const apiDir = resolve(testDir, '../src/api');

function toDataUrl(code) {
  return `data:text/javascript;base64,${Buffer.from(code, 'utf8').toString('base64')}`;
}

function compileModule(modulePath, cache = new Map()) {
  if (cache.has(modulePath)) {
    return cache.get(modulePath);
  }

  assert.ok(existsSync(modulePath), `Expected module to exist: ${modulePath}`);
  const source = readFileSync(modulePath, 'utf8');
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;

  const rewritten = transpiled.replace(
    /from ['"](\.[^'"]+)['"]/g,
    (_, specifier) => {
      const dependencyPath = resolve(dirname(modulePath), `${specifier}.ts`);
      return `from '${compileModule(dependencyPath, cache)}'`;
    },
  );

  const dataUrl = toDataUrl(rewritten);
  cache.set(modulePath, dataUrl);
  return dataUrl;
}

async function loadApiModule(name) {
  const modulePath = resolve(apiDir, `${name}.ts`);
  return import(compileModule(modulePath));
}

test('posts api uses backend route', async () => {
  const calls = [];
  global.fetch = async (url) => {
    calls.push(url);
    return { ok: true, json: async () => [] };
  };
  delete global.__BLOG_API_BASE_URL__;
  delete global.location;

  const mod = await loadApiModule('posts');
  await mod.listPosts();

  assert.equal(calls[0], 'http://localhost:8000/api/posts');
});

test('posts api follows the current page hostname for local backend calls', async () => {
  const calls = [];
  global.fetch = async (url) => {
    calls.push(url);
    return { ok: true, json: async () => [] };
  };
  delete global.__BLOG_API_BASE_URL__;
  global.location = {
    hostname: '127.0.0.1',
    protocol: 'http:',
  };

  const mod = await loadApiModule('posts');
  await mod.listPosts();

  assert.equal(calls[0], 'http://127.0.0.1:8000/api/posts');
});

test('automation api sends settings to backend settings route', async () => {
  const calls = [];
  global.fetch = async (url, options) => {
    calls.push({ url, options });
    return { ok: true, json: async () => ({ enabled: true }) };
  };
  delete global.__BLOG_API_BASE_URL__;
  delete global.location;

  const mod = await loadApiModule('automation');
  await mod.updateAutomationSettings({
    enabled: true,
    scheduleMode: 'fixed_time',
    postTime: '08:00',
    intervalMinutes: 30,
    sources: ['tiktok'],
    trendRangeMode: 'week',
    customDateRange: { start: null, end: null },
    lastRunAt: null,
    lastGeneratedPostId: null,
  });

  assert.equal(calls[0].url, 'http://localhost:8000/api/automation/settings');
  assert.equal(calls[0].options.method, 'PUT');
});

test('automation preview api expects a batch response shape', async () => {
  const calls = [];
  global.fetch = async (url, options) => {
    calls.push({ url, options });
    return {
      ok: true,
      json: async () => ({
        batchId: 'batch-demo',
        items: [
          {
            id: 11,
            batchId: 'batch-demo',
            title: 'Bai 1',
            content: 'Noi dung',
            source: 'tiktok',
            topicKey: 'fashion-a',
            createdAt: '2026-03-25T10:00:00',
            posted: false,
            category: 'fashion',
            status: 'preview',
            failureReason: null,
            images: ['https://images.example/fashion.jpg'],
            insights: [],
          },
        ],
      }),
    };
  };
  delete global.__BLOG_API_BASE_URL__;
  delete global.location;

  const mod = await loadApiModule('automation');
  const result = await mod.previewAutomationCandidates({
    enabled: true,
    scheduleMode: 'fixed_time',
    postTime: '08:00',
    intervalMinutes: 30,
    sources: ['tiktok'],
    trendRangeMode: 'week',
    customDateRange: { start: null, end: null },
    tone: 'gan_gui',
    focusPrompt: 'uu tien dang yeu',
    lastRunAt: null,
    lastGeneratedPostId: null,
  });

  assert.equal(calls[0].url, 'http://localhost:8000/api/automation/preview');
  assert.equal(calls[0].options.method, 'POST');
  assert.equal(result.batchId, 'batch-demo');
  assert.equal(result.items.length, 1);
  assert.equal(result.items[0].images[0], 'https://images.example/fashion.jpg');
});

test('automation post-now api expects a queued batch receipt', async () => {
  const calls = [];
  global.fetch = async (url, options) => {
    calls.push({ url, options });
    return {
      ok: true,
      json: async () => ({
        batchId: 'batch-now',
        queuedCount: 3,
        mode: 'queued',
      }),
    };
  };
  delete global.__BLOG_API_BASE_URL__;
  delete global.location;

  const mod = await loadApiModule('automation');
  const result = await mod.postAutomationNow();

  assert.equal(calls[0].url, 'http://localhost:8000/api/automation/post-now');
  assert.equal(calls[0].options.method, 'POST');
  assert.equal(result.batchId, 'batch-now');
  assert.equal(result.queuedCount, 3);
  assert.equal(result.mode, 'queued');
});
