const test = require('node:test');
const assert = require('node:assert/strict');

const {
  HOTMAIL_PROVIDER,
  LUCKMAIL_PROVIDER,
  getIcloudForwardMailConfig,
  getIcloudForwardMailProviderOptions,
  getMailProviderConfig,
  normalizeIcloudForwardMailProvider,
  normalizeIcloudTargetMailboxType,
  normalizeMailProvider,
} = require('../mail-provider-utils.js');

test('normalizeMailProvider removes legacy 163/QQ providers and falls back to LuckMail', () => {
  assert.equal(normalizeMailProvider('163'), LUCKMAIL_PROVIDER);
  assert.equal(normalizeMailProvider('163-vip'), LUCKMAIL_PROVIDER);
  assert.equal(normalizeMailProvider('126'), LUCKMAIL_PROVIDER);
  assert.equal(normalizeMailProvider('qq'), LUCKMAIL_PROVIDER);
  assert.equal(normalizeMailProvider('unknown-provider'), LUCKMAIL_PROVIDER);
});

test('getMailProviderConfig maps legacy 163/QQ providers to LuckMail', () => {
  assert.deepEqual(
    getMailProviderConfig({ mailProvider: '126' }),
    {
      provider: LUCKMAIL_PROVIDER,
      label: 'LuckMail（API 购邮）',
    }
  );
  assert.deepEqual(getMailProviderConfig({ mailProvider: 'qq' }), {
    provider: LUCKMAIL_PROVIDER,
    label: 'LuckMail（API 购邮）',
  });
});

test('getMailProviderConfig preserves the hotmail provider sentinel', () => {
  assert.deepEqual(
    getMailProviderConfig({ mailProvider: HOTMAIL_PROVIDER }),
    {
      provider: HOTMAIL_PROVIDER,
      label: 'Hotmail（微软 Graph）',
    }
  );
});

test('iCloud forward mailbox helpers normalize and expose supported providers', () => {
  assert.equal(normalizeIcloudTargetMailboxType('forward-mailbox'), 'forward-mailbox');
  assert.equal(normalizeIcloudTargetMailboxType('unknown'), 'icloud-inbox');
  assert.equal(normalizeIcloudForwardMailProvider('GMAIL'), 'gmail');
  assert.equal(normalizeIcloudForwardMailProvider('unknown'), 'gmail');
  assert.deepEqual(
    getIcloudForwardMailProviderOptions().map((option) => option.value),
    ['gmail']
  );
});

test('getIcloudForwardMailConfig reuses shared mailbox provider configs', () => {
  assert.deepEqual(getIcloudForwardMailConfig('126'), {
    source: 'gmail-mail',
    url: 'https://mail.google.com/mail/u/0/#inbox',
    label: 'Gmail 邮箱',
    inject: ['content/activation-utils.js', 'content/utils.js', 'content/gmail-mail.js'],
    injectSource: 'gmail-mail',
  });
  assert.deepEqual(getIcloudForwardMailConfig('gmail'), {
    source: 'gmail-mail',
    url: 'https://mail.google.com/mail/u/0/#inbox',
    label: 'Gmail 邮箱',
    inject: ['content/activation-utils.js', 'content/utils.js', 'content/gmail-mail.js'],
    injectSource: 'gmail-mail',
  });
});
