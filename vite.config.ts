import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

function apiDevMiddleware(): Plugin {
  return {
    name: 'api-dev-middleware',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith('/api/')) {
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

            const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
            const pathname = url.pathname;

            let filePath = '';
            if (pathname === '/api/health') filePath = '/api/health.ts';
            else if (pathname === '/api/auth/login') filePath = '/api/auth/login.ts';
            else if (pathname === '/api/auth/logout') filePath = '/api/auth/logout.ts';
            else if (pathname === '/api/auth/me') filePath = '/api/auth/me.ts';
            else if (pathname === '/api/events') filePath = '/api/events/index.ts';
            else if (pathname.startsWith('/api/events/')) filePath = '/api/events/[slug].ts';
            else if (pathname === '/api/registrations') filePath = '/api/registrations/index.ts';
            else if (pathname === '/api/certificates') filePath = '/api/certificates/index.ts';
            else if (pathname.startsWith('/api/certificates/verify/')) filePath = '/api/certificates/verify/[id].ts';
            else if (pathname === '/api/uploads/presigned-url') filePath = '/api/uploads/presigned-url.ts';
            else if (pathname === '/api/integrations/google/create-form') filePath = '/api/integrations/google/create-form.ts';
            else if (pathname === '/api/integrations/google/webhook') filePath = '/api/integrations/google/webhook.ts';
            else if (pathname === '/api/admin/audit-logs') filePath = '/api/admin/audit-logs.ts';
            else if (pathname === '/api/admin/users') filePath = '/api/admin/users.ts';

            if (filePath) {
              const absolutePath = path.resolve(server.config.root, '.' + filePath);
              const module = await server.ssrLoadModule(absolutePath);
              if (typeof module.default === 'function') {
                return await module.default(req, res);
              }
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
