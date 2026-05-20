import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from './index.js';

let dir;
let app;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'doux-api-'));
  app = createApp(join(dir, 'data.json'));
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe('records API', () => {
  it('returns empty records initially', async () => {
    const response = await request(app).get('/api/records').expect(200);

    expect(response.body).toEqual({ records: [] });
  });

  it('creates a record using grams', async () => {
    const response = await request(app)
      .post('/api/records')
      .send({ weight: 320, date: '2026-05-20', time: '14:30', mood: 'happy', note: '喂食后', photo: '' })
      .expect(201);

    expect(response.body.record).toMatchObject({ weight: 320, date: '2026-05-20', time: '14:30', mood: 'happy' });
    expect(response.body.record.id).toEqual(expect.any(String));

    const list = await request(app).get('/api/records').expect(200);
    expect(list.body.records).toHaveLength(1);
  });

  it('requires admin password when configured for creating records', async () => {
    const protectedApp = createApp(join(dir, 'protected-data.json'), { adminPassword: 'secret' });

    await request(protectedApp)
      .post('/api/records')
      .send({ weight: 320, date: '2026-05-20', time: '14:30', mood: 'happy' })
      .expect(401, { error: '管理密码不正确' });

    await request(protectedApp)
      .post('/api/records')
      .set('X-Admin-Password', 'wrong')
      .send({ weight: 320, date: '2026-05-20', time: '14:30', mood: 'happy' })
      .expect(401, { error: '管理密码不正确' });

    await request(protectedApp)
      .post('/api/records')
      .set('X-Admin-Password', 'secret')
      .send({ weight: 320, date: '2026-05-20', time: '14:30', mood: 'happy' })
      .expect(201);
  });

  it('requires admin password when configured for updating and deleting records', async () => {
    const protectedApp = createApp(join(dir, 'protected-data.json'), { adminPassword: 'secret' });
    const created = await request(protectedApp)
      .post('/api/records')
      .set('X-Admin-Password', 'secret')
      .send({ weight: 320, date: '2026-05-20', time: '14:30', mood: 'happy', note: '', photo: '' })
      .expect(201);

    const id = created.body.record.id;

    await request(protectedApp)
      .put(`/api/records/${id}`)
      .send({ weight: 335 })
      .expect(401, { error: '管理密码不正确' });

    await request(protectedApp)
      .put(`/api/records/${id}`)
      .set('X-Admin-Password', 'secret')
      .send({ weight: 335 })
      .expect(200);

    await request(protectedApp)
      .delete(`/api/records/${id}`)
      .expect(401, { error: '管理密码不正确' });

    await request(protectedApp)
      .delete(`/api/records/${id}`)
      .set('X-Admin-Password', 'secret')
      .expect(204);
  });

  it('rejects invalid weight', async () => {
    const response = await request(app)
      .post('/api/records')
      .send({ weight: 0, date: '2026-05-20', time: '14:30', mood: 'happy' })
      .expect(400);

    expect(response.body).toEqual({ error: '体重必须是大于 0 的克数' });
  });

  it('updates and deletes records', async () => {
    const created = await request(app)
      .post('/api/records')
      .send({ weight: 320, date: '2026-05-20', time: '14:30', mood: 'happy', note: '', photo: '' })
      .expect(201);

    const id = created.body.record.id;

    const updated = await request(app)
      .put(`/api/records/${id}`)
      .send({ weight: 335, mood: 'active' })
      .expect(200);

    expect(updated.body.record.weight).toBe(335);
    expect(updated.body.record.mood).toBe('active');

    await request(app).delete(`/api/records/${id}`).expect(204);

    const list = await request(app).get('/api/records').expect(200);
    expect(list.body.records).toEqual([]);
  });

  it('exports JSON data', async () => {
    await request(app)
      .post('/api/records')
      .send({ weight: 320, date: '2026-05-20', time: '14:30', mood: 'happy', note: '', photo: '' })
      .expect(201);

    const response = await request(app).get('/api/export').expect(200);

    expect(response.headers['content-disposition']).toContain('doux-data.json');
    expect(response.body.records).toHaveLength(1);
  });
});
