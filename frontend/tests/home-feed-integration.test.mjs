import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const homePath = resolve('src/pages/Home.tsx');

test('home loads feed and read state from backend-backed api modules', () => {
  const source = readFileSync(homePath, 'utf8');

  assert.ok(source.includes("import { listArchive } from '../api/archive'"));
  assert.ok(source.includes("import { listPosts } from '../api/posts'"));
  assert.ok(source.includes("const AUTOMATION_EVENT = 'blog-ai-automation-updated'"));
  assert.ok(source.includes("Promise.all([listPosts(), listArchive('read')])"));
});
