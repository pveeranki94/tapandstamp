import request from 'supertest';
import { createApp } from '../src/index.js';

describe('API routes', () => {
  const app = createApp();

  it('reports health', async () => {
    const res = await request(app).get('/healthz');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it('returns 501 for add route', async () => {
    const res = await request(app).get('/add/demo-cafe');
    expect(res.status).toBe(501);
    expect(res.body).toMatchObject({ route: 'add', merchantSlug: 'demo-cafe' });
  });

  it('returns 501 for stamp route', async () => {
    const res = await request(app).get('/stamp/member-123');
    expect(res.status).toBe(501);
    expect(res.body).toMatchObject({ route: 'stamp', memberId: 'member-123' });
  });

  it('returns 501 for redeem route', async () => {
    const res = await request(app).post('/redeem/member-123');
    expect(res.status).toBe(501);
    expect(res.body).toMatchObject({ route: 'redeem', memberId: 'member-123' });
  });
});
