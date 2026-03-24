import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const files = {
  settings: resolve('src/pages/Settings.tsx'),
  archive: resolve('src/pages/Archive.tsx'),
  postCard: resolve('src/components/PostCard.tsx'),
  automationSettings: resolve('src/data/automationSettings.ts'),
};

const suspiciousTokens = ['Ăƒ', 'Ă‚', 'Ă„', 'Ă¢â‚¬', 'Ä‘Å¸', 'ï¿½'];

test('settings page keeps Vietnamese copy readable', () => {
  const source = readFileSync(files.settings, 'utf8');

  for (const token of suspiciousTokens) {
    assert.equal(source.includes(token), false, `Settings.tsx should not contain mojibake token ${token}`);
  }

  for (const text of ['Tự động đăng bài', 'Phạm vi dữ liệu', 'Xem trước và hành động']) {
    assert.ok(source.includes(text), `Expected Settings.tsx to contain "${text}"`);
  }
});

test('archive page keeps Vietnamese copy readable', () => {
  const source = readFileSync(files.archive, 'utf8');

  for (const token of suspiciousTokens) {
    assert.equal(source.includes(token), false, `Archive.tsx should not contain mojibake token ${token}`);
  }

  for (const text of ['Kho Lưu Trữ Của Cậu Chủ', 'Dấu chân', 'Từ ngày']) {
    assert.ok(source.includes(text), `Expected Archive.tsx to contain "${text}"`);
  }
});

test('post card keeps Vietnamese actions readable', () => {
  const source = readFileSync(files.postCard, 'utf8');

  for (const token of suspiciousTokens) {
    assert.equal(source.includes(token), false, `PostCard.tsx should not contain mojibake token ${token}`);
  }

  for (const text of ['Thời trang', 'Sức khỏe', 'Sao chép', 'Tải ảnh']) {
    assert.ok(source.includes(text), `Expected PostCard.tsx to contain "${text}"`);
  }
});

test('automation settings helper keeps Vietnamese text readable', () => {
  const source = readFileSync(files.automationSettings, 'utf8');

  for (const token of suspiciousTokens) {
    assert.equal(source.includes(token), false, `automationSettings.ts should not contain mojibake token ${token}`);
  }

  for (const text of ['hôm nay', 'Trợ lý AI', 'Đang bật tự động đăng']) {
    assert.ok(source.includes(text), `Expected automationSettings.ts to contain "${text}"`);
  }
});
