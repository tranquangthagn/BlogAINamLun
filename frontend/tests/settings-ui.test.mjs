import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const settingsPath = resolve('src/pages/Settings.tsx');
const appPath = resolve('src/App.tsx');

test('settings page file exists with key automation sections', () => {
  assert.ok(existsSync(settingsPath), 'Expected Settings.tsx to exist');

  const source = readFileSync(settingsPath, 'utf8');
  const expectedTexts = [
    'Tự động đăng bài',
    'Lịch đăng bài',
    'Theo giờ cố định',
    'Mấy phút một lần',
    'Nguồn trend',
    'Phạm vi dữ liệu',
    'Tạo bài nháp xem trước',
    'Đăng thử ngay',
    'Tổng quan AI',
    'Xem trước và hành động',
  ];

  for (const text of expectedTexts) {
    assert.ok(source.includes(text), `Expected Settings.tsx to contain "${text}"`);
  }
});

test('app route points settings path to Settings page', () => {
  const source = readFileSync(appPath, 'utf8');

  assert.ok(source.includes("import Settings from './pages/Settings'"));
  assert.ok(source.includes('<Route path="/settings" element={<Settings />} />'));
});
