<template>
  <q-page class="q-pa-md">
    <div class="q-gutter-md">
      <!-- Header with Back Button -->
      <q-card class="bg-primary text-white">
        <q-card-section>
          <div class="row items-center">
            <q-btn
              flat
              dense
              round
              icon="arrow_back"
              @click="goBack"
              class="q-mr-md"
            />
            <div>
              <div class="text-h5">
                <q-icon name="devices" size="sm" class="q-mr-sm" />
                {{ deviceName }}
              </div>
              <div class="text-subtitle2">{{ deviceType }}</div>
            </div>
            <q-space />
            <q-btn
              flat
              round
              icon="attach_money"
              @click="showBillCalculator = true"
            >
              <q-tooltip>Calculate Electricity Bill</q-tooltip>
            </q-btn>
            <q-btn
              flat
              round
              icon="refresh"
              @click="refreshAll"
              :loading="loading"
            >
              <q-tooltip>Refresh All Data</q-tooltip>
            </q-btn>
          </div>
        </q-card-section>
      </q-card>

      <!-- Electricity Bill Calculator Modal -->
      <q-dialog v-model="showBillCalculator">
        <q-card style="min-width: 400px">
          <q-card-section class="bg-primary text-white">
            <div class="text-h6">
              <q-icon name="attach_money" class="q-mr-sm" />
              Calculate Electricity Bill
            </div>
          </q-card-section>

          <q-card-section class="q-pt-md">
            <q-input
              v-model.number="billCalc.totalAmountDue"
              label="Household Total Amount Due"
              type="number"
              outlined
              prefix="₱"
              :rules="[val => val > 0 || 'Must be greater than 0']"
              class="q-mb-md"
            >
              <template v-slot:prepend>
                <q-icon name="receipt" />
              </template>
            </q-input>

            <q-input
              v-model.number="billCalc.totalKwhUsed"
              label="Household Total kWh Used"
              type="number"
              outlined
              suffix="kWh"
              :rules="[val => val > 0 || 'Must be greater than 0']"
              class="q-mb-md"
            >
              <template v-slot:prepend>
                <q-icon name="bolt" />
              </template>
            </q-input>

            <!-- Result Display -->
            <q-card v-if="calculatedBill" flat bordered class="bg-blue-1 q-pa-md">
              <div class="text-subtitle2 text-grey-8 q-mb-sm">AC Device Usage Cost</div>
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
          </q-card-section>

          <q-card-actions align="right">
            <q-btn flat label="Close" color="grey" v-close-popup />
            <q-btn
              label="Calculate"
              color="primary"
              @click="calculateBill"
              :disable="!billCalc.totalAmountDue || !billCalc.totalKwhUsed || !energyStats"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>

      <!-- Device Status Cards -->
      <div class="row q-col-gutter-sm q-mb-md" v-if="deviceStatus">
        <!-- Temperature Card -->
        <div class="col-12 col-sm-6 col-md-3">
          <q-card flat bordered class="stat-card">
            <q-card-section class="q-pa-sm">
              <div class="text-caption text-grey-7 q-mb-xs">Current Temperature</div>
              <div class="row items-center no-wrap">
                <div class="col">
                  <div class="text-h5 text-primary text-weight-bold">
                    {{ deviceStatus.temperature?.currentTemperature || '--' }}°{{ deviceStatus.temperature?.unit || 'C' }}
                  </div>
                  <div class="text-caption text-grey-6">
                    Target: {{ deviceStatus.temperature?.targetTemperature || '--' }}°
                  </div>
                </div>
                <div class="col-auto">
                  <q-icon name="thermostat" size="32px" color="primary" style="opacity: 0.3" />
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- Mode Card -->
        <div class="col-12 col-sm-6 col-md-3">
          <q-card flat bordered class="stat-card">
            <q-card-section class="q-pa-sm">
              <div class="text-caption text-grey-7 q-mb-xs">Operation Mode</div>
              <div class="row items-center no-wrap">
                <div class="col">
                  <div class="text-h5 text-positive text-weight-bold">
                    {{ deviceStatus.airConJobMode?.currentJobMode || 'OFF' }}
                  </div>
                  <div class="text-caption text-grey-6">
                    {{ deviceStatus.runState?.currentState || 'STANDBY' }}
                  </div>
                </div>
                <div class="col-auto">
                  <q-icon name="ac_unit" size="32px" color="positive" style="opacity: 0.3" />
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- Fan Speed Card -->
        <div class="col-12 col-sm-6 col-md-3">
          <q-card flat bordered class="stat-card">
            <q-card-section class="q-pa-sm">
              <div class="text-caption text-grey-7 q-mb-xs">Fan Speed</div>
              <div class="row items-center no-wrap">
                <div class="col">
                  <div class="text-h5 text-info text-weight-bold">
                    {{ deviceStatus.airFlow?.windStrength || 'AUTO' }}
                  </div>
                  <div class="text-caption text-grey-6">
                    Step: {{ deviceStatus.airFlow?.windStep || '0' }}
                  </div>
                </div>
                <div class="col-auto">
                  <q-icon name="air" size="32px" color="info" style="opacity: 0.3" />
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- Power Card -->
        <div class="col-12 col-sm-6 col-md-3">
          <q-card flat bordered class="stat-card">
            <q-card-section class="q-pa-sm">
              <div class="text-caption text-grey-7 q-mb-xs">Power Status</div>
              <div class="row items-center no-wrap">
                <div class="col">
                  <div class="text-h6 text-weight-bold" :class="deviceStatus.operation?.airConOperationMode === 'POWER_ON' ? 'text-positive' : 'text-grey'">
                    {{ deviceStatus.operation?.airConOperationMode?.replace('_', ' ') || 'UNKNOWN' }}
                  </div>
                  <div class="text-caption text-grey-6">
                    Display: {{ deviceStatus.display?.light ? 'ON' : 'OFF' }}
                  </div>
                </div>
                <div class="col-auto">
                  <q-icon
                    name="power_settings_new"
                    size="32px"
                    :color="deviceStatus.operation?.airConOperationMode === 'POWER_ON' ? 'positive' : 'grey'"
                    style="opacity: 0.3"
                  />
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

          <div class="row q-col-gutter-md">
            <!-- Date Range Picker -->
            <div class="col-12 col-md-4">
              <div class="text-subtitle2 q-mb-sm">Select Date Range</div>

              <!-- Period Type Selector -->
              <q-select
                v-model="periodType"
                :options="periodOptions"
                outlined
                dense
                emit-value
                map-options
                class="q-mb-sm"
                @update:model-value="onPeriodTypeChange"
              >
                <template v-slot:prepend>
                  <q-icon name="event" />
                </template>
              </q-select>

              <!-- Date Picker for Daily -->
              <q-date
                v-if="periodType === 'DAILY'"
                v-model="dateRangeModel"
                range
                minimal
                @update:model-value="onDateRangeChange"
              />

              <!-- Month Picker for Monthly -->
              <q-date
                v-else-if="periodType === 'MONTHLY'"
                v-model="monthRangeModel"
                range
                minimal
                emit-value
                default-view="Months"
                @update:model-value="onMonthRangeChange"
              />
            </div>

            <!-- Energy Statistics and Data -->
            <div class="col-12 col-md-8">
              <!-- Energy Statistics -->
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

              <!-- Energy Data List/Chart -->
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
                    size="sm"
                    dense
                    unelevated
                  />
                </div>

                <!-- List View -->
                <div v-if="viewMode === 'list'" style="max-height: 280px; overflow-y: auto;">
                  <q-list bordered separator dense>
                    <q-item v-for="data in energyData" :key="data.fullDate">
                      <q-item-section>
                        <q-item-label>{{ data.date }}</q-item-label>
                      </q-item-section>
                      <q-item-section side>
                        <q-badge
                          :color="data.energy > 0 ? 'positive' : 'grey'"
                          :label="data.energyKwh + ' kWh'"
                        />
                      </q-item-section>
                    </q-item>
                  </q-list>
                </div>

                <!-- Chart View -->
                <div v-else style="height: 280px; overflow-y: auto;">
                  <div class="line-chart-container">
                    <svg class="line-chart" viewBox="0 0 600 220" preserveAspectRatio="xMidYMid meet">
                      <!-- Grid lines -->
                      <line v-for="i in 5" :key="'grid-' + i"
                        :x1="50"
                        :y1="i * 40"
                        :x2="580"
                        :y2="i * 40"
                        stroke="#e0e0e0"
                        stroke-width="1"
                      />

                      <!-- X-axis labels -->
                      <text
                        v-for="(data, index) in energyData"
                        :key="'label-' + index"
                        :x="getXPosition(index)"
                        y="215"
                        text-anchor="middle"
                        font-size="10"
                        fill="#666"
                      >
                        {{ data.date }}
                      </text>

                      <!-- Y-axis labels -->
                      <text
                        v-for="i in 6"
                        :key="'ylabel-' + i"
                        x="45"
                        :y="200 - (i - 1) * 40 + 5"
                        text-anchor="end"
                        font-size="10"
                        fill="#666"
                      >
                        {{ ((maxEnergy / 5) * (i - 1)).toFixed(1) }}
                      </text>

                      <!-- Line path -->
                      <polyline
                        :points="linePoints"
                        fill="none"
                        stroke="#1976d2"
                        stroke-width="2"
                        stroke-linejoin="round"
                      />

                      <!-- Area fill -->
                      <polygon
                        :points="areaPoints"
                        fill="rgba(25, 118, 210, 0.1)"
                      />

                      <!-- Data points -->
                      <circle
                        v-for="(data, index) in energyData"
                        :key="'point-' + index"
                        :cx="getXPosition(index)"
                        :cy="getYPosition(data.energy)"
                        r="4"
                        :fill="data.energy > 0 ? '#1976d2' : '#c0c0c0'"
                        stroke="white"
                        stroke-width="2"
                      >
                        <title>{{ data.date }}: {{ data.energyKwh }} kWh</title>
                      </circle>
                    </svg>
                  </div>
                </div>
              </div>

              <!-- Loading State -->
              <div v-else-if="loadingEnergy" class="text-center q-pa-lg">
                <q-spinner size="50px" color="primary" />
                <div class="q-mt-md text-grey-7">Loading energy data...</div>
              </div>

              <!-- Empty State -->
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
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';

