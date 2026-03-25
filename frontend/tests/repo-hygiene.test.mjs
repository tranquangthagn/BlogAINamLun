import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const testDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(testDir, '..', '..');

function readFromRoot(relativePath) {
  return readFileSync(resolve(repoRoot, relativePath), 'utf8');
}

test('gitignore excludes frontend build output', () => {
  const source = readFromRoot('.gitignore');

  assert.ok(source.includes('frontend/dist/'));
  assert.ok(source.includes('backend/.venv/'));
});

test('backend helper script exists and validates Python availability', () => {
  const scriptPath = resolve(repoRoot, 'scripts/backend-dev.ps1');

  assert.ok(existsSync(scriptPath), 'Expected scripts/backend-dev.ps1 to exist');

  const source = readFileSync(scriptPath, 'utf8');
  assert.ok(source.includes('[ValidateSet("doctor", "test", "serve", "migrate")]'));
  assert.ok(source.includes('[string]$BindHost'));
  assert.ok(source.includes("AppData\\Local\\Programs\\Python"));
  assert.ok(source.includes('WindowsApps\\python.exe'));
  assert.ok(source.includes('No usable Python interpreter'));
  assert.ok(source.includes('"alembic.ini"'));
});

test('backend requirements include cryptography for MySQL auth', () => {
  const requirements = readFromRoot('backend/requirements.txt');

  assert.ok(
    requirements.split(/\r?\n/).includes('cryptography'),
    'Expected backend requirements to include cryptography for MySQL auth support',
  );
});
