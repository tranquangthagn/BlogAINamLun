import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const homePath = resolve('src/pages/Home.tsx');

test('home integrates generated feed posts from automation storage', () => {
  const source = readFileSync(homePath, 'utf8');

  assert.ok(source.includes('loadGeneratedFeedPosts'));
  assert.ok(source.includes('mergeFeedPosts'));
});
