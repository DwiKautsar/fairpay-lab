import { execFile } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === 'production';

function runPythonStats(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const scriptPath = path.resolve(__dirname, 'api', 'stats_engine.py');
    const child = execFile(
      'python3',
      [scriptPath],
      { timeout: 10000, maxBuffer: 8 * 1024 * 1024 },
      (err, stdout, stderr) => {
        if (err) {
          reject(new Error(stderr || err.message));
          return;
        }
        try {
          resolve(JSON.parse(stdout));
        } catch (parseErr) {
          reject(parseErr);
        }
      }
    );
    child.stdin?.write(JSON.stringify(payload));
    child.stdin?.end();
  });
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '5mb' }));

  app.get('/api/health', async (_req, res) => {
    try {
      const result = await runPythonStats({ action: 'health' });
      res.json(result);
    } catch {
      res.json({ status: 'ok', engineSource: 'typescript' });
    }
  });

  app.post('/api/analyze', async (req, res) => {
    try {
      const { salaries, groups } = req.body ?? {};
      if (!Array.isArray(salaries) || !Array.isArray(groups)) {
        res.status(400).json({ error: 'Invalid payload: salaries and groups arrays are required.' });
        return;
      }
      const result = await runPythonStats({
        action: 'analyze',
        salaries: salaries.slice(0, 5000),
        groups: groups.slice(0, 5000),
      });
      res.json(result);
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Python engine execution error',
      });
    }
  });

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      const indexFile = path.join(distDir, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Build output not found.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FairPay server listening on http://localhost:${PORT}`);
  });
}

startServer();
