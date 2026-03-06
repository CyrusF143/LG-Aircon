<template>
  <q-page class="q-pa-md">
    <div class="q-gutter-md">
      <!-- Header with Back Button -->
      <q-card class="bg-primary text-white">
        <q-card-section>
          <div class="row items-center">
            <q-btn flat dense round icon="arrow_back" @click="goBack" class="q-mr-md" />
            <div>
              <div class="text-h5">
                <q-icon name="devices" size="sm" class="q-mr-sm" />
                {{ deviceName }}
              </div>
              <div class="text-subtitle2">{{ deviceType }}</div>
            </div>
            <q-space />
            <q-btn flat round icon="attach_money" @click="showBillCalculator = true">
              <q-tooltip>Calculate Electricity Bill</q-tooltip>
            </q-btn>
            <q-btn flat round icon="refresh" @click="refreshAll" :loading="loading">
              <q-tooltip>Refresh All Data</q-tooltip>
            </q-btn>
          </div>
        </q-card-section>
      </q-card>

      <!-- Electricity Bill Calculator Modal -->
      <q-dialog v-model="showBillCalculator" @hide="onDialogHide">
        <q-card class="bill-calculator-card">
          <q-card-section class="bg-primary text-white">
            <div class="text-h6">
              <q-icon name="attach_money" class="q-mr-sm" />
              Calculate Electricity Bill
            </div>
          </q-card-section>
          <q-card-section class="q-pt-md">
            <q-input v-model.number="billCalc.totalAmountDue" label="Household Total Amount Due" type="number" outlined prefix="₱" :rules="[val => val > 0 || 'Must be greater than 0']" class="q-mb-md">
              <template v-slot:prepend><q-icon name="receipt" /></template>
            </q-input>
            <q-input v-model.number="billCalc.totalKwhUsed" label="Household Total kWh Used" type="number" outlined suffix="kWh" :rules="[val => val > 0 || 'Must be greater than 0']" class="q-mb-md">
              <template v-slot:prepend><q-icon name="bolt" /></template>
            </q-input>

            <!-- Result Display -->
                          <div ref="billResultRef">
              <q-card v-if="calculatedBill" flat bordered class="bg-blue-1 q-pa-md">
                <div class="text-subtitle2 text-grey-8 q-mb-xs">AC Device Usage Cost</div>
                <div class="text-caption text-grey-6 q-mb-sm">
                  <q-icon name="date_range" size="xs" class="q-mr-xs" />
                  {{ displayDateRange }}
                </div>

                <!-- Household inputs summary -->
                <div class="row q-col-gutter-sm q-mb-sm">
                  <div class="col-6">
                    <div class="text-caption text-grey-7">Household Amount Due</div>
                    <div class="text-body2 text-weight-medium">₱{{ billCalc.totalAmountDue?.toLocaleString() }}</div>
                  </div>
                  <div class="col-6">
                    <div class="text-caption text-grey-7">Household Total kWh</div>
                    <div class="text-body2 text-weight-medium">{{ billCalc.totalKwhUsed?.toLocaleString() }} kWh</div>
                  </div>
                </div>

                <div class="row items-center justify-between">
                  <div>
                    <div class="text-caption text-grey-7">Rate per kWh</div>
                    <div class="text-body1 text-weight-medium">₱{{ ratePerKwh }}</div>
                  </div>
                  <div>
                    <div class="text-caption text-grey-7">Device Total kWh</div>
                    <div class="text-body1 text-weight-medium">{{ energyStats?.total || '0.00' }} kWh</div>
                  </div>
                </div>
                <q-separator class="q-my-md" />
                <div class="text-center">
                  <div class="text-caption text-grey-7">Your AC Electricity Cost</div>
                  <div class="text-h4 text-positive text-weight-bold">₱{{ calculatedBill }}</div>
                  <div class="text-caption text-grey-6">for the selected period</div>
                </div>
              </q-card>
            </div>
          </q-card-section>
          <q-card-actions align="right">
            <q-btn flat label="Close" color="grey" v-close-popup />
            <q-btn
              v-if="!calculatedBill"
              label="Calculate"
              color="primary"
              icon="calculate"
              @click="calculateBill"
              :disable="!billCalc.totalAmountDue || !billCalc.totalKwhUsed || !energyStats"
            />
            <q-btn
              v-else
              label="Save as Image"
              color="positive"
              icon="save_alt"
              @click="saveAsImage"
              :loading="savingImage"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>

      <!-- Device Status Cards -->
      <div class="row q-col-gutter-sm q-mb-md" v-if="deviceStatus">
        <div class="col-12 col-sm-6 col-md-3">
          <q-card flat bordered class="stat-card">
            <q-card-section class="q-pa-sm">
              <div class="text-caption text-grey-7 q-mb-xs">Current Temperature</div>
              <div class="row items-center no-wrap">
                <div class="col">
                  <div class="text-h5 text-primary text-weight-bold">
                    {{ deviceStatus.temperature?.currentTemperature || '--' }}°{{ deviceStatus.temperature?.unit || 'C' }}
                  </div>
                  <div class="text-caption text-grey-6">Target: {{ deviceStatus.temperature?.targetTemperature || '--' }}°</div>
                </div>
                <div class="col-auto"><q-icon name="thermostat" size="32px" color="primary" style="opacity: 0.3" /></div>
              </div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-12 col-sm-6 col-md-3">
          <q-card flat bordered class="stat-card">
            <q-card-section class="q-pa-sm">
              <div class="text-caption text-grey-7 q-mb-xs">Operation Mode</div>
              <div class="row items-center no-wrap">
                <div class="col">
                  <div class="text-h5 text-positive text-weight-bold">{{ deviceStatus.airConJobMode?.currentJobMode || 'OFF' }}</div>
                  <div class="text-caption text-grey-6">{{ deviceStatus.runState?.currentState || 'STANDBY' }}</div>
                </div>
                <div class="col-auto"><q-icon name="ac_unit" size="32px" color="positive" style="opacity: 0.3" /></div>
              </div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-12 col-sm-6 col-md-3">
          <q-card flat bordered class="stat-card">
            <q-card-section class="q-pa-sm">
              <div class="text-caption text-grey-7 q-mb-xs">Fan Speed</div>
              <div class="row items-center no-wrap">
                <div class="col">
                  <div class="text-h5 text-info text-weight-bold">{{ deviceStatus.airFlow?.windStrength || 'AUTO' }}</div>
                  <div class="text-caption text-grey-6">Step: {{ deviceStatus.airFlow?.windStep || '0' }}</div>
                </div>
                <div class="col-auto"><q-icon name="air" size="32px" color="info" style="opacity: 0.3" /></div>
              </div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-12 col-sm-6 col-md-3">
          <q-card flat bordered class="stat-card">
            <q-card-section class="q-pa-sm">
              <div class="text-caption text-grey-7 q-mb-xs">Power Status</div>
              <div class="row items-center no-wrap">
                <div class="col">
                  <div class="text-h6 text-weight-bold" :class="deviceStatus.operation?.airConOperationMode === 'POWER_ON' ? 'text-positive' : 'text-grey'">
                    {{ deviceStatus.operation?.airConOperationMode?.replace('_', ' ') || 'UNKNOWN' }}
                  </div>
                  <div class="text-caption text-grey-6">Display: {{ deviceStatus.display?.light ? 'ON' : 'OFF' }}</div>
                </div>
                <div class="col-auto">
                  <q-icon name="power_settings_new" size="32px" :color="deviceStatus.operation?.airConOperationMode === 'POWER_ON' ? 'positive' : 'grey'" style="opacity: 0.3" />
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
      <q-card>
        <q-card-section>
          <div class="text-h6 q-mb-md">
            <q-icon name="bolt" color="amber" class="q-mr-sm" />
            Energy Consumption
          </div>

          <div class="row q-col-gutter-md items-start">
            <!-- Date Range Picker -->
            <div class="col-12 col-md-4" style="align-self: flex-start;">
              <div class="text-subtitle2 q-mb-sm">Select Date Range</div>
              <div ref="calendarWrapRef" style="display: inline-block;">
                <q-select
                  v-model="periodType"
                  :options="periodOptions"
                  outlined dense emit-value map-options
                  :style="{ width: calendarWidth }"
                  class="q-mb-sm"
                  @update:model-value="onPeriodTypeChange"
                >
                  <template v-slot:prepend><q-icon name="event" /></template>
                </q-select>
                <q-date
                  v-if="periodType === 'DAILY'"
                  v-model="dateRangeModel"
                  range minimal
                  @update:model-value="onDateRangeChange"
                />
                <q-date
                  v-else-if="periodType === 'MONTHLY'"
                  v-model="monthRangeModel"
                  range minimal emit-value
                  default-view="Months"
                  @update:model-value="onMonthRangeChange"
                />
              </div>
            </div>

            <!-- Energy Statistics and Data -->
            <div class="col-12 col-md-8">
              <div v-if="energyStats" class="row q-col-gutter-sm q-mb-md">
                <div class="col-6 col-sm-3">
                  <q-card flat bordered>
                    <q-card-section class="text-center q-pa-sm">
                      <div class="text-h5 text-primary text-weight-bold">{{ energyStats.total }}</div>
                      <div class="text-caption text-grey-7">Total kWh</div>
                    </q-card-section>
                  </q-card>
                </div>
                <div class="col-6 col-sm-3">
                  <q-card flat bordered>
                    <q-card-section class="text-center q-pa-sm">
                      <div class="text-h5 text-positive text-weight-bold">{{ energyStats.average }}</div>
                      <div class="text-caption text-grey-7">Avg kWh/day</div>
                    </q-card-section>
                  </q-card>
                </div>
                <div class="col-6 col-sm-3">
                  <q-card flat bordered>
                    <q-card-section class="text-center q-pa-sm">
                      <div class="text-h5 text-purple text-weight-bold">{{ energyStats.daysActive }}</div>
                      <div class="text-caption text-grey-7">Days Active</div>
                    </q-card-section>
                  </q-card>
                </div>
                <div class="col-6 col-sm-3">
                  <q-card flat bordered>
                    <q-card-section class="text-center q-pa-sm">
                      <div class="text-h5 text-negative text-weight-bold">{{ energyStats.maxDayKwh }}</div>
                      <div class="text-caption text-grey-7">Peak Day</div>
                    </q-card-section>
                  </q-card>
                </div>
              </div>

              <div v-if="energyData.length > 0">
                <div class="row items-center justify-between q-mb-sm">
                  <div class="text-subtitle2">Daily Energy Usage (kWh)</div>
                  <q-btn-toggle
                    v-model="viewMode"
                    toggle-color="primary"
                    :options="[
                      {label: 'List', value: 'list', icon: 'list'},
                      {label: 'Chart', value: 'chart', icon: 'bar_chart'}
                    ]"
                    size="sm" dense unelevated
                  />
                </div>

                <!-- List View -->
                <div v-if="viewMode === 'list'" style="max-height: 280px; overflow-y: auto;">
                  <q-list bordered separator dense>
                    <q-item v-for="data in energyData" :key="data.fullDate">
                      <q-item-section><q-item-label>{{ data.date }}</q-item-label></q-item-section>
                      <q-item-section side>
                        <q-badge :color="data.energy > 0 ? 'positive' : 'grey'" :label="data.energyKwh + ' kWh'" />
                      </q-item-section>
                    </q-item>
                  </q-list>
                </div>

                <!-- Chart View -->
                <div v-else>
                  <div class="line-chart-container">
                    <svg class="line-chart" viewBox="0 0 600 220" preserveAspectRatio="none">
                      <line v-for="i in 5" :key="'grid-' + i" :x1="50" :y1="i * 40" :x2="580" :y2="i * 40" stroke="#e0e0e0" stroke-width="1" />
                      <text
                        v-for="(data, index) in energyData" :key="'label-' + index"
                        :x="getXPosition(index)" y="215"
                        text-anchor="middle" font-size="10" fill="#666"
                      >{{ index % labelInterval === 0 ? data.date : '' }}</text>
                      <text v-for="i in 6" :key="'ylabel-' + i" x="45" :y="200 - (i - 1) * 40 + 5" text-anchor="end" font-size="10" fill="#666">{{ ((maxEnergy / 5) * (i - 1)).toFixed(1) }}</text>
                      <polyline :points="linePoints" fill="none" stroke="#1976d2" stroke-width="2" stroke-linejoin="round" />
                      <polygon :points="areaPoints" fill="rgba(25, 118, 210, 0.1)" />
                      <circle v-for="(data, index) in energyData" :key="'point-' + index" :cx="getXPosition(index)" :cy="getYPosition(data.energy)" r="4" :fill="data.energy > 0 ? '#1976d2' : '#c0c0c0'" stroke="white" stroke-width="2">
                        <title>{{ data.date }}: {{ data.energyKwh }} kWh</title>
                      </circle>
                    </svg>
                  </div>
                </div>
              </div>

              <div v-else-if="loadingEnergy" class="text-center q-pa-lg">
                <q-spinner size="50px" color="primary" />
                <div class="q-mt-md text-grey-7">Loading energy data...</div>
              </div>

              <div v-else class="text-center q-pa-lg text-grey-7">
                <q-icon name="analytics" size="64px" color="grey-4" />
                <div class="q-mt-md">Select a date range to view energy data</div>
              </div>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useDeviceStore } from 'src/stores/deviceStore';

