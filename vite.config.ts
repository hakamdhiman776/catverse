import { readdirSync } from 'node:fs';
import { basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

const CATS_DIR = fileURLToPath(new URL('./public/cats', import.meta.url));
const CAT_FILE = /^cat-\d+\.(png|jpe?g|webp|avif)$/i;
const VIRTUAL_ID = 'virtual:cat-manifest';
const RESOLVED_ID = `\0${VIRTUAL_ID}`;

function catManifest(): Plugin {
  return {
    name: 'cat-manifest',
    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_ID;
      return null;
    },
    load(id) {
      if (id !== RESOLVED_ID) return null;

      let files: string[] = [];
      try {
        files = readdirSync(CATS_DIR)
          .filter((file) => CAT_FILE.test(file))
          .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
      } catch {
        files = [];
      }

      return `export default ${JSON.stringify(files)};`;
    },
    configureServer(server) {
      const refresh = (file: string) => {
        if (!CAT_FILE.test(basename(file))) return;

        const mod = server.moduleGraph.getModuleById(RESOLVED_ID);
        if (mod) server.moduleGraph.invalidateModule(mod);
        server.ws.send({ type: 'full-reload' });
      };

      server.watcher.add(CATS_DIR);
      server.watcher.on('add', refresh);
      server.watcher.on('unlink', refresh);
    },
  };
}

export default defineConfig({
  plugins: [react(), catManifest()],
  server: {
    host: true,
  },
});
