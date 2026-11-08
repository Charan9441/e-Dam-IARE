import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

function apiDevMiddleware(): Plugin {
  return {
    name: 'api-dev-middleware',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith('/api/') && req.url !== '/api') {
          return next();
        }

        const chunks: Buffer[] = [];
        req.on('data', (chunk) => {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        });

        req.on('end', async () => {
          try {
            const rawBody = Buffer.concat(chunks).toString('utf8');
            if (rawBody) {
              try {
                (req as any).body = JSON.parse(rawBody);
              } catch {
                (req as any).body = rawBody;
              }
            } else {
              (req as any).body = {};
            }

            const absolutePath = path.resolve(server.config.root, './api/index.ts');
            const module = await server.ssrLoadModule(absolutePath);
            if (typeof module.default === 'function') {
              return await module.default(req, res);
            }

            res.statusCode = 404;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, error: 'API route not found' }));
          } catch (err: unknown) {
            console.error('[API Dev Server Error]:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, error: 'Internal API Server Error', details: String(err) }));
          }
        });
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  for (const key in env) {
    if (!process.env[key]) {
      process.env[key] = env[key];
    }
  }

  return {
    plugins: [react(), apiDevMiddleware()],
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "./src"),
      },
    },
    server: {
      host: true,
    },
  };
});
