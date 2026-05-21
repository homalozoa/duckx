function adminHeaders(adminPassword) {
  return adminPassword ? { 'X-Admin-Password': adminPassword } : {};
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers }
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

export async function createRecord(record, adminPassword) {
  const data = await requestJson('/api/records', {
    method: 'POST',
    headers: adminHeaders(adminPassword),
    body: JSON.stringify(record)
  });
  return data.record;
}

export async function updateRecord(id, record, adminPassword) {
  const data = await requestJson(`/api/records/${id}`, {
    method: 'PUT',
    headers: adminHeaders(adminPassword),
    body: JSON.stringify(record)
  });
  return data.record;
}

export async function deleteRecord(id, adminPassword) {
  await requestJson(`/api/records/${id}`, {
    method: 'DELETE',
    headers: adminHeaders(adminPassword)
  });
}
