<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { createRecord, deleteRecord, fetchRecords, updateRecord } from './api.js';

const moodOptions = [
  { value: 'happy', label: '开心', icon: '😊' },
  { value: 'sleepy', label: '犯困', icon: '😴' },
  { value: 'active', label: '活跃', icon: '🏊' },
  { value: 'sick', label: '不舒服', icon: '🤒' }
];

const records = ref([]);
const error = ref('');
const editingId = ref(null);
const form = reactive({
  weight: '',
  date: new Date().toISOString().slice(0, 10),
  time: new Date().toTimeString().slice(0, 5),
  mood: 'happy',
  note: '',
  photo: ''
});

const sortedRecords = computed(() => {
  return [...records.value].sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));
});

const chartRecords = computed(() => [...sortedRecords.value].reverse().slice(-7));
const latestRecord = computed(() => sortedRecords.value[0]);
const previousRecord = computed(() => sortedRecords.value[1]);
const trend = computed(() => {
  if (!latestRecord.value || !previousRecord.value) {
    return '—';
  }

  const diff = latestRecord.value.weight - previousRecord.value.weight;
  return `${diff >= 0 ? '+' : ''}${diff}g`;
});

const calendarDays = computed(() => {
  const days = new Map();
  for (const record of records.value) {
    days.set(record.date, (days.get(record.date) || 0) + 1);
  }
  return [...days.entries()].sort(([a], [b]) => b.localeCompare(a)).slice(0, 14);
});

function moodIcon(value) {
  return moodOptions.find((option) => option.value === value)?.icon || '🦆';
}

function resetForm() {
  editingId.value = null;
  form.weight = '';
  form.date = new Date().toISOString().slice(0, 10);
  form.time = new Date().toTimeString().slice(0, 5);
  form.mood = 'happy';
  form.note = '';
  form.photo = '';
}

async function loadRecords() {
  error.value = '';
  try {
    records.value = await fetchRecords();
  } catch (err) {
    error.value = err.message;
  }
}

async function submitForm() {
  error.value = '';
  const payload = {
    weight: Number(form.weight),
    date: form.date,
    time: form.time,
    mood: form.mood,
    note: form.note,
    photo: form.photo
  };

  try {
    if (editingId.value) {
      await updateRecord(editingId.value, payload);
    } else {
      await createRecord(payload);
    }
    resetForm();
    await loadRecords();
  } catch (err) {
    error.value = err.message;
  }
}

function editRecord(record) {
  editingId.value = record.id;
  form.weight = record.weight;
  form.date = record.date;
  form.time = record.time;
  form.mood = record.mood;
  form.note = record.note || '';
  form.photo = record.photo || '';
}

async function removeRecord(record) {
  error.value = '';
  try {
    await deleteRecord(record.id);
    await loadRecords();
  } catch (err) {
    error.value = err.message;
  }
}

function exportData() {
  window.location.href = '/api/export';
}

onMounted(loadRecords);
</script>

<template>
  <main class="app-shell">
    <section class="hero-card">
      <div class="hero-top">
        <div class="brand">
          <div class="duck-avatar">🦆</div>
          <div>
            <p class="eyebrow">Dopamine Manga Tracker</p>
            <h1>DouX 体重日记</h1>
          </div>
        </div>
        <button class="comic-button secondary" type="button" @click="exportData">导出 JSON</button>
      </div>

      <div v-if="error" class="error-card">⚠️ {{ error }}</div>

      <div class="dashboard-grid">
        <article class="stat-card yellow">
          <span>TODAY</span>
          <strong>{{ latestRecord ? latestRecord.weight : '—' }}</strong>
          <small>g</small>
        </article>
        <article class="stat-card purple">
          <span>RECORDS</span>
          <strong>{{ records.length }}</strong>
          <small>全部记录</small>
        </article>
        <article class="stat-card blue">
          <span>TREND</span>
          <strong>{{ trend }}</strong>
          <small>最近变化</small>
        </article>
      </div>

      <section class="panel chart-panel">
        <div class="panel-title">📊 体重趋势 (g)</div>
        <div v-if="chartRecords.length" class="chart-bars">
          <div v-for="record in chartRecords" :key="record.id" class="bar-wrap">
            <div class="bar-value">{{ record.weight }}</div>
            <div class="bar" :style="{ height: `${Math.max(20, Math.min(100, record.weight / 4))}%` }"></div>
            <div class="bar-label">{{ record.date.slice(5) }}</div>
          </div>
        </div>
        <p v-else class="empty-text">还没有记录，先给 DouX 量一次体重吧！</p>
      </section>

      <section class="content-grid">
        <form class="panel record-form" @submit.prevent="submitForm">
          <div class="panel-title">✦ {{ editingId ? '编辑记录' : '记录体重' }} ✦</div>
          <label>
            体重 (g)
            <input v-model="form.weight" type="number" min="1" required placeholder="例如 320" />
          </label>
          <div class="form-row">
            <label>
              日期
              <input v-model="form.date" type="date" required />
            </label>
            <label>
              时间
              <input v-model="form.time" type="time" required />
            </label>
          </div>
          <label>
            状态
            <select v-model="form.mood">
              <option v-for="option in moodOptions" :key="option.value" :value="option.value">
                {{ option.icon }} {{ option.label }}
              </option>
            </select>
          </label>
          <label>
            备注
            <textarea v-model="form.note" rows="3" placeholder="喂食后、游泳后、精神很好..."></textarea>
          </label>
          <div class="form-actions">
            <button class="comic-button" type="submit">{{ editingId ? '保存修改' : '+ 记录体重' }}</button>
            <button v-if="editingId" class="comic-button secondary" type="button" @click="resetForm">取消</button>
          </div>
        </form>

        <section class="panel calendar-panel">
          <div class="panel-title">📅 记录日历</div>
          <div v-if="calendarDays.length" class="calendar-list">
            <div v-for="[date, count] in calendarDays" :key="date" class="calendar-day">
              <span>{{ date }}</span>
              <strong>{{ count }} 次</strong>
            </div>
          </div>
          <p v-else class="empty-text">日历会在有记录后出现。</p>
        </section>
      </section>

      <section class="panel records-panel">
        <div class="panel-title">📝 最近记录</div>
        <div v-if="sortedRecords.length" class="record-list">
          <article v-for="record in sortedRecords" :key="record.id" class="record-item">
            <div class="record-mood">{{ moodIcon(record.mood) }}</div>
            <div class="record-main">
              <strong>{{ record.weight }}g</strong>
              <span>{{ record.date }} {{ record.time }}</span>
              <small>{{ record.note || '没有备注' }}</small>
            </div>
            <div class="record-actions">
              <button type="button" @click="editRecord(record)">编辑</button>
              <button type="button" @click="removeRecord(record)">删除</button>
            </div>
          </article>
        </div>
        <p v-else class="empty-text">还没有体重记录。</p>
      </section>
    </section>
  </main>
</template>