const route = useRoute();
const router = useRouter();
const $q = useQuasar();

// Props from route
const deviceId = ref(route.params.deviceId || '');
const deviceName = ref(route.query.name || 'Device');
const deviceType = ref(route.query.type || 'Unknown');

// API Configuration
const baseUrl = 'https://api-kic.lgthinq.com';
const patToken = ref(localStorage.getItem('patToken') || '');
const country = ref(localStorage.getItem('country') || 'PH');
const clientId = 'quasar-dashboard-001';
const apiKey = 'v6GFvkweNo7DK7yD3ylIZ9w52aKBU0eJ7wLXkSR3';

// State
const loading = ref(false);
const loadingEnergy = ref(false);
const deviceStatus = ref(null);
const energyData = ref([]);
const viewMode = ref('list');
const periodType = ref('DAILY');
const periodOptions = [
  { label: 'Daily', value: 'DAILY', icon: 'today' },
  { label: 'Monthly', value: 'MONTHLY', icon: 'calendar_month' }
];
const dateRangeModel = ref({
  from: getDefaultStartDate(true),
  to: getDefaultEndDate(true)
});
const monthRangeModel = ref({
  from: getCurrentMonth(),
  to: getCurrentMonth()
});
const dateRange = ref({
  startDate: getDefaultStartDate(),
  endDate: getDefaultEndDate()
});

