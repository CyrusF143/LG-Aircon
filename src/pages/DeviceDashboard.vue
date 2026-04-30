<template>
  <q-page class="q-pa-md">
    <div class="q-gutter-md">
      <!-- Header with Back Button -->
      <!-- <q-card class="bg-primary text-white">
        <q-toolbar>
          <q-btn flat round dense icon="arrow_back" @click="goBack" />
          <q-toolbar-title>
            <div class="ellipsis">
              <q-icon name="devices" size="sm" class="q-mr-xs" />
              {{ deviceName }}
            </div>
            <div class="text-caption text-blue-2">
              <q-icon name="bolt" size="xs" class="q-mr-xs" />Energy Monitor
            </div>
          </q-toolbar-title>
          <q-btn flat round icon="attach_money" @click="showBillCalculator = true">
            <q-tooltip>Calculate Electricity Bill</q-tooltip>
          </q-btn>
          <q-btn flat round icon="refresh" @click="refreshAll" :loading="loading">
            <q-tooltip>Refresh All Data</q-tooltip>
          </q-btn>
        </q-toolbar>
      </q-card> -->


      <q-card class="bg-primary text-white sticky-header">
        <q-card-section>
          <div class="row items-center no-wrap">
            <q-btn flat dense round icon="arrow_back" @click="goBack" class="q-mr-sm" />
            <div class="ellipsis">
              <div class="text-subtitle1 text-weight-bold ellipsis">
                <q-icon name="devices" size="xs" class="q-mr-xs" />
                {{ deviceName }}
              </div>
              <div class="text-caption">{{ deviceType }}</div>
            </div>
            <q-space />

            <!-- NEW: AI Insights Button -->
            <q-btn flat round dense icon="psychology" @click="goToAIInsights" class="pulse-button">
              <q-tooltip>AI-Powered Insights</q-tooltip>
              <q-badge color="purple" floating>AI</q-badge>
            </q-btn>

            <q-btn flat round dense icon="history" @click="router.push({ name: 'bill-history' })">
              <q-tooltip>Bill History</q-tooltip>
            </q-btn>
            <q-btn flat round dense icon="attach_money" @click="showBillCalculator = true">
              <q-tooltip>Calculate Electricity Bill</q-tooltip>
            </q-btn>
            <q-btn flat round dense icon="refresh" @click="refreshAll" :loading="loading">
              <q-tooltip>Refresh All Data</q-tooltip>
            </q-btn>
            <ProfileMenu />
          </div>
        </q-card-section>
      </q-card>

      <!-- Electricity Bill Calculator Modal -->
      <BillCalculatorModal v-model="showBillCalculator" :energy-stats="energyStats"
        :display-date-range="displayDateRange" />

      <!-- Device Status Cards -->
      <div class="row q-col-gutter-sm q-mb-md" v-if="deviceStatus">
        <div class="col-12 col-sm-6 col-md-3">
          <q-card class="stat-card-modern stat-card">
            <q-card-section class="q-pa-sm">
              <div class="text-caption text-grey-7 q-mb-xs">Current Temperature</div>
              <div class="row items-center no-wrap">
                <div class="col">
                  <div class="text-h5 text-primary text-weight-bold">
                    {{ deviceStatus.temperature?.currentTemperature || '--' }}°{{ deviceStatus.temperature?.unit || 'C'
                    }}
                  </div>
                  <div class="text-caption text-grey-6">Target: {{ deviceStatus.temperature?.targetTemperature || '--'
                    }}°</div>
                </div>
                <div class="col-auto"><q-icon name="thermostat" size="32px" color="primary" style="opacity: 0.3" />
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-12 col-sm-6 col-md-3">
          <q-card class="stat-card-modern stat-card">
            <q-card-section class="q-pa-sm">
              <div class="text-caption text-grey-7 q-mb-xs">Operation Mode</div>
              <div class="row items-center no-wrap">
                <div class="col">
                  <div class="text-h5 text-positive text-weight-bold">{{ deviceStatus.airConJobMode?.currentJobMode ||
                    'OFF' }}</div>
                  <div class="text-caption text-grey-6">{{ deviceStatus.runState?.currentState || 'STANDBY' }}</div>
                </div>
                <div class="col-auto"><q-icon name="ac_unit" size="32px" color="positive" style="opacity: 0.3" /></div>
              </div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-12 col-sm-6 col-md-3">
          <q-card class="stat-card-modern stat-card">
            <q-card-section class="q-pa-sm">
              <div class="text-caption text-grey-7 q-mb-xs">Fan Speed</div>
              <div class="row items-center no-wrap">
                <div class="col">
                  <div class="text-h5 text-info text-weight-bold">{{ deviceStatus.airFlow?.windStrength || 'AUTO' }}
                  </div>
                  <div class="text-caption text-grey-6">Step: {{ deviceStatus.airFlow?.windStep || '0' }}</div>
                </div>
                <div class="col-auto"><q-icon name="air" size="32px" color="info" style="opacity: 0.3" /></div>
              </div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-12 col-sm-6 col-md-3">
          <q-card class="stat-card-modern stat-card">
            <q-card-section class="q-pa-sm">
              <div class="text-caption text-grey-7 q-mb-xs">Power Status</div>
              <div class="row items-center no-wrap">
                <div class="col">
                  <div class="text-h6 text-weight-bold"
                    :class="deviceStatus.operation?.airConOperationMode === 'POWER_ON' ? 'text-positive' : 'text-grey'">
                    {{ deviceStatus.operation?.airConOperationMode?.replace('_', ' ') || 'UNKNOWN' }}
                  </div>
                  <div class="text-caption text-grey-6">Display: {{ deviceStatus.display?.light ? 'ON' : 'OFF' }}</div>
                </div>
                <div class="col-auto">
                  <q-icon name="power_settings_new" size="32px"
                    :color="deviceStatus.operation?.airConOperationMode === 'POWER_ON' ? 'positive' : 'grey'"
                    style="opacity: 0.3" />
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="!deviceStatus" class="row q-col-gutter-sm q-mb-md">
        <div class="col-3" v-for="i in 4" :key="i">
          <q-card flat bordered>
            <q-card-section class="q-pa-sm">
              <q-skeleton type="text" width="60%" />
              <q-skeleton type="text" class="text-h5" width="80%" />
              <q-skeleton type="text" width="50%" />
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- Energy Data Section -->
      <div class="energy-section">

        <!-- Section header + stat chips -->
        <div class="energy-header">
          <div class="energy-header-left">
            <div class="energy-header-icon">
              <q-icon name="bolt" size="22px" color="white" />
            </div>
            <div>
              <div class="energy-title">Energy Consumption</div>
              <div class="energy-subtitle">Monitor your AC power usage</div>
            </div>
          </div>

          <!-- Stat chips -->
          <div class="energy-stats" v-if="energyStats">
            <div class="energy-stat-chip">
              <div class="energy-stat-value" style="color:#7dd3fc">{{ energyStats.total }}</div>
              <div class="energy-stat-label">Total kWh</div>
            </div>
            <div class="energy-stat-divider" />
            <div class="energy-stat-chip">
              <div class="energy-stat-value" style="color:#86efac">{{ energyStats.average }}</div>
              <div class="energy-stat-label">Avg / day</div>
            </div>
            <div class="energy-stat-divider" />
            <div class="energy-stat-chip">
              <div class="energy-stat-value" style="color:#d8b4fe">{{ energyStats.daysActive }}</div>
              <div class="energy-stat-label">Days Active</div>
            </div>
            <div class="energy-stat-divider" />
            <div class="energy-stat-chip">
              <div class="energy-stat-value" style="color:#fca5a5">{{ energyStats.maxDayKwh }}</div>
              <div class="energy-stat-label">Peak kWh</div>
            </div>
          </div>
        </div>

        <!-- Body: calendar + chart/list -->
        <div class="energy-body">

          <!-- Left: Date Range Picker -->
          <div class="energy-calendar-panel">
            <div class="energy-panel-label">
              <q-icon name="date_range" size="15px" class="q-mr-xs text-primary" />
              Select Date Range
            </div>
            <div ref="calendarWrapRef">
              <q-select v-model="periodType" :options="periodOptions" outlined dense emit-value map-options
                behavior="menu" :style="{ width: calendarWidth }" class="q-mb-sm"
                @update:model-value="onPeriodTypeChange">
                <template v-slot:prepend><q-icon name="event" /></template>
              </q-select>
              <q-date v-if="periodType === 'DAILY'" v-model="dateRangeModel" range minimal
                @update:model-value="onDateRangeChange" />
              <MonthRangePicker v-else-if="periodType === 'MONTHLY'" v-model="monthRangeModel"
                @update:model-value="onMonthRangeChange" />
            </div>
          </div>

          <!-- Right: Chart / List -->
          <div class="energy-chart-panel">

            <div v-if="energyData.length > 0">
              <!-- Toolbar -->
              <div class="energy-chart-toolbar">
                <div class="energy-usage-label">
                  <q-icon name="electric_bolt" size="16px" class="q-mr-xs text-amber" />
                  Energy Usage
                </div>
                <q-btn-toggle v-model="viewMode" toggle-color="primary" :options="[
                  { label: 'Chart', value: 'chart' },
                  { label: 'List', value: 'list' }
                ]" size="sm" dense unelevated />
              </div>

              <!-- List View -->
              <div v-if="viewMode === 'list'" class="energy-list-scroll">
                <div v-for="data in energyData" :key="data.fullDate" class="energy-list-row">
                  <span class="energy-list-date">{{ data.date }}</span>
                  <div class="energy-list-bar-wrap">
                    <q-linear-progress
                      :value="maxEnergy > 0 ? (data.energy / 1000) / maxEnergy : 0"
                      color="primary" track-color="blue-1" size="8px"
                      rounded class="energy-list-bar" />
                  </div>
                  <q-badge
                    :color="data.energy > 0 ? 'positive' : 'grey-5'"
                    :label="data.energyKwh + ' kWh'"
                    class="energy-list-badge"
                  />
                </div>
              </div>

              <!-- Chart View -->
              <div v-else class="line-chart-container">
                <svg class="line-chart" viewBox="0 0 600 220" preserveAspectRatio="none">
                  <line v-for="i in 5" :key="'grid-' + i" :x1="50" :y1="i * 40" :x2="580" :y2="i * 40"
                    stroke="#e8eef5" stroke-width="1" />
                  <text v-for="(data, index) in energyData" :key="'label-' + index" :x="getXPosition(index)" y="215"
                    text-anchor="middle" font-size="10" fill="#999">{{ index % labelInterval === 0 ? data.date : '' }}</text>
                  <text v-for="i in 6" :key="'ylabel-' + i" x="45" :y="200 - (i - 1) * 40 + 5" text-anchor="end"
                    font-size="10" fill="#999">{{ ((maxEnergy / 5) * (i - 1)).toFixed(1) }}</text>
                  <polyline :points="linePoints" fill="none" stroke="#1976d2" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" />
                  <polygon :points="areaPoints" fill="rgba(25, 118, 210, 0.08)" />
                  <circle v-for="(data, index) in energyData" :key="'point-' + index"
                    :cx="getXPosition(index)" :cy="getYPosition(data.energy)"
                    r="4" :fill="data.energy > 0 ? '#1976d2' : '#ccc'" stroke="white" stroke-width="2">
                    <title>{{ data.date }}: {{ data.energyKwh }} kWh</title>
                  </circle>
                </svg>
              </div>
            </div>

            <!-- Loading -->
            <div v-else-if="loadingEnergy" class="energy-state-center">
              <q-spinner size="40px" color="primary" />
              <div class="q-mt-sm text-grey-6 text-caption">Loading energy data...</div>
            </div>

            <!-- Empty -->
            <div v-else class="energy-state-center">
              <div class="energy-empty-icon">
                <q-icon name="analytics" size="32px" color="blue-3" />
              </div>
              <div class="energy-empty-title">No data yet</div>
              <div class="energy-empty-sub">Select a date range to view energy usage</div>
            </div>

          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useDeviceStore } from 'src/stores/deviceStore';
