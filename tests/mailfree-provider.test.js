const test = require('node:test');
const assert = require('node:assert/strict');

require('../background/mailfree-provider.js');

test('mailfree provider detects known base url', () => {
  const api = globalThis.MultiPageBackgroundMailfreeProvider.createMailfreeProvider({
    normalizeCloudflareTempEmailAddress(value) {
      return String(value || '').trim().toLowerCase();
    },
  });
  assert.equal(api.isMailfreeBaseUrl('https://mailfree.nanzheyin.workers.dev'), true);
  assert.equal(api.isMailfreeBaseUrl('https://other.example.com'), false);
});

test('mailfree provider normalizes message fields for verification flow', () => {
  const api = globalThis.MultiPageBackgroundMailfreeProvider.createMailfreeProvider({
    normalizeCloudflareTempEmailAddress(value) {
      return String(value || '').trim().toLowerCase();
    },
  });
  const messages = api.normalizeMailfreeMessages([
    {
      id: 101,
      to_addrs: 'u9b70nbq2s@sdgsdf.109286.xyz',
      sender: 'OpenAI <noreply@tm.openai.com>',
      subject: 'OpenAI verification code',
      verification_code: '123456',
      content: 'Your verification code is 654321.',
      received_at: '2026-05-14 10:00:00',
    },
  ]);

  assert.equal(messages.length, 1);
  assert.equal(messages[0].id, '101');
  assert.equal(messages[0].address, 'u9b70nbq2s@sdgsdf.109286.xyz');
  assert.equal(messages[0].subject, 'OpenAI verification code');
  assert.equal(messages[0].verificationCode, '123456');
  assert.equal(messages[0].from.emailAddress.address, 'OpenAI <noreply@tm.openai.com>');
  assert.equal(messages[0].bodyPreview, '123456');
  assert.equal(messages[0].receivedDateTime, '2026-05-14 10:00:00');
});

test('mailfree provider deletes message via api/email/:id', async () => {
  const calls = [];
  const api = globalThis.MultiPageBackgroundMailfreeProvider.createMailfreeProvider({
    fetchImpl: async (url, options = {}) => {
      calls.push({ url, options });
      return {
        ok: true,
        status: 200,
        async text() {
          return '{"ok":true}';
        },
      };
    },
    normalizeCloudflareTempEmailAddress(value) {
      return String(value || '').trim().toLowerCase();
    },
  });

  const deleted = await api.requestMailfreeDeleteMessage(
    { baseUrl: 'https://mailfree.nanzheyin.workers.dev' },
    'mail-123'
  );

  assert.equal(deleted, true);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://mailfree.nanzheyin.workers.dev/api/email/mail-123');
  assert.equal(calls[0].options.method, 'DELETE');
  assert.equal(calls[0].options.credentials, 'include');
});
