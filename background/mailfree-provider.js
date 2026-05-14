(function mailfreeProviderModule(root, factory) {
  root.MultiPageBackgroundMailfreeProvider = factory();
})(typeof self !== 'undefined' ? self : globalThis, function createMailfreeProviderModule() {
  function createMailfreeProvider(deps = {}) {
    const {
      fetchImpl = typeof fetch === 'function' ? fetch.bind(globalThis) : null,
      normalizeCloudflareTempEmailAddress = (value) => String(value || '').trim().toLowerCase(),
    } = deps;

    function isMailfreeBaseUrl(baseUrl = '') {
      const value = String(baseUrl || '').trim();
      if (!value) return false;
      try {
        const parsed = new URL(value);
        const host = String(parsed.hostname || '').trim().toLowerCase();
        return host === 'mailfree.nanzheyin.workers.dev';
      } catch {
        return false;
      }
    }

    function normalizeMailfreeMessage(row = {}) {
      if (!row || typeof row !== 'object') return null;
      const address = normalizeCloudflareTempEmailAddress(
        row.to_addrs || row.mailbox || row.address || row.email || ''
      );
      const sender = String(row.sender || row.from || '').trim();
      const subject = String(row.subject || '').trim();
      const html = String(row.html_content || '').trim();
      const text = String(row.content || row.preview || '').trim();
      const verificationCode = String(row.verification_code || '').trim();
      const bodyPreview = String(
        verificationCode
        || text
        || html.replace(/<[^>]+>/g, ' ')
      ).replace(/\s+/g, ' ').trim();

      return {
        id: String(row.id || '').trim(),
        address,
        addressId: '',
        subject,
        verificationCode,
        from: {
          emailAddress: {
            address: sender,
          },
        },
        bodyPreview,
        raw: '',
        receivedDateTime: String(row.received_at || row.created_at || row.updated_at || '').trim(),
      };
    }

    function normalizeMailfreeMessages(payload) {
      const rows = Array.isArray(payload) ? payload : [];
      return rows
        .map((row) => normalizeMailfreeMessage(row))
        .filter(Boolean);
    }

    async function requestMailfree(config, path, options = {}) {
      if (!fetchImpl) {
        throw new Error('Mailfree 当前运行环境不支持 fetch。');
      }
      const timeoutMs = Number(options.timeoutMs) || 20000;
      const requestUrl = new URL(path, config.baseUrl);
      const searchParams = options.searchParams && typeof options.searchParams === 'object'
        ? options.searchParams
        : null;
      if (searchParams) {
        Object.entries(searchParams).forEach(([key, value]) => {
          if (value == null || value === '') return;
          requestUrl.searchParams.set(key, String(value));
        });
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(new Error('timeout')), timeoutMs);
      let response;
      try {
        response = await fetchImpl(requestUrl.toString(), {
          method: options.method || 'GET',
          headers: {
            Accept: 'application/json',
            ...(options.headers || {}),
          },
          credentials: 'include',
          signal: controller.signal,
          body: options.body,
        });
      } catch (err) {
        const errorMessage = err?.name === 'AbortError'
          ? `Mailfree 请求超时（>${Math.round(timeoutMs / 1000)} 秒）`
          : `Mailfree 请求失败：${err.message}`;
        throw new Error(errorMessage);
      } finally {
        clearTimeout(timeoutId);
      }

      const text = await response.text();
      let parsed;
      try {
        parsed = text ? JSON.parse(text) : [];
      } catch {
        parsed = text;
      }

      if (!response.ok) {
        const payloadError = typeof parsed === 'object' && parsed
          ? (parsed.message || parsed.error || parsed.msg)
          : '';
        if (response.status === 401) {
          throw new Error('Mailfree 未登录或登录态已失效，请先在浏览器中登录 mailfree 后重试。');
        }
        throw new Error(`Mailfree 请求失败：${payloadError || text || `HTTP ${response.status}`}`);
      }

      return {
        response,
        parsed,
        text,
      };
    }

    async function requestMailfreeMessages(config, address, options = {}) {
      const targetAddress = normalizeCloudflareTempEmailAddress(address);
      if (!targetAddress) {
        throw new Error('Mailfree 缺少 mailbox 参数。');
      }

      const { parsed } = await requestMailfree(config, '/api/emails', {
        method: 'GET',
        searchParams: {
          mailbox: targetAddress,
        },
        timeoutMs: options.timeoutMs,
      });

      if (!Array.isArray(parsed)) {
        throw new Error('Mailfree 返回的邮件列表格式无效。');
      }

      return normalizeMailfreeMessages(parsed);
    }

    async function requestMailfreeDeleteMessage(config, mailId, options = {}) {
      const targetMailId = String(mailId || '').trim();
      if (!targetMailId) return false;

      await requestMailfree(config, `/api/email/${encodeURIComponent(targetMailId)}`, {
        method: 'DELETE',
        timeoutMs: options.timeoutMs,
      });
      return true;
    }

    return {
      isMailfreeBaseUrl,
      normalizeMailfreeMessage,
      normalizeMailfreeMessages,
      requestMailfreeDeleteMessage,
      requestMailfreeMessages,
    };
  }

  return {
    createMailfreeProvider,
  };
});
