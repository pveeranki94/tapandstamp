import express from 'express';

export function createApp() {
  const app = express();
  app.use(express.json());

  app.get('/healthz', (_req, res) => {
    res.json({ ok: true });
  });

  app.get('/add/:merchantSlug', (req, res) => {
    res.status(501).json({
      error: 'Not implemented',
      route: 'add',
      merchantSlug: req.params.merchantSlug
    });
  });

  app.get('/stamp/:memberId', (req, res) => {
    res.status(501).json({
      error: 'Not implemented',
      route: 'stamp',
      memberId: req.params.memberId
    });
  });

  app.post('/redeem/:memberId', (req, res) => {
    res.status(501).json({
      error: 'Not implemented',
      route: 'redeem',
      memberId: req.params.memberId
    });
  });

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