import { useAuthStore } from 'src/stores/authStore';
import ProfileMenu from 'src/components/ProfileMenu.vue';
import BillCalculatorModal from 'src/components/BillCalculatorModal.vue';
import MonthRangePicker from 'src/components/MonthRangePicker.vue';

const router = useRouter();
const $q = useQuasar();
const deviceStore = useDeviceStore();
const authStore = useAuthStore();

const deviceId = ref(deviceStore.selectedDevice?.deviceId || '');
const deviceName = ref(deviceStore.selectedDevice?.name || 'Device');
const deviceType = ref(deviceStore.selectedDevice?.type || 'Unknown');

const baseUrl = 'https://api-kic.lgthinq.com';
const patToken = ref('');
const country = ref('PH');
const clientId = 'quasar-dashboard-001';
const apiKey = 'v6GFvkweNo7DK7yD3ylIZ9w52aKBU0eJ7wLXkSR3';

const loading = ref(false);
const loadingEnergy = ref(false);
const deviceStatus = ref(null);
const energyData = ref([]);
const viewMode = ref('list');
const periodType = ref('DAILY');
const periodOptions = [
  { label: 'Daily', value: 'DAILY' },
  { label: 'Monthly', value: 'MONTHLY' }
];
const dateRangeModel = ref({ from: getDefaultStartDate(true), to: getDefaultEndDate(true) });
const monthRangeModel = ref({ from: new Date(new Date().getFullYear(), new Date().getMonth(), 1), to: new Date(new Date().getFullYear(), new Date().getMonth(), 1) });
const dateRange = ref({ startDate: getDefaultStartDate(), endDate: getDefaultEndDate() });