const router = useRouter();
const $q = useQuasar();
const deviceStore = useDeviceStore();

const deviceId = ref(deviceStore.selectedDevice?.deviceId || '');
const deviceName = ref(deviceStore.selectedDevice?.name || 'Device');
const deviceType = ref(deviceStore.selectedDevice?.type || 'Unknown');

const baseUrl = 'https://api-kic.lgthinq.com';
const patToken = ref(localStorage.getItem('patToken') || '');
const country = ref(localStorage.getItem('country') || 'PH');
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
const monthRangeModel = ref({ from: getCurrentMonth(), to: getCurrentMonth() });
const dateRange = ref({ startDate: getDefaultStartDate(), endDate: getDefaultEndDate() });

const showBillCalculator = ref(false);
const billCalc = ref({ totalAmountDue: null, totalKwhUsed: null });
const calculatedBill = ref(null);
const ratePerKwh = ref(null);
const savingImage = ref(false);
const billResultRef = ref(null);

const calendarWrapRef = ref(null);
const calendarWidth = ref('auto');

// Formatted date range string for display in the bill result
const displayDateRange = computed(() => {
  if (periodType.value === 'DAILY' && dateRangeModel.value?.from && dateRangeModel.value?.to) {
    return `${dateRangeModel.value.from} – ${dateRangeModel.value.to}`;
  } else if (periodType.value === 'MONTHLY' && monthRangeModel.value?.from && monthRangeModel.value?.to) {
    return `${monthRangeModel.value.from} – ${monthRangeModel.value.to}`;
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
  return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
}
function formatDateForDisplay(d) {
  return `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}`;
}
function parseDisplayDate(s) { return s.replace(/\//g, ''); }
function getCurrentMonth() {
  const d = new Date();
  return `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}`;
}

const onPeriodTypeChange = (type) => {
  if (type === 'DAILY') {
    dateRangeModel.value = { from: getDefaultStartDate(true), to: getDefaultEndDate(true) };
    dateRange.value = { startDate: getDefaultStartDate(), endDate: getDefaultEndDate() };
  } else {
    monthRangeModel.value = { from: getCurrentMonth(), to: getCurrentMonth() };
    const [y, m] = monthRangeModel.value.from.split('/');
    dateRange.value = { startDate: `${y}${m}`, endDate: `${y}${m}` };
  }
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
    fetchEnergyData();
  }
};

const onMonthRangeChange = (v) => {
  if (v?.from && v?.to) {
    const [yf, mf] = v.from.split('/');
    const [yt, mt] = v.to.split('/');
    dateRange.value = { startDate: `${yf}${mf}`, endDate: `${yt}${mt}` };
    fetchEnergyData();
  }
};

const onDialogHide = () => {
  calculatedBill.value = null;
  ratePerKwh.value = null;
  billCalc.value = { totalAmountDue: null, totalKwhUsed: null };
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
          ? `${d.substring(4,6)}/${d.substring(6,8)}`
          : `${d.substring(0,4)}/${d.substring(4,6)}`;
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

const calculateBill = () => {
  if (!billCalc.value.totalAmountDue || !billCalc.value.totalKwhUsed || !energyStats.value) {
    $q.notify({ type: 'warning', message: 'Please fill in all fields', icon: 'warning' });
    return;
  }
  ratePerKwh.value = (billCalc.value.totalAmountDue / billCalc.value.totalKwhUsed).toFixed(2);
  calculatedBill.value = (ratePerKwh.value * parseFloat(energyStats.value.total)).toFixed(2);
  $q.notify({ type: 'positive', message: 'Bill calculated successfully!', icon: 'check_circle' });
};

const saveAsImage = async () => {
  if (!billResultRef.value) return;
  savingImage.value = true;

  try {
    // Dynamically load html2canvas from CDN
    if (!window.html2canvas) {
      await new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
      });
    }

    const canvas = await window.html2canvas(billResultRef.value, {
      backgroundColor: '#ffffff',
      scale: 2
    });

    const link = document.createElement('a');
    link.download = `AC-Bill-${displayDateRange.value.replace(/\//g, '-').replace(' – ', '_to_')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();

    $q.notify({ type: 'positive', message: 'Image saved successfully!', icon: 'download' });
  } catch (err) {
    $q.notify({ type: 'negative', message: `Failed to save image: ${err.message}`, icon: 'error' });
  } finally {
    savingImage.value = false;
  }
};

onMounted(() => {
  if (!patToken.value) {
    $q.notify({ type: 'negative', message: 'No authentication token found. Please login again.', icon: 'error' });
    router.push('/signin'); return;
  }
  if (!deviceStore.selectedDevice) {
    router.push('/'); return;
  }
  refreshAll();
  fetchEnergyData();
  measureCalendarWidth();
});
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
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
.line-chart-container { width: 100%; padding: 10px 0; }
.line-chart { display: block; width: 100%; height: 280px; }
.line-chart circle:hover { r: 6; cursor: pointer; }
</style>
