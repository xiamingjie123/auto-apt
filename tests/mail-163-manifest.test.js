const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('manifest 不再注入 QQ/163/126 邮箱内容脚本', () => {
  const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
  const scripts = manifest.content_scripts.flatMap((script) => script.js || []);
  const matches = manifest.content_scripts.flatMap((script) => script.matches || []);

  assert.equal(scripts.includes('content/qq-mail.js'), false);
  assert.equal(scripts.includes('content/mail-163.js'), false);
  assert.equal(matches.some((pattern) => pattern.includes('mail.qq.com')), false);
  assert.equal(matches.some((pattern) => pattern.includes('mail.163.com')), false);
  assert.equal(matches.some((pattern) => pattern.includes('mail.126.com')), false);
});
