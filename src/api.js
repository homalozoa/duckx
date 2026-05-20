async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || '请求失败');
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export async function fetchRecords() {
  const data = await requestJson('/api/records');
  return data.records;
}

export async function createRecord(record) {
  const data = await requestJson('/api/records', {
    method: 'POST',
    body: JSON.stringify(record)
  });
  return data.record;
}

export async function updateRecord(id, record) {
  const data = await requestJson(`/api/records/${id}`, {
    method: 'PUT',
    body: JSON.stringify(record)
  });
  return data.record;
}

export async function deleteRecord(id) {
  await requestJson(`/api/records/${id}`, { method: 'DELETE' });
}
