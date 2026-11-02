import { defineManifest } from '@crxjs/vite-plugin';
import pkg from './package.json' with { type: 'json' };

export default defineManifest({
  manifest_version: 3,
  name: 'Kitty — Git & GitHub companion',
  description: 'A pixel cat that tours GitHub repos and tutors Git.',
  version: pkg.version,
  action: { default_title: 'Kitty' },
  background: { service_worker: 'src/background/index.ts', type: 'module' },
  side_panel: { default_path: 'src/sidepanel/index.html' },
  permissions: ['sidePanel', 'storage', 'contextMenus'],
  // the Kitty server (local dev); add the deployed server URL here when it exists
  host_permissions: ['http://localhost:8787/*'],
  content_scripts: [
    { matches: ['https://github.com/*'], js: ['src/content/index.tsx'], run_at: 'document_idle' },
  ],
  web_accessible_resources: [{ resources: ['sprites/*'], matches: ['https://github.com/*'] }],
});