// Bill Calculator State
const showBillCalculator = ref(false);
const billCalc = ref({
  totalAmountDue: null,
  totalKwhUsed: null
});
const calculatedBill = ref(null);
const ratePerKwh = ref(null);

// Generate random message ID
const generateMessageId = () => {
  return Math.random().toString(36).substring(2, 24);
};

// Get default date range (current month - first day to today)
function getDefaultStartDate(forDisplay = false) {
  const date = new Date();
  date.setDate(1);
  return forDisplay ? formatDateForDisplay(date) : formatDateForAPI(date);
}

function getDefaultEndDate(forDisplay = false) {
  const date = new Date();
  return forDisplay ? formatDateForDisplay(date) : formatDateForAPI(date);
}

function formatDateForAPI(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

function formatDateForDisplay(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}/${month}/${day}`;
}

function parseDisplayDate(dateStr) {
  return dateStr.replace(/\//g, '');
}

function getCurrentMonth() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}/${month}`;
}

// Handle period type change
const onPeriodTypeChange = (type) => {
  if (type === 'DAILY') {
    dateRangeModel.value = {
      from: getDefaultStartDate(true),
      to: getDefaultEndDate(true)
    };
    dateRange.value.startDate = getDefaultStartDate();
    dateRange.value.endDate = getDefaultEndDate();
  } else if (type === 'MONTHLY') {
    monthRangeModel.value = {
      from: getCurrentMonth(),
      to: getCurrentMonth()
    };
    const [year, month] = monthRangeModel.value.from.split('/');
    dateRange.value.startDate = `${year}${month}`;
    dateRange.value.endDate = `${year}${month}`;
  }
  fetchEnergyData();
};

