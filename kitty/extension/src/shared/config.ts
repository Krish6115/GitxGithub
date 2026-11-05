/** The hosted Kitty server. Every build uses it unless VITE_KITTY_SERVER_URL overrides it (local dev and e2e tests). */
export const HOSTED_SERVER_URL = 'https://kitty-server.vercel.app';
/** API keys never live in the extension. */
export const DEFAULT_SERVER_URL: string = import.meta.env.VITE_KITTY_SERVER_URL || HOSTED_SERVER_URL;
export const isLocalUrl = (u: string): boolean => /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\b/i.test(u.trim());
