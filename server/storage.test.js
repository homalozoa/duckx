import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createStorage } from './storage.js';

let dir;
let dataFile;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'doux-storage-'));
  dataFile = join(dir, 'data.json');
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe('createStorage', () => {
  it('initializes missing data file with empty records', async () => {
    const storage = createStorage(dataFile);

    await expect(storage.readData()).resolves.toEqual({ records: [] });
    await expect(readFile(dataFile, 'utf8')).resolves.toContain('"records": []');
  });

  it('adds records with id and ISO timestamps', async () => {
    const storage = createStorage(dataFile);

    const record = await storage.addRecord({
      weight: 320,
      date: '2026-05-20',
      time: '14:30',
      mood: 'happy',
      note: '喂食后',
      photo: ''
    });

    expect(record).toMatchObject({
      weight: 320,
      date: '2026-05-20',
      time: '14:30',
      mood: 'happy',
      note: '喂食后',
      photo: ''
    });
    expect(record.id).toEqual(expect.any(String));
    expect(record.createdAt).toEqual(expect.any(String));
    expect(record.updatedAt).toEqual(expect.any(String));

    await expect(storage.readData()).resolves.toEqual({ records: [record] });
  });

  it('updates records by id', async () => {
    const storage = createStorage(dataFile);
    const record = await storage.addRecord({
      weight: 320,
      date: '2026-05-20',
      time: '14:30',
      mood: 'happy',
      note: '喂食后',
      photo: ''
    });

    const updated = await storage.updateRecord(record.id, { weight: 335, mood: 'active' });

    expect(updated.weight).toBe(335);
    expect(updated.mood).toBe('active');
    expect(updated.id).toBe(record.id);
    expect(updated.updatedAt).not.toBe(record.updatedAt);
  });

  it('deletes records by id', async () => {
    const storage = createStorage(dataFile);
    const record = await storage.addRecord({
      weight: 320,
      date: '2026-05-20',
      time: '14:30',
      mood: 'happy',
      note: '喂食后',
      photo: ''
    });

    await expect(storage.deleteRecord(record.id)).resolves.toBe(true);
    await expect(storage.readData()).resolves.toEqual({ records: [] });
  });

  it('throws when data file contains invalid JSON', async () => {
    await writeFile(dataFile, '{ broken json', 'utf8');
    const storage = createStorage(dataFile);

    await expect(storage.readData()).rejects.toThrow('Data file is not valid JSON');
  });
});
