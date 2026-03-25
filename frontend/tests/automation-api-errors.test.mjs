import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import ts from 'typescript';

const clientPath = resolve('src/api/client.ts');

async function loadClientModule() {
  const source = readFileSync(clientPath, 'utf8');
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ES2020,
      target: ts.ScriptTarget.ES2020,
    },
  });
  const moduleUrl = `data:text/javascript;base64,${Buffer.from(transpiled.outputText).toString('base64')}`;
  return import(moduleUrl);
}

test('requestJson maps automation quota errors to a friendly Vietnamese message', async () => {
  const previousFetch = globalThis.fetch;
  const previousBaseUrl = globalThis.__BLOG_API_BASE_URL__;
  globalThis.__BLOG_API_BASE_URL__ = 'http://example.test';
  globalThis.fetch = async () => ({
    ok: false,
    status: 503,
    json: async () => ({ detail: 'AUTOMATION_QUOTA_EXCEEDED' }),
  });

  try {
    const { requestJson } = await loadClientModule();

    await assert.rejects(
      () => requestJson('/api/automation/preview'),
      (error) =>
        error instanceof Error &&
        error.message === 'AI tam thoi het quota tao bai. Hay thu lai sau it phut.',
    );
  } finally {
    globalThis.fetch = previousFetch;
    globalThis.__BLOG_API_BASE_URL__ = previousBaseUrl;
  }
});

test('requestJson maps missing Gemini configuration to a helpful message', async () => {
  const previousFetch = globalThis.fetch;
  const previousBaseUrl = globalThis.__BLOG_API_BASE_URL__;
  globalThis.__BLOG_API_BASE_URL__ = 'http://example.test';
  globalThis.fetch = async () => ({
    ok: false,
    status: 503,
    json: async () => ({ detail: 'AUTOMATION_NOT_CONFIGURED' }),
  });

  try {
    const { requestJson } = await loadClientModule();

    await assert.rejects(
      () => requestJson('/api/automation/preview'),
      (error) =>
        error instanceof Error &&
        error.message === 'AI chua duoc cau hinh API key. Hay kiem tra backend truoc khi tao bai.',
    );
  } finally {
    globalThis.fetch = previousFetch;
    globalThis.__BLOG_API_BASE_URL__ = previousBaseUrl;
  }
});