// Handle date range change
const onDateRangeChange = (value) => {
  if (value?.from && value?.to) {
    dateRange.value.startDate = parseDisplayDate(value.from);
    dateRange.value.endDate = parseDisplayDate(value.to);
    fetchEnergyData();
  }
};

// Handle month range change
const onMonthRangeChange = (value) => {
  if (value?.from && value?.to) {
    const [yearFrom, monthFrom] = value.from.split('/');
    const [yearTo, monthTo] = value.to.split('/');
    dateRange.value.startDate = `${yearFrom}${monthFrom}`;
    dateRange.value.endDate = `${yearTo}${monthTo}`;
    fetchEnergyData();
  }
};

// Calculate max energy for line chart
const maxEnergy = computed(() => {
  if (energyData.value.length === 0) return 0;
  return Math.max(...energyData.value.map(d => d.energy)) / 1000;
});

// Get X position for line chart
const getXPosition = (index) => {
  const chartWidth = 530;
  const step = chartWidth / (energyData.value.length - 1 || 1);
  return 50 + (index * step);
};

// Get Y position for line chart
const getYPosition = (energy) => {
  if (maxEnergy.value === 0) return 200;
  const chartHeight = 200;
  const energyKwh = energy / 1000;
  return 200 - (energyKwh / maxEnergy.value) * chartHeight;
};

// Generate line points for SVG polyline
const linePoints = computed(() => {
  return energyData.value.map((data, index) => {
    return `${getXPosition(index)},${getYPosition(data.energy)}`;
  }).join(' ');
});

// Generate area points for SVG polygon
const areaPoints = computed(() => {
  const points = energyData.value.map((data, index) => {
    return `${getXPosition(index)},${getYPosition(data.energy)}`;
  }).join(' ');

  const lastX = getXPosition(energyData.value.length - 1);
  const firstX = getXPosition(0);
  return `${points} ${lastX},200 ${firstX},200`;
});

// Calculate energy statistics
const energyStats = computed(() => {
  if (energyData.value.length === 0) return null;

  const totalEnergy = energyData.value.reduce((sum, day) => sum + day.energy, 0);
  const daysWithUsage = energyData.value.filter(day => day.energy > 0).length;
  const avgDaily = daysWithUsage > 0 ? totalEnergy / daysWithUsage : 0;
  const maxDay = energyData.value.reduce((max, day) =>
    day.energy > max.energy ? day : max, energyData.value[0]
  );

  return {
    total: (totalEnergy / 1000).toFixed(2),
    average: (avgDaily / 1000).toFixed(2),
    daysActive: daysWithUsage,
    maxDayKwh: (maxDay.energy / 1000).toFixed(2)
  };
});

