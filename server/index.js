import express from 'express';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createStorage } from './storage.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const defaultDataFile = join(__dirname, '..', 'data', 'data.json');
const moods = new Set(['happy', 'sleepy', 'active', 'sick']);

function validateRecord(input, partial = false) {
  if (!partial || input.weight !== undefined) {
    if (!Number.isFinite(input.weight) || input.weight <= 0) {
      return '体重必须是大于 0 的克数';
    }
  }

  if (!partial || input.date !== undefined) {
    if (typeof input.date !== 'string' || input.date.length === 0) {
      return '日期不能为空';
    }
  }

  if (!partial || input.time !== undefined) {
    if (typeof input.time !== 'string' || input.time.length === 0) {
      return '时间不能为空';
    }
  }

  if (!partial || input.mood !== undefined) {
    if (typeof input.mood !== 'string' || !moods.has(input.mood)) {
      return '状态必须是 happy、sleepy、active 或 sick';
    }
  }

  return null;
}

function pickRecordFields(input) {
  const output = {};

  for (const key of ['weight', 'date', 'time', 'mood', 'note', 'photo']) {
    if (input[key] !== undefined) {
      output[key] = input[key];
    }
  }

  return output;
}

export function createApp(dataFile = defaultDataFile) {
  const app = express();
  const storage = createStorage(dataFile);

  app.use(express.json({ limit: '2mb' }));

  app.get('/api/records', async (req, res, next) => {
    try {
      res.json(await storage.readData());
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/records', async (req, res, next) => {
    try {
      const error = validateRecord(req.body);
      if (error) {
        res.status(400).json({ error });
        return;
      }

      const record = await storage.addRecord(pickRecordFields(req.body));
      res.status(201).json({ record });
    } catch (error) {
      next(error);
    }
  });

  app.put('/api/records/:id', async (req, res, next) => {
    try {
      const error = validateRecord(req.body, true);
      if (error) {
        res.status(400).json({ error });
        return;
      }

      const record = await storage.updateRecord(req.params.id, pickRecordFields(req.body));
      if (!record) {
        res.status(404).json({ error: '记录不存在' });
        return;
      }

      res.json({ record });
    } catch (error) {
      next(error);
    }
  });

  app.delete('/api/records/:id', async (req, res, next) => {
    try {
      const deleted = await storage.deleteRecord(req.params.id);
      if (!deleted) {
        res.status(404).json({ error: '记录不存在' });
        return;
      }

      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/export', async (req, res, next) => {
    try {
      res.setHeader('Content-Disposition', 'attachment; filename="doux-data.json"');
      res.json(await storage.readData());
    } catch (error) {
      next(error);
    }
  });

  app.use((error, req, res, next) => {
    res.status(500).json({ error: error.message || '服务器错误' });
  });

  return app;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = process.env.PORT || 3001;
  createApp().listen(port, () => {
    console.log(`DouX API running on http://localhost:${port}`);
  });
}
