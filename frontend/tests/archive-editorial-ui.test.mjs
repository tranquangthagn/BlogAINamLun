import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const archivePath = resolve('src/pages/Archive.tsx');
const cssPath = resolve('src/App.css');

test('archive uses editorial archive shell classes', () => {
  const source = readFileSync(archivePath, 'utf8');

  assert.ok(source.includes('editorial-archive'));
  assert.ok(source.includes('editorial-archive-hero'));
  assert.ok(source.includes('editorial-archive-tabs'));
  assert.ok(source.includes('editorial-archive-feed'));
});

test('archive syncs saved and read history from backend apis', () => {
  const source = readFileSync(archivePath, 'utf8');

  assert.ok(source.includes("import { listArchive } from '../api/archive'"));
  assert.ok(source.includes("Promise.all([listArchive('saved'), listArchive('read')])"));
  assert.ok(source.includes("window.addEventListener('blog-archive-updated', syncArchive)"));
  assert.ok(source.includes("window.addEventListener('blog-read-updated', syncArchive)"));
});

test('app css defines editorial archive styles', () => {
  const source = readFileSync(cssPath, 'utf8');

  assert.ok(source.includes('.editorial-archive'));
  assert.ok(source.includes('.editorial-archive-hero'));
  assert.ok(source.includes('.editorial-archive-tabs'));
  assert.ok(source.includes('.editorial-archive-empty'));
});
