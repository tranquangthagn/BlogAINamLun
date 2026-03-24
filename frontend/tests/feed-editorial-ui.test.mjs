import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const homePath = resolve('src/pages/Home.tsx');
const postCardPath = resolve('src/components/PostCard.tsx');
const cssPath = resolve('src/App.css');

test('home uses editorial filter rail classes', () => {
  const source = readFileSync(homePath, 'utf8');

  assert.ok(source.includes('editorial-filter-rail'));
  assert.ok(source.includes('editorial-filter-card'));
  assert.ok(source.includes('editorial-feed'));
});

test('post card uses editorial feed card structure', () => {
  const source = readFileSync(postCardPath, 'utf8');

  assert.ok(source.includes('editorial-post-card'));
  assert.ok(source.includes('editorial-post-card__header'));
  assert.ok(source.includes('editorial-post-card__actions'));
  assert.ok(source.includes('editorial-media-grid'));
});

test('app css defines editorial feed styles', () => {
  const source = readFileSync(cssPath, 'utf8');

  assert.ok(source.includes('.editorial-filter-rail'));
  assert.ok(source.includes('.editorial-filter-card'));
  assert.ok(source.includes('.editorial-post-card'));
  assert.ok(source.includes('.editorial-post-card__actions'));
  assert.ok(source.includes('.editorial-media-grid'));
});
