(function attachMailProviderUtils(root, factory) {
  const api = factory();

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  if (root) {
    root.MailProviderUtils = api;
  }
})(typeof self !== 'undefined' ? self : globalThis, function createMailProviderUtils() {
  const HOTMAIL_PROVIDER = 'hotmail-api';
  const GMAIL_PROVIDER = 'gmail';
  const LUCKMAIL_PROVIDER = 'luckmail-api';
  const ICLOUD_TARGET_MAILBOX_TYPE_INBOX = 'icloud-inbox';
  const ICLOUD_TARGET_MAILBOX_TYPE_FORWARD = 'forward-mailbox';
  const ICLOUD_FORWARD_MAIL_PROVIDER_OPTIONS = [
    { value: GMAIL_PROVIDER, label: 'Gmail 邮箱' },
  ];

  function normalizeMailProvider(value = '') {
    const normalized = String(value || '').trim().toLowerCase();
    switch (normalized) {
      case HOTMAIL_PROVIDER:
      case LUCKMAIL_PROVIDER:
      case GMAIL_PROVIDER:
      case 'inbucket':
        return normalized;
      default:
        return LUCKMAIL_PROVIDER;
    }
  }

  function normalizeIcloudTargetMailboxType(value = '') {
    return String(value || '').trim().toLowerCase() === ICLOUD_TARGET_MAILBOX_TYPE_FORWARD
      ? ICLOUD_TARGET_MAILBOX_TYPE_FORWARD
      : ICLOUD_TARGET_MAILBOX_TYPE_INBOX;
  }

  function normalizeIcloudForwardMailProvider(value = '') {
    const normalized = String(value || '').trim().toLowerCase();
    return ICLOUD_FORWARD_MAIL_PROVIDER_OPTIONS.some((option) => option.value === normalized)
      ? normalized
      : GMAIL_PROVIDER;
  }

  function getIcloudForwardMailProviderOptions() {
    return ICLOUD_FORWARD_MAIL_PROVIDER_OPTIONS.map((option) => ({ ...option }));
  }

  function getIcloudForwardMailConfig(provider = GMAIL_PROVIDER) {
    const normalizedProvider = normalizeIcloudForwardMailProvider(provider);
    if (normalizedProvider === GMAIL_PROVIDER) {
      return {
        source: 'gmail-mail',
        url: 'https://mail.google.com/mail/u/0/#inbox',
        label: 'Gmail 邮箱',
        inject: ['content/activation-utils.js', 'content/utils.js', 'content/gmail-mail.js'],
        injectSource: 'gmail-mail',
      };
    }

    return getMailProviderConfig({ mailProvider: normalizedProvider });
  }

  function getMailProviderConfig(state = {}, options = {}) {
    const provider = normalizeMailProvider(state.mailProvider);
    const normalizeInbucketOrigin = options.normalizeInbucketOrigin || (() => '');

    if (provider === HOTMAIL_PROVIDER) {
      return { provider: HOTMAIL_PROVIDER, label: 'Hotmail（微软 Graph）' };
    }
    if (provider === LUCKMAIL_PROVIDER) {
      return { provider: LUCKMAIL_PROVIDER, label: 'LuckMail（API 购邮）' };
    }
    if (provider === GMAIL_PROVIDER) {
      return {
        source: 'gmail-mail',
        url: 'https://mail.google.com/mail/u/0/#inbox',
        label: 'Gmail 邮箱',
        inject: ['content/activation-utils.js', 'content/utils.js', 'content/gmail-mail.js'],
        injectSource: 'gmail-mail',
      };
    }
    if (provider === 'inbucket') {
      const host = normalizeInbucketOrigin(state.inbucketHost);
      const mailbox = String(state.inbucketMailbox || '').trim();
      if (!host) {
        return { error: 'Inbucket 主机地址为空或无效。' };
      }
      if (!mailbox) {
        return { error: 'Inbucket 邮箱名称为空。' };
      }
      return {
        source: 'inbucket-mail',
        url: `${host}/m/${encodeURIComponent(mailbox)}/`,
        label: `Inbucket 邮箱（${mailbox}）`,
        navigateOnReuse: true,
        inject: ['content/activation-utils.js', 'content/utils.js', 'content/inbucket-mail.js'],
        injectSource: 'inbucket-mail',
      };
    }
    return { provider: LUCKMAIL_PROVIDER, label: 'LuckMail（API 购邮）' };
  }

  return {
    GMAIL_PROVIDER,
    HOTMAIL_PROVIDER,
    LUCKMAIL_PROVIDER,
    getIcloudForwardMailConfig,
    getIcloudForwardMailProviderOptions,
    getMailProviderConfig,
    normalizeIcloudForwardMailProvider,
    normalizeIcloudTargetMailboxType,
    normalizeMailProvider,
  };
});