const showBillCalculator = ref(false);

const calendarWrapRef = ref(null);
const calendarWidth = ref('auto');

// Formatted date range string for display in the bill result
const displayDateRange = computed(() => {
  if (periodType.value === 'DAILY' && dateRangeModel.value?.from && dateRangeModel.value?.to) {
    return `${dateRangeModel.value.from} – ${dateRangeModel.value.to}`;
  } else if (periodType.value === 'MONTHLY' && monthRangeModel.value?.from && monthRangeModel.value?.to) {
    const fmt = (d) => `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}`;
    return `${fmt(monthRangeModel.value.from)} – ${fmt(monthRangeModel.value.to)}`;
  }
  return '';
});

const measureCalendarWidth = () => {
  nextTick(() => {
    if (calendarWrapRef.value) {
      const cal = calendarWrapRef.value.querySelector('.q-date');
      if (cal) calendarWidth.value = cal.offsetWidth + 'px';
    }
  });
};

const generateMessageId = () => Math.random().toString(36).substring(2, 24);

function getDefaultStartDate(forDisplay = false) {
  const d = new Date(); d.setDate(1);
  return forDisplay ? formatDateForDisplay(d) : formatDateForAPI(d);
}
function getDefaultEndDate(forDisplay = false) {
  const d = new Date();
  return forDisplay ? formatDateForDisplay(d) : formatDateForAPI(d);
}
function formatDateForAPI(d) {
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
}
function formatDateForDisplay(d) {
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
}
function parseDisplayDate(s) { return s.replace(/\//g, ''); }
const onPeriodTypeChange = (type) => {
  if (type === 'DAILY') {
    dateRangeModel.value = { from: getDefaultStartDate(true), to: getDefaultEndDate(true) };
    dateRange.value = { startDate: getDefaultStartDate(), endDate: getDefaultEndDate() };
  } else {
    const now = new Date();
    monthRangeModel.value = { from: new Date(now.getFullYear(), now.getMonth(), 1), to: new Date(now.getFullYear(), now.getMonth(), 1) };
    const y = now.getFullYear(), m = String(now.getMonth() + 1).padStart(2, '0');
    dateRange.value = { startDate: `${y}${m}`, endDate: `${y}${m}` };
  }
  // Save to store
  deviceStore.setDateRange(dateRange.value, type);
  fetchEnergyData();
  measureCalendarWidth();
};

const onDateRangeChange = (v) => {
  if (v?.from && v?.to) {
    const from = new Date(v.from.replace(/\//g, '-'));
    const to = new Date(v.to.replace(/\//g, '-'));
    const diffDays = Math.round((to - from) / (1000 * 60 * 60 * 24)) + 1;

    if (diffDays > 32) {
      $q.notify({
        type: 'warning',
        message: `Selected range is ${diffDays} days. Please select up to 32 days to match your billing period.`,
        icon: 'event_busy',
        timeout: 3000
      });
      dateRangeModel.value = { from: getDefaultStartDate(true), to: getDefaultEndDate(true) };
      dateRange.value.startDate = getDefaultStartDate();
      dateRange.value.endDate = getDefaultEndDate();
      return;
    }

    dateRange.value.startDate = parseDisplayDate(v.from);
    dateRange.value.endDate = parseDisplayDate(v.to);
    // Save to store
    deviceStore.setDateRange(dateRange.value, periodType.value);
    fetchEnergyData();
  }
};

const onMonthRangeChange = (v) => {
  if (v?.from && v?.to) {
    const yf = v.from.getFullYear(), mf = String(v.from.getMonth() + 1).padStart(2, '0');
    const yt = v.to.getFullYear(), mt = String(v.to.getMonth() + 1).padStart(2, '0');
    dateRange.value = { startDate: `${yf}${mf}`, endDate: `${yt}${mt}` };
    deviceStore.setDateRange(dateRange.value, periodType.value);
    fetchEnergyData();
  }
};


const labelInterval = computed(() => {
  const len = energyData.value.length;
  if (len <= 10) return 1;
  if (len <= 16) return 2;
  if (len <= 24) return 3;
  return 4;
});

const maxEnergy = computed(() => {
  if (!energyData.value.length) return 0;
  return Math.max(...energyData.value.map(d => d.energy)) / 1000;
});

const getXPosition = (i) => 50 + i * (530 / (energyData.value.length - 1 || 1));
const getYPosition = (e) => maxEnergy.value === 0 ? 200 : 200 - (e / 1000 / maxEnergy.value) * 200;

const linePoints = computed(() => energyData.value.map((d, i) => `${getXPosition(i)},${getYPosition(d.energy)}`).join(' '));
const areaPoints = computed(() => {
  const pts = energyData.value.map((d, i) => `${getXPosition(i)},${getYPosition(d.energy)}`).join(' ');
  return `${pts} ${getXPosition(energyData.value.length - 1)},200 ${getXPosition(0)},200`;
});

const energyStats = computed(() => {
  if (!energyData.value.length) return null;
  const total = energyData.value.reduce((s, d) => s + d.energy, 0);
  const active = energyData.value.filter(d => d.energy > 0).length;
  const avg = active > 0 ? total / active : 0;
  const max = energyData.value.reduce((m, d) => d.energy > m.energy ? d : m, energyData.value[0]);
  return {
    total: (total / 1000).toFixed(2),
    average: (avg / 1000).toFixed(2),
    daysActive: active,
    maxDayKwh: (max.energy / 1000).toFixed(2)
  };
});

const fetchDeviceStatus = async () => {
  try {
    const res = await fetch(`${baseUrl}/devices/${deviceId.value}/state`, {
      headers: { 'Authorization': `Bearer ${patToken.value}`, 'x-message-id': generateMessageId(), 'x-country': country.value, 'x-client-id': clientId, 'x-api-key': apiKey }
    });
    const data = await res.json();
    if (data.response) deviceStatus.value = data.response;
    else throw new Error(data.error?.message || 'Failed to fetch device status');
  } catch (err) {
    $q.notify({ type: 'negative', message: `Error loading status: ${err.message}`, icon: 'error' });
  }
};

const fetchEnergyData = async () => {
  loadingEnergy.value = true;
  try {
    const res = await fetch(`${baseUrl}/devices/energy/${deviceId.value}/usage?period=${periodType.value}&startDate=${dateRange.value.startDate}&endDate=${dateRange.value.endDate}`, {
      headers: { 'Authorization': `Bearer ${patToken.value}`, 'x-message-id': generateMessageId(), 'x-country': country.value, 'x-client-id': clientId, 'x-api-key': apiKey }
    });
    const data = await res.json();
    if (data.response?.result?.dataList) {
      energyData.value = data.response.result.dataList.map(item => {
        const d = item.usedDate;
        const label = periodType.value === 'DAILY'
          ? `${d.substring(4, 6)}/${d.substring(6, 8)}`
          : `${d.substring(0, 4)}/${d.substring(4, 6)}`;
        return { date: label, fullDate: d, energy: item.energyUsage, energyKwh: (item.energyUsage / 1000).toFixed(2) };
      });
      $q.notify({ type: 'positive', message: 'Energy data loaded successfully', icon: 'check_circle' });
    } else throw new Error('No energy data available');
  } catch (err) {
    $q.notify({ type: 'negative', message: `Error loading energy data: ${err.message}`, icon: 'error' });
  } finally {
    loadingEnergy.value = false;
  }
};

const refreshAll = async () => {
  loading.value = true;
  await fetchDeviceStatus();
  loading.value = false;
};

const goBack = () => router.push('/');


onMounted(async () => {
  if (!deviceStore.selectedDevice) {
    router.push('/'); return;
  }
  const credentials = await authStore.loadCredentials();
  if (!credentials) {
    $q.notify({ type: 'negative', message: 'No authentication token found. Please login again.', icon: 'error' });
    router.push('/signin'); return;
  }
  patToken.value = credentials.patToken;
  country.value = credentials.country;
  refreshAll();
  fetchEnergyData();
  measureCalendarWidth();
});


// Navigation to AI Insights
const goToAIInsights = () => {
  // Save current date range before navigating
  deviceStore.setDateRange(dateRange.value, periodType.value);
  router.push({
    name: 'ai-insights',
    params: { deviceId: deviceId.value },
    query: {
      name: deviceName.value,
      type: deviceType.value
    }
  });
};
</script>

<style scoped>
.bill-calculator-card {
  width: 90vw;
  max-width: 480px;
}

.stat-card {
  border-left: 3px solid #1976d2;
  transition: all 0.2s ease;
  height: 100%;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.line-chart-container {
  width: 100%;
  padding: 10px 0;
}

.line-chart {
  display: block;
  width: 100%;
  height: 280px;
}

.line-chart circle:hover {
  r: 6;
  cursor: pointer;
}


@keyframes pulse {

  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(156, 39, 176, 0.7);
  }

  50% {
    box-shadow: 0 0 0 8px rgba(156, 39, 176, 0);
  }
}

.pulse-button {
  animation: pulse 2s infinite;
}

.stat-card-modern {
  border-radius: 12px;
  background: linear-gradient(145deg, #fff, #f1f5f9);
}

/* ── Energy Section ── */
.energy-section {
  border-radius: 16px;
  background: white;
  border: 1px solid #e8eef5;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(25, 118, 210, 0.06);
}

/* Header */
.energy-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  padding: 16px 18px;
  background: linear-gradient(135deg, #1565c0 0%, #1976d2 60%, #1e88e5 100%);
}
.energy-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.energy-header-icon {
  width: 42px;
  height: 42px;
  border-radius: 11px;
  background: rgba(255,255,255,0.18);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.energy-title {
  font-size: 17px;
  font-weight: 700;
  color: white;
  line-height: 1.2;
}
.energy-subtitle {
  font-size: 12px;
  color: rgba(255,255,255,0.7);
}

/* Stat chips in header */
.energy-stats {
  display: flex;
  align-items: center;
  background: rgba(255,255,255,0.12);
  border-radius: 12px;
  padding: 8px 16px;
  gap: 16px;
  flex-wrap: wrap;
}
.energy-stat-chip {
  text-align: center;
}
.energy-stat-value {
  font-size: 18px;
  font-weight: 800;
  line-height: 1.1;
}
.energy-stat-label {
  font-size: 10px;
  color: rgba(255,255,255,0.75);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  margin-top: 2px;
}
.energy-stat-divider {
  width: 1px;
  height: 30px;
  background: rgba(255,255,255,0.25);
}

/* Body */
.energy-body {
  display: flex;
  gap: 0;
}

/* Calendar panel */
.energy-calendar-panel {
  width: 290px;
  flex-shrink: 0;
  border-right: 1px solid #e8eef5;
  padding: 18px 16px;
  background: #fafcff;
}

/* ── Mobile responsiveness ── */
@media (max-width: 599px) {
  .energy-header {
    flex-direction: column;
    align-items: flex-start;
    padding: 14px 16px;
  }

  .energy-stats {
    width: 100%;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    padding: 10px 12px;
  }

  .energy-stat-divider {
    display: none;
  }

  .energy-stat-chip {
    background: rgba(255,255,255,0.1);
    border-radius: 8px;
    padding: 6px 8px;
  }

  .energy-stat-value {
    font-size: 16px;
  }

  .energy-body {
    flex-direction: column;
  }

  .energy-calendar-panel {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid #e8eef5;
    padding: 14px 12px;
  }

  .energy-chart-panel {
    padding: 14px 12px;
    min-height: 260px;
  }

  .energy-list-scroll {
    max-height: 260px;
  }
}
.energy-panel-label {
  display: flex;
  align-items: center;
  font-size: 12px;
  font-weight: 600;
  color: #555;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 12px;
}

/* Chart panel */
.energy-chart-panel {
  flex: 1;
  padding: 18px 20px;
  min-height: 320px;
  display: flex;
  flex-direction: column;
}
.energy-chart-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}
.energy-usage-label {
  display: flex;
  align-items: center;
  font-size: 13px;
  font-weight: 600;
  color: #444;
}

/* List view */
.energy-list-scroll {
  flex: 1;
  overflow-y: auto;
  max-height: 320px;
  padding-right: 4px;
}
.energy-list-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 7px 4px;
  border-bottom: 1px solid #f0f4f8;
}
.energy-list-row:last-child { border-bottom: none; }
.energy-list-date {
  font-size: 13px;
  color: #555;
  width: 46px;
  flex-shrink: 0;
}
.energy-list-bar-wrap {
  flex: 1;
}
.energy-list-bar {
  border-radius: 99px;
}
.energy-list-badge {
  font-size: 11px;
  font-weight: 600;
  border-radius: 6px;
  flex-shrink: 0;
}

/* Empty / loading states */
.energy-state-center {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
}
.energy-empty-icon {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background: #e3f2fd;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
}
.energy-empty-title {
  font-size: 15px;
  font-weight: 600;
  color: #444;
  margin-bottom: 4px;
}
.energy-empty-sub {
  font-size: 12px;
  color: #aaa;
}

:deep(.q-date__view) {
  min-height: unset;
}

:deep(.q-date__calendar-days-container) {
  min-height: unset;
}
</style>
