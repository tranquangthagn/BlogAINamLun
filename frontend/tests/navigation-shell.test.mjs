import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const sidebarPath = resolve('src/components/Sidebar.tsx');
const appPath = resolve('src/App.tsx');
const cssPath = resolve('src/App.css');

test('sidebar uses editorial shell structure', () => {
  const source = readFileSync(sidebarPath, 'utf8');

  assert.ok(source.includes('editorial-sidebar'));
  assert.ok(source.includes('editorial-brand__eyebrow'));
  assert.ok(source.includes('nav-link__accent'));
  assert.ok(source.includes('sidebar-footnote'));
});

test('app top bar uses editorial strip structure', () => {
  const source = readFileSync(appPath, 'utf8');

  assert.ok(source.includes('useLocation'));
  assert.ok(source.includes('SHELL_COPY'));
  assert.ok(source.includes("'/posts'"));
  assert.ok(source.includes("'/settings'"));
  assert.ok(source.includes('editorial-topbar'));
  assert.ok(source.includes('editorial-topbar--slim'));
  assert.ok(source.includes('editorial-topbar__status'));
  assert.ok(source.includes('editorial-topbar__status--slim'));
  assert.ok(source.includes('editorial-search'));
  assert.ok(source.includes('editorial-search--slim'));
  assert.ok(source.includes('editorial-menu-btn--slim'));
  assert.ok(source.includes('menu-btn__label'));
});

test('app css defines editorial navigation styles', () => {
  const source = readFileSync(cssPath, 'utf8');

  assert.ok(source.includes('.editorial-sidebar'));
  assert.ok(source.includes('.editorial-topbar'));
  assert.ok(source.includes('.editorial-topbar--slim'));
  assert.ok(source.includes('.editorial-topbar__status--slim'));
  assert.ok(source.includes('.editorial-search'));
  assert.ok(source.includes('.editorial-search--slim'));
  assert.ok(source.includes('.editorial-menu-btn--slim'));
  assert.ok(source.includes('.nav-link__accent'));
});
