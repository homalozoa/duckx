import { afterEach, describe, expect, it, vi } from 'vitest';
import { updateRecord } from './api.js';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('api client', () => {
  it('keeps JSON content type when sending admin password', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ record: { id: 'record-1', weight: 133 } })
    });

    await updateRecord('record-1', { weight: 133 }, 'secret');

    expect(fetchMock).toHaveBeenCalledWith('/api/records/record-1', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Password': 'secret'
      },
      body: JSON.stringify({ weight: 133 })
    });
  });
});
