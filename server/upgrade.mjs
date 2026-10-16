// Untrusted URL and Origin headers must be rejected without escaping the
// upgrade listener: an invalid Origin can otherwise terminate the server.
export function upgradeRoom(url, origin, host) {
  try {
    const match = /^\/room\/([a-z0-9-]{1,64})$/.exec(new URL(url, 'http://localhost').pathname);
    if (!match || (origin && new URL(origin).host !== host)) return null;
    return match[1];
  } catch {
    return null;
  }
}
