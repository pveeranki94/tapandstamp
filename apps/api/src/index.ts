import 'dotenv/config';
import express, { Express } from 'express';
import addRouter from './routes/add.js';
import stampRouter from './routes/stamp.js';
import redeemRouter from './routes/redeem.js';

export function createApp(): Express {
  const app = express();
  app.use(express.json());

  app.get('/healthz', (_req, res) => {
    res.json({ ok: true });
  });

  // Mount route handlers
  app.use('/add', addRouter);
  app.use('/stamp', stampRouter);
  app.use('/redeem', redeemRouter);

  return app;
}

export function startServer(port = Number(process.env.PORT ?? 3000)) {
  const app = createApp();
  const server = app.listen(port, () => {
    console.log(`[api] listening on http://localhost:${port}`);
  });
  return server;
}

if (process.env.NODE_ENV !== 'test') {
  startServer();
}
