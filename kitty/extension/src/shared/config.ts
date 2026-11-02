/**
 * Default Kitty server. Release builds set VITE_KITTY_SERVER_URL to the deployed server; local builds use localhost.
 * API keys never live in the extension.
 */
export const DEFAULT_SERVER_URL: string = import.meta.env.VITE_KITTY_SERVER_URL || 'http://localhost:8787';
