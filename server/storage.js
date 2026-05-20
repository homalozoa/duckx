import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';

const emptyData = { records: [] };

async function ensureDataFile(filePath) {
  try {
    await readFile(filePath, 'utf8');
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }

    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, `${JSON.stringify(emptyData, null, 2)}\n`, 'utf8');
  }
}

function normalizeData(value) {
  if (!value || !Array.isArray(value.records)) {
    return { records: [] };
  }

  return { records: value.records };
}

export function createStorage(filePath) {
  async function readData() {
    await ensureDataFile(filePath);

    try {
      const raw = await readFile(filePath, 'utf8');
      return normalizeData(JSON.parse(raw));
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error('Data file is not valid JSON');
      }

      throw error;
    }
  }

  async function writeData(data) {
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, `${JSON.stringify(normalizeData(data), null, 2)}\n`, 'utf8');
  }

  async function addRecord(input) {
    const data = await readData();
    const now = new Date().toISOString();
    const record = {
      id: randomUUID(),
      weight: input.weight,
      date: input.date,
      time: input.time,
      mood: input.mood,
      note: input.note ?? '',
      photo: input.photo ?? '',
      createdAt: now,
      updatedAt: now
    };

    data.records.push(record);
    await writeData(data);
    return record;
  }

  async function updateRecord(id, patch) {
    const data = await readData();
    const index = data.records.findIndex((record) => record.id === id);

    if (index === -1) {
      return null;
    }

    const nextUpdatedAt = new Date().toISOString();
    const updatedAt = nextUpdatedAt === data.records[index].updatedAt
      ? new Date(Date.parse(nextUpdatedAt) + 1).toISOString()
      : nextUpdatedAt;
    const updated = {
      ...data.records[index],
      ...patch,
      id,
      updatedAt
    };

    data.records[index] = updated;
    await writeData(data);
    return updated;
  }

  async function deleteRecord(id) {
    const data = await readData();
    const nextRecords = data.records.filter((record) => record.id !== id);

    if (nextRecords.length === data.records.length) {
      return false;
    }

    await writeData({ records: nextRecords });
    return true;
  }

  return { readData, writeData, addRecord, updateRecord, deleteRecord };
}