// Fetch device status
const fetchDeviceStatus = async () => {
  try {
    const url = `${baseUrl}/devices/${deviceId.value}/state`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${patToken.value}`,
        'x-message-id': generateMessageId(),
        'x-country': country.value,
        'x-client-id': clientId,
        'x-api-key': apiKey
      }
    });

    const data = await response.json();

    if (data.response) {
      deviceStatus.value = data.response;
    } else if (data.error) {
      throw new Error(data.error.message || 'Failed to fetch device status');
    } else {
      throw new Error('Failed to fetch device status');
    }
  } catch (err) {
    console.error('Status fetch error:', err);
    $q.notify({
      type: 'negative',
      message: `Error loading status: ${err.message}`,
      icon: 'error'
    });
  }
};

// Fetch energy data
const fetchEnergyData = async () => {
  loadingEnergy.value = true;

  try {
    const url = `${baseUrl}/devices/energy/${deviceId.value}/usage?period=${periodType.value}&startDate=${dateRange.value.startDate}&endDate=${dateRange.value.endDate}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${patToken.value}`,
        'x-message-id': generateMessageId(),
        'x-country': country.value,
        'x-client-id': clientId,
        'x-api-key': apiKey
      }
    });

    const data = await response.json();

    if (data.response?.result?.dataList) {
      energyData.value = data.response.result.dataList.map(item => {
        let dateLabel = '';
        if (periodType.value === 'DAILY') {
          dateLabel = `${item.usedDate.substring(4, 6)}/${item.usedDate.substring(6, 8)}`;
        } else if (periodType.value === 'MONTHLY') {
          dateLabel = `${item.usedDate.substring(0, 4)}/${item.usedDate.substring(4, 6)}`;
        }

        return {
          date: dateLabel,
          fullDate: item.usedDate,
          energy: item.energyUsage,
          energyKwh: (item.energyUsage / 1000).toFixed(2)
        };
      });

      $q.notify({
        type: 'positive',
        message: 'Energy data loaded successfully',
        icon: 'check_circle'
      });
    } else {
      throw new Error('No energy data available');
    }
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: `Error loading energy data: ${err.message}`,
      icon: 'error'
    });
  } finally {
    loadingEnergy.value = false;
  }
};

// Refresh all data
const refreshAll = async () => {
  loading.value = true;
  await Promise.all([
    fetchDeviceStatus()
  ]);
  loading.value = false;
};

// Go back to device list
const goBack = () => {
  router.push('/');
};

// Calculate electricity bill
const calculateBill = () => {
  if (!billCalc.value.totalAmountDue || !billCalc.value.totalKwhUsed || !energyStats.value) {
    $q.notify({
      type: 'warning',
      message: 'Please fill in all fields',
      icon: 'warning'
    });
    return;
  }

  // Formula: (Total Amount Due / Total kWh Used) * AC Device kWh
  ratePerKwh.value = (billCalc.value.totalAmountDue / billCalc.value.totalKwhUsed).toFixed(2);
  const deviceTotalKwh = parseFloat(energyStats.value.total);
  calculatedBill.value = (ratePerKwh.value * deviceTotalKwh).toFixed(2);

  $q.notify({
    type: 'positive',
    message: 'Bill calculated successfully!',
    icon: 'check_circle'
  });
};

// Load data on mount
onMounted(() => {
  if (!patToken.value) {
    $q.notify({
      type: 'negative',
      message: 'No authentication token found. Please login again.',
      icon: 'error'
    });
    router.push('/');
    return;
  }

  if (!deviceId.value) {
    $q.notify({
      type: 'negative',
      message: 'No device selected',
      icon: 'error'
    });
    router.push('/');
    return;
  }

  refreshAll();
  fetchEnergyData();
});
</script>

<style scoped>
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
  height: 100%;
  padding: 10px;
}

.line-chart {
  width: 100%;
  height: 100%;
}

.line-chart circle:hover {
  r: 6;
  cursor: pointer;
}
</style>
