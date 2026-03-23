import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../src/pages/Home.tsx', import.meta.url), 'utf8');

test('Home filter uses proper Vietnamese labels', () => {
  const expectedTexts = [
    'Hôm nay',
    '7 ngày qua',
    'Tháng này',
    'Năm nay',
    'Từ ngày',
    'Đến ngày',
    'Tất cả',
    'Thời trang',
    'Sức khỏe',
    'Mẹo Vặt',
    'Bẩm cậu Chủ, "vùng trời" này hiện chưa có bài viết nào ạ! 🔍',
  ];

  for (const text of expectedTexts) {
    assert.ok(source.includes(text), `Expected Home.tsx to contain "${text}"`);
  }
});
