<template>
  <q-page class="q-pa-md">
    <div class="q-gutter-md">
      <!-- Header -->
      <q-card class="bg-gradient-purple text-white">
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
            <div class="col">
              <div class="text-h5">
                <q-icon name="psychology" size="sm" class="q-mr-sm" />
                AI-Powered Insights
              </div>
              <div class="text-subtitle2 text-purple-2">
                {{ deviceName }} • {{ deviceType }}
              </div>
            </div>
            <q-space />
            <q-btn
              flat
              round
              icon="settings"
              @click="showApiKeyDialog = true"
            >
              <q-tooltip>API Settings</q-tooltip>
            </q-btn>
            <q-btn
              flat
              round
              icon="refresh"
              @click="getAIRecommendations"
              :loading="loadingRecommendations"
            >
              <q-tooltip>Refresh Analysis</q-tooltip>
            </q-btn>
            <ProfileMenu />
          </div>
        </q-card-section>
      </q-card>

      <!-- API Key Setup Dialog -->
      <q-dialog v-model="showApiKeyDialog" :maximized="$q.screen.lt.sm" transition-show="slide-up" transition-hide="slide-down">
        <q-card :style="$q.screen.lt.sm ? 'display:flex; flex-direction:column' : 'min-width: 400px; max-width: 560px; max-height: 90vh'">
          <q-card-section class="bg-purple text-white">
            <div class="row items-center">
              <div class="text-h6 col">
                <q-icon name="key" class="q-mr-sm" />
                Google Gemini API Settings
              </div>
              <q-btn v-if="$q.screen.lt.sm" flat round dense icon="close" color="white" v-close-popup />
            </div>
          </q-card-section>

          <q-scroll-area :style="$q.screen.lt.sm ? 'height: calc(100vh - 120px)' : 'max-height: calc(90vh - 130px)'" :thumb-style="{ width: '4px' }">

          <q-card-section>
            <div class="text-body2 q-mb-md">
              <strong>✨ 100% FREE!</strong> Configure your Google Gemini API settings and customize the AI prompt.
            </div>

            <q-input
              v-model="apiKeyInput"
              label="Google Gemini API Key"
              type="password"
              outlined
              hint="Default key provided. Change if needed."
              class="q-mb-md"
            >
              <template v-slot:prepend>
                <q-icon name="vpn_key" />
              </template>
            </q-input>

            <!-- Model Selection -->
            <q-select
              v-model="selectedModel"
              :options="availableModels"
              label="AI Model"
              outlined
              emit-value
              map-options
              class="q-mb-md"
              :loading="loadingModels"
            >
              <template v-slot:prepend>
                <q-icon name="model_training" />
              </template>
              <template v-slot:append>
                <q-btn
                  flat
                  dense
                  round
                  icon="refresh"
                  size="sm"
                  @click.stop="fetchAvailableModels"
                  :loading="loadingModels"
                >
                  <q-tooltip>Refresh available models</q-tooltip>
                </q-btn>
              </template>
              <template v-slot:option="scope">
                <q-item v-bind="scope.itemProps">
                  <q-item-section>
                    <q-item-label>{{ scope.opt.label }}</q-item-label>
                    <q-item-label caption>{{ scope.opt.description }}</q-item-label>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>

            <!-- Location Setting -->
            <q-input
              v-model="locationInput"
              label="Weather Location"
              outlined
              hint="City used to fetch outdoor temperature for AI analysis"
              class="q-mb-md"
            >
              <template v-slot:prepend>
                <q-icon name="location_on" />
              </template>
              <template v-slot:append>
                <q-btn
                  flat dense round icon="thermostat" size="sm"
                  @click.stop="fetchWeatherData"
                  :loading="loadingWeather"
                >
                  <q-tooltip>Test location & fetch weather</q-tooltip>
                </q-btn>
              </template>
            </q-input>

            <!-- Weather Preview -->
            <q-banner v-if="currentWeather" dense class="bg-blue-1 text-blue-9 q-mb-md" rounded>
              <template v-slot:avatar>
                <q-icon name="wb_sunny" color="orange" />
              </template>
              {{ currentWeather.location }}: {{ currentWeather.temperature }}°C, {{ currentWeather.humidity }}% humidity — {{ currentWeather.description }}
            </q-banner>

            <!-- Custom Prompt Input -->
            <div class="q-mb-md">
              <div class="text-subtitle2 q-mb-sm">AI Prompt Template</div>
              <q-input
                v-model="customPrompt"
                type="textarea"
                outlined
                rows="8"
                class="prompt-input"
              >
                <template v-slot:prepend>
                  <q-icon name="edit_note" />
                </template>
              </q-input>
            </div>

            <q-banner v-if="hasApiKey" dense class="bg-green-1 text-green-9" rounded>
              <template v-slot:avatar>
                <q-icon name="check_circle" color="green" />
              </template>
              <div>
                API key is configured ✅ (1,500 free requests/day)<br>
                <span class="text-caption">Current model: {{ availableModels.find(m => m.value === selectedModel)?.label }}</span>
              </div>
            </q-banner>
          </q-card-section>
          </q-scroll-area>

          <q-card-actions :vertical="$q.screen.lt.sm" :align="$q.screen.lt.sm ? 'stretch' : 'right'" class="q-pa-md" style="border-top: 1px solid #eee">
            <q-btn
              label="Save Settings"
              color="purple"
              unelevated
              @click="saveApiKey"
              :class="$q.screen.lt.sm ? 'q-mb-xs' : ''"
            />
            <q-btn
              v-if="hasApiKey"
              label="Reset to Defaults"
              color="grey"
              flat
              @click="resetToDefaults"
              :class="$q.screen.lt.sm ? 'q-mb-xs' : ''"
            />
            <q-btn flat label="Cancel" v-close-popup />
          </q-card-actions>
        </q-card>
      </q-dialog>

      <!-- Active Alerts Banner -->
      <q-card v-if="activeAlerts.length > 0" class="bg-orange-1 border-left-warning">
        <q-card-section>
          <div class="row items-center q-mb-sm">
            <q-icon name="notifications_active" color="warning" size="sm" class="q-mr-sm" />
            <span class="text-subtitle1 text-weight-bold">Active Alerts ({{ activeAlerts.length }})</span>
            <q-space />
            <q-btn
              flat
              dense
              size="sm"
              label="Dismiss All"
              @click="dismissAllAlerts"
              color="grey-7"
            />
          </div>

          <div class="q-gutter-sm">
            <q-banner
              v-for="alert in activeAlerts"
              :key="alert.id"
              dense
              inline-actions
              class="bg-white"
              rounded
            >
              <template v-slot:avatar>
                <q-icon
                  :name="alert.icon"
                  :color="alert.type === 'critical' ? 'negative' : alert.type === 'warning' ? 'warning' : 'info'"
                />
              </template>
              <div>
                <div class="text-weight-bold">{{ alert.title }}</div>
                <div class="text-caption text-grey-8">{{ alert.message }}</div>
                <div v-if="alert.action" class="text-caption text-positive q-mt-xs">
                  💡 {{ alert.action }}
                </div>
              </div>
              <template v-slot:action>
                <q-btn
                  flat
                  dense
                  round
                  icon="close"
                  size="sm"
                  @click="dismissAlert(alert.id)"
                />
              </template>
            </q-banner>
          </div>
        </q-card-section>
      </q-card>

      <!-- Quick Stats Summary -->
      <q-card v-if="energyStats" flat bordered>
        <q-card-section>
          <div class="row items-center justify-between q-mb-sm">
            <div class="text-subtitle2 text-grey-7">Analysis Period</div>
            <q-chip color="primary" text-color="white" icon="event" size="md">
              {{ formatAnalysisPeriod() }}
            </q-chip>
          </div>
          <div class="row q-col-gutter-sm">
            <div class="col-6 col-sm-3">
              <div class="text-center">
                <div class="text-h5 text-primary text-weight-bold">{{ energyStats.total }} kWh</div>
                <div class="text-caption text-grey-7">Total Usage</div>
              </div>
            </div>
            <div class="col-6 col-sm-3">
              <div class="text-center">
                <div class="text-h5 text-positive text-weight-bold">{{ energyStats.average }} kWh</div>
                <div class="text-caption text-grey-7">Daily Average</div>
              </div>
            </div>
            <div class="col-6 col-sm-3">
              <div class="text-center">
                <div class="text-h5 text-purple text-weight-bold">{{ energyStats.daysActive }}</div>
                <div class="text-caption text-grey-7">Days Active</div>
              </div>
            </div>
            <div class="col-6 col-sm-3">
              <div class="text-center">
                <div class="text-h5 text-negative text-weight-bold">{{ energyStats.maxDayKwh }} kWh</div>
                <div class="text-caption text-grey-7">Peak Day</div>
              </div>
            </div>
          </div>

          <!-- Weather Row -->
          <q-separator class="q-my-sm" />
          <div v-if="currentWeather" class="row items-center q-gutter-sm q-pt-xs">
            <q-icon name="wb_sunny" color="orange" size="sm" />
            <span class="text-caption text-grey-8 text-weight-medium">{{ currentWeather.location }}</span>
            <q-chip dense color="orange-1" text-color="orange-9" size="sm" icon="thermostat">
              {{ currentWeather.temperature }}°C
            </q-chip>
            <q-chip dense color="blue-1" text-color="blue-9" size="sm" icon="water_drop">
              {{ currentWeather.humidity }}% humidity
            </q-chip>
            <q-chip dense color="grey-2" text-color="grey-8" size="sm">
              {{ currentWeather.description }}
            </q-chip>
          </div>
          <div v-else-if="loadingWeather" class="row items-center q-gutter-xs q-pt-xs">
            <q-spinner-dots color="grey-5" size="sm" />
            <span class="text-caption text-grey-5">Fetching weather...</span>
          </div>
          <div v-else class="text-caption text-grey-5 q-pt-xs">
            <q-icon name="cloud_off" size="xs" class="q-mr-xs" />Weather unavailable — check location in Settings
          </div>
        </q-card-section>
      </q-card>

      <!-- Main Action Card -->
      <q-card class="ai-card">
        <q-card-section>
          <div class="text-center q-pa-lg" v-if="!recommendations && !loadingRecommendations">
            <q-icon name="auto_awesome" size="80px" color="purple" class="q-mb-md" />
            <div class="text-h6 q-mb-sm">Get Personalized Recommendations</div>
            <div class="text-body2 text-grey-7 q-mb-lg">
              Our AI will analyze your usage patterns and provide actionable insights to save energy and money
            </div>
            <q-btn
              @click="getAIRecommendations"
              color="purple"
              icon="psychology"
              label="Analyze My Usage"
              size="lg"
              unelevated
              :disable="!energyStats || !hasApiKey"
            >
              <q-tooltip v-if="!hasApiKey">Please configure your API key in Settings</q-tooltip>
              <q-tooltip v-else-if="!energyStats">Please ensure device has energy data</q-tooltip>
            </q-btn>
          </div>

          <!-- Loading State -->
          <div v-if="loadingRecommendations" class="text-center q-pa-xl">
            <q-spinner-gears size="80px" color="purple" />
            <div class="text-h6 q-mt-lg text-purple">Analyzing Your Data...</div>
            <div class="text-body2 text-grey-7 q-mt-sm">
              Google Gemini AI is examining your energy patterns
            </div>
            <q-linear-progress indeterminate color="purple" class="q-mt-md" />
          </div>
        </q-card-section>
      </q-card>

      <!-- Recommendations Display -->
      <div v-if="recommendations && !recommendations.error" class="q-gutter-md">

        <!-- Immediate Actions -->
        <q-card v-if="recommendations.immediateActions?.length > 0" flat bordered class="bg-red-1 border-left-critical">
          <q-card-section>
            <div class="text-h6 text-weight-bold q-mb-md">
              <q-icon name="flash_on" color="negative" size="md" class="q-mr-xs" />
              ⚡ Immediate Actions Required
            </div>
            <div class="q-gutter-md">
              <q-card
                v-for="(action, idx) in recommendations.immediateActions"
                :key="idx"
                flat
                bordered
                class="bg-white"
              >
                <q-card-section>
                  <div class="row items-start">
                    <q-icon name="warning" color="negative" size="md" class="q-mr-md" />
                    <div class="col">
                      <div class="text-h6 text-negative q-mb-xs">{{ action.title }}</div>
                      <div class="text-body1">{{ action.description }}</div>
                      <q-badge
                        v-if="action.potentialSavings"
                        color="positive"
                        :label="'💰 Save ' + action.potentialSavings"
                        class="q-mt-sm"
                      />
                    </div>
                  </div>
                </q-card-section>
              </q-card>
            </div>
          </q-card-section>
        </q-card>

        <!-- Cost Savings -->
        <q-card v-if="recommendations.costSavings?.length > 0" flat bordered class="bg-green-1 border-left-success">
          <q-card-section>
            <div class="text-h6 text-weight-bold q-mb-md">
              <q-icon name="savings" color="positive" size="md" class="q-mr-xs" />
              💰 Cost Savings Opportunities
            </div>
            <div class="q-gutter-md">
              <q-card
                v-for="(saving, idx) in recommendations.costSavings"
                :key="idx"
                flat
                bordered
                class="bg-white"
              >
                <q-card-section>
                  <div class="text-body1 text-weight-medium q-mb-md">{{ saving.recommendation }}</div>
                  <div class="row q-gutter-sm">
                    <q-chip color="positive" text-color="white" icon="calendar_month" size="md">
                      <strong>Monthly:</strong>&nbsp;{{ saving.monthlySavings }}
                    </q-chip>
                    <q-chip color="green-8" text-color="white" icon="event_note" size="md">
                      <strong>Annual:</strong>&nbsp;{{ saving.annualSavings }}
                    </q-chip>
                  </div>
                </q-card-section>
              </q-card>
            </div>
          </q-card-section>
        </q-card>

        <!-- Usage Insights -->
        <q-card v-if="recommendations.usageInsights?.length > 0" flat bordered class="bg-blue-1 border-left-info">
          <q-card-section>
            <div class="text-h6 text-weight-bold q-mb-md">
              <q-icon name="insights" color="primary" size="md" class="q-mr-xs" />
              📊 Usage Pattern Insights
            </div>
            <q-list separator bordered class="rounded-borders bg-white">
              <q-item
                v-for="(insight, idx) in recommendations.usageInsights"
                :key="idx"
              >
                <q-item-section avatar>
                  <q-avatar
                    :color="insight.severity === 'critical' ? 'negative' : insight.severity === 'warning' ? 'warning' : 'info'"
                    text-color="white"
                    :icon="insight.severity === 'critical' ? 'error' : insight.severity === 'warning' ? 'warning' : 'info'"
                  />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-body1">{{ insight.insight }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>

        <!-- Maintenance -->
        <q-card v-if="recommendations.maintenance?.length > 0" flat bordered class="bg-purple-1 border-left-maintenance">
          <q-card-section>
            <div class="text-h6 text-weight-bold q-mb-md">
              <q-icon name="build_circle" color="purple" size="md" class="q-mr-xs" />
              🔧 Maintenance Reminders
            </div>
            <q-list separator bordered class="rounded-borders bg-white">
              <q-item
                v-for="(task, idx) in recommendations.maintenance"
                :key="idx"
              >
                <q-item-section>
                  <q-item-label class="text-subtitle1 text-weight-bold">{{ task.task }}</q-item-label>
                  <q-item-label caption class="text-body2 q-mt-xs">{{ task.reason }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-badge
                    :color="task.urgency === 'high' ? 'negative' : task.urgency === 'medium' ? 'warning' : 'positive'"
                    :label="task.urgency.toUpperCase()"
                    class="text-weight-bold"
                  />
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>

        <!-- Efficiency Tips -->
        <q-card v-if="recommendations.efficiencyTips?.length > 0" flat bordered class="bg-amber-1 border-left-tips">
          <q-card-section>
            <div class="text-h6 text-weight-bold q-mb-md">
              <q-icon name="tips_and_updates" color="amber" size="md" class="q-mr-xs" />
              💡 Energy Efficiency Tips
            </div>
            <q-list separator bordered class="rounded-borders bg-white">
              <q-item
                v-for="(tip, idx) in recommendations.efficiencyTips"
                :key="idx"
              >
                <q-item-section avatar>
                  <q-avatar
                    color="amber-8"
                    text-color="white"
                    :icon="tip.category === 'temperature' ? 'thermostat' : tip.category === 'schedule' ? 'schedule' : 'settings'"
                  />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-body1">{{ tip.tip }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>

        <!-- Action Buttons -->
        <q-card flat>
          <q-card-section>
            <div class="row q-gutter-sm justify-end">
              <q-btn
                flat
                label="Download Report"
                icon="download"
                @click="downloadRecommendations"
                color="primary"
              />
              <q-btn
                flat
                label="Share"
                icon="share"
                @click="shareRecommendations"
                color="primary"
              />
              <q-btn
                unelevated
                label="Analyze Again"
                icon="refresh"
                @click="getAIRecommendations"
                color="purple"
              />
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Error State -->
      <q-card v-if="recommendations?.error" flat bordered class="bg-negative text-white">
        <q-card-section>
          <div class="row items-center">
            <q-icon name="error" size="md" class="q-mr-md" />
            <div class="col">
              <div class="text-h6">Analysis Failed</div>
              <div class="text-body2">{{ recommendations.error }}</div>
            </div>
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Try Again" @click="getAIRecommendations" />
          <q-btn flat label="Go Back" @click="goBack" />
        </q-card-actions>
      </q-card>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useDeviceStore } from 'src/stores/deviceStore';
import { useAuthStore } from 'src/stores/authStore';
import ProfileMenu from 'src/components/ProfileMenu.vue';

const route = useRoute();
const router = useRouter();
const $q = useQuasar();
const deviceStore = useDeviceStore();
const authStore = useAuthStore();

// Device info from route
const deviceId = ref(route.params.deviceId || '');
const deviceName = ref(route.query.name || 'Device');
const deviceType = ref(route.query.type || 'Unknown');

// API Configuration
const baseUrl = 'https://api-kic.lgthinq.com';
const patToken = ref('');
const country = ref('PH');
const clientId = 'quasar-dashboard-001';
const apiKey = 'v6GFvkweNo7DK7yD3ylIZ9w52aKBU0eJ7wLXkSR3';

// State
const recommendations = ref(null);
const loadingRecommendations = ref(false);
const activeAlerts = ref([]);
const energyStats = ref(null);
const deviceStatus = ref(null);
const energyData = ref([]);
const periodType = ref('DAILY');

// API Key Management
const showApiKeyDialog = ref(false);
const apiKeyInput = ref('');
const hasApiKey = ref(false);
const selectedModel = ref('gemini-flash-latest');

const defaultPrompt = `Analyze this AC usage and return recommendations as JSON.

Device: {deviceName}
Power: {powerStatus} | Run State: {runState}
Mode: {acJobMode} | Fan: {fanSpeed} ({windStrengthDetail})
Room Temp: {currentRoomTemp}°C → Target: {targetTemp}°C
Wind Direction (Up-Down Swing): {windDirectionUpDown}
Usage: {monthlyKwh} kWh ({avgKwh} kWh/day avg), Peak: {peakKwh} kWh
Rate: ₱{ratePerKwh}/kWh (Philippines)
Location: {location}
Outside: {outdoorTemp}°C, {humidity}% humidity, {weatherDesc}

Return ONLY valid JSON (no markdown, no backticks):
{
  "immediateActions": [{"title": "Brief title", "description": "Short description", "potentialSavings": "₱X/month"}],
  "costSavings": [{"recommendation": "Brief tip", "monthlySavings": "₱XX", "annualSavings": "₱XX"}],
  "usageInsights": [{"insight": "Brief insight", "severity": "info"}],
  "maintenance": [{"task": "Brief task", "reason": "Why", "urgency": "medium"}],
  "efficiencyTips": [{"tip": "Brief tip", "category": "temperature"}]
}

Keep each string concise (under 100 chars). Factor in outdoor vs room temp difference, run state, fan mode, and humidity. Focus on Philippine tropical climate and ₱10-15/kWh rates.`;

const customPrompt = ref(defaultPrompt);
const availableModels = ref([
  {
    label: 'Gemini Flash (Recommended)',
    value: 'gemini-flash-latest',
    description: '⚡ Fastest • Best for daily use • FREE'
  },
  {
    label: 'Gemini Pro',
    value: 'gemini-pro-latest',
    description: '🎯 Best quality • Slower • FREE'
  }
]);
const loadingModels = ref(false);

// Location & Weather
const defaultLocation = 'Tarlac City, Tarlac';
const locationInput = ref(defaultLocation);
const currentWeather = ref(null);
const loadingWeather = ref(false);

const weatherCodeToDesc = (code) => {
  if (code === 0) return 'Clear sky';
  if (code <= 3) return 'Partly cloudy';
  if (code <= 48) return 'Foggy';
  if (code <= 55) return 'Drizzle';
  if (code <= 67) return 'Rainy';
  if (code <= 82) return 'Rain showers';
  if (code <= 99) return 'Thunderstorm';
  return 'Unknown';
};

const fetchWeatherData = async () => {
  loadingWeather.value = true;
  try {
    const location = locationInput.value || defaultLocation;

    // Open-Meteo geocoding works best with just the city name (no province).
    // Try full string first, then fall back to the part before the first comma.
    const searchTerms = [location];
    const cityOnly = location.split(',')[0].trim();
    if (cityOnly !== location) searchTerms.push(cityOnly);

    let place = null;
    for (const term of searchTerms) {
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(term)}&count=5&language=en`
      );
      const geoData = await geoRes.json();
      // Prefer a result from the Philippines (country_code PH)
      place = geoData.results?.find(r => r.country_code === 'PH') || geoData.results?.[0];
      if (place) break;
    }

    if (!place) {
      throw new Error(`Location "${location}" not found`);
    }

    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,relative_humidity_2m,weather_code`
    );
    const weatherData = await weatherRes.json();
    const cur = weatherData.current;
    currentWeather.value = {
      location: place.name,
      temperature: cur.temperature_2m,
      humidity: cur.relative_humidity_2m,
      description: weatherCodeToDesc(cur.weather_code)
    };
  } catch (error) {
    console.error('Weather fetch error:', error);
    currentWeather.value = null;
    $q.notify({
      type: 'warning',
      message: 'Could not fetch weather data',
      caption: error.message
    });
  } finally {
    loadingWeather.value = false;
  }
};

// Generate random message ID
const generateMessageId = () => {
  return Math.random().toString(36).substring(2, 24);
};

// Fetch device data
const fetchDeviceData = async () => {
  try {
    // Fetch device status
    const statusResponse = await fetch(`${baseUrl}/devices/${deviceId.value}/state`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${patToken.value}`,
        'x-message-id': generateMessageId(),
        'x-country': country.value,
        'x-client-id': clientId,
        'x-api-key': apiKey
      }
    });
    const statusData = await statusResponse.json();
    if (statusData.response) {
      deviceStatus.value = statusData.response;
    }

    // Get date range from deviceStore (passed from DeviceDashboard)
    const savedDateRange = deviceStore.selectedDateRange;
    const savedPeriodType = deviceStore.selectedPeriodType || 'DAILY';

    let startDate, endDate;

    if (savedDateRange?.startDate && savedDateRange?.endDate) {
      // Use the date range from the dashboard
      startDate = savedDateRange.startDate;
      endDate = savedDateRange.endDate;
      periodType.value = savedPeriodType;
    } else {
      // Fallback to current month
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      startDate = formatDateForAPI(firstDay);
      endDate = formatDateForAPI(today);
      periodType.value = 'DAILY';
    }

    const energyResponse = await fetch(
      `${baseUrl}/devices/energy/${deviceId.value}/usage?period=${periodType.value}&startDate=${startDate}&endDate=${endDate}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${patToken.value}`,
          'x-message-id': generateMessageId(),
          'x-country': country.value,
          'x-client-id': clientId,
          'x-api-key': apiKey
        }
      }
    );

    const energyDataResponse = await energyResponse.json();
    if (energyDataResponse.response?.result?.dataList) {
      energyData.value = energyDataResponse.response.result.dataList;
      calculateEnergyStats();
    }
  } catch (error) {
    console.error('Error fetching device data:', error);
    $q.notify({
      type: 'warning',
      message: 'Could not load all device data',
      caption: 'Some features may be limited'
    });
  }
};

// Format analysis period for display
const formatAnalysisPeriod = () => {
  const savedDateRange = deviceStore.selectedDateRange;
  const savedPeriodType = deviceStore.selectedPeriodType || 'DAILY';

  if (!savedDateRange) {
    return 'Current Month';
  }

  if (savedPeriodType === 'DAILY') {
    const start = savedDateRange.startDate;
    const end = savedDateRange.endDate;
    return `${start.substring(4,6)}/${start.substring(6,8)} - ${end.substring(4,6)}/${end.substring(6,8)}`;
  } else {
    const start = savedDateRange.startDate;
    const end = savedDateRange.endDate;
    return `${start.substring(0,4)}/${start.substring(4,6)} - ${end.substring(0,4)}/${end.substring(4,6)}`;
  }
};

// Format date for API
const formatDateForAPI = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
};

// Calculate energy statistics
const calculateEnergyStats = () => {
  if (energyData.value.length === 0) return;

  const totalEnergy = energyData.value.reduce((sum, day) => sum + day.energyUsage, 0);
  const daysWithUsage = energyData.value.filter(day => day.energyUsage > 0).length;
  const avgDaily = daysWithUsage > 0 ? totalEnergy / daysWithUsage : 0;
  const maxDay = energyData.value.reduce((max, day) =>
    day.energyUsage > max.energyUsage ? day : max, energyData.value[0]
  );

  energyStats.value = {
    total: (totalEnergy / 1000).toFixed(2),
    average: (avgDaily / 1000).toFixed(2),
    daysActive: daysWithUsage,
    maxDayKwh: (maxDay.energyUsage / 1000).toFixed(2)
  };
};

// Fetch available models from Gemini API
const fetchAvailableModels = async () => {
  if (!apiKeyInput.value) return;
  const geminiApiKey = apiKeyInput.value;

  loadingModels.value = true;
  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models', {
      method: 'GET',
      headers: {
        'X-goog-api-key': geminiApiKey
      }
    });

    if (response.ok) {
      const data = await response.json();

      // Filter only models that support generateContent
      const contentModels = data.models?.filter(model =>
        model.supportedGenerationMethods?.includes('generateContent')
      ) || [];

      if (contentModels.length > 0) {
        availableModels.value = contentModels.map(model => ({
          label: model.displayName || model.name.split('/').pop(),
          value: model.name.split('/').pop(), // Extract model name from "models/gemini-pro"
          description: model.description || 'Google Gemini Model'
        }));

        // Set first model as default if current selection is invalid
        if (!availableModels.value.find(m => m.value === selectedModel.value)) {
          selectedModel.value = availableModels.value[0].value;
        }

        $q.notify({
          type: 'positive',
          message: `Loaded ${contentModels.length} available models`,
          icon: 'check_circle'
        });
      }
    }
  } catch (error) {
    console.error('Error fetching models:', error);
    $q.notify({
      type: 'warning',
      message: 'Could not fetch available models',
      caption: 'Using default models'
    });
  } finally {
    loadingModels.value = false;
  }
};

// AI Analysis
const getAIRecommendations = async () => {
  loadingRecommendations.value = true;

  try {
    const deviceData = {
      deviceName: deviceName.value,
      deviceType: deviceType.value,
      currentStatus: {
        powerStatus: deviceStatus.value?.operation?.airConOperationMode || 'Unknown',
        runState: deviceStatus.value?.runState?.currentState || 'Unknown',
        acJobMode: deviceStatus.value?.airConJobMode?.currentJobMode || 'Unknown',
        fanSpeed: deviceStatus.value?.airFlow?.windStrength || 'Unknown',
        windStrengthDetail: deviceStatus.value?.airFlow?.windStrengthDetail || 'Unknown',
        currentRoomTemp: deviceStatus.value?.temperature?.currentTemperature ?? 'N/A',
        targetTemp: deviceStatus.value?.temperature?.targetTemperature ?? 'N/A',
        windDirectionUpDown: deviceStatus.value?.windDirection?.rotateUpDown ? 'Swing ON' : 'Swing OFF'
      },
      energyData: {
        thisMonth: energyStats.value?.total || 0,
        average: energyStats.value?.average || 0,
        peakDay: energyStats.value?.maxDayKwh || 0,
        daysActive: energyStats.value?.daysActive || 0
      },
      costs: {
        ratePerKwh: 12.50
      }
    };

    // Get API key
    const geminiApiKey = apiKeyInput.value;
    if (!geminiApiKey) {
      throw new Error('No Gemini API key set. Please configure it in Settings.');
    }

    // Build prompt with variable replacements
    let prompt = customPrompt.value
      .replace('{deviceName}', deviceData.deviceName)
      .replace('{powerStatus}', deviceData.currentStatus.powerStatus)
      .replace('{runState}', deviceData.currentStatus.runState)
      .replace('{acJobMode}', deviceData.currentStatus.acJobMode)
      .replace('{fanSpeed}', deviceData.currentStatus.fanSpeed)
      .replace('{windStrengthDetail}', deviceData.currentStatus.windStrengthDetail)
      .replace('{currentRoomTemp}', deviceData.currentStatus.currentRoomTemp)
      .replace('{targetTemp}', deviceData.currentStatus.targetTemp)
      .replace('{windDirectionUpDown}', deviceData.currentStatus.windDirectionUpDown)
      .replace('{monthlyKwh}', deviceData.energyData.thisMonth)
      .replace('{avgKwh}', deviceData.energyData.average)
      .replace('{peakKwh}', deviceData.energyData.peakDay)
      .replace('{ratePerKwh}', deviceData.costs.ratePerKwh)
      .replace('{location}', currentWeather.value?.location || locationInput.value)
      .replace('{outdoorTemp}', currentWeather.value?.temperature ?? 'N/A')
      .replace('{humidity}', currentWeather.value?.humidity ?? 'N/A')
      .replace('{weatherDesc}', currentWeather.value?.description || 'N/A');

    // Call Google Gemini API with selected model
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${selectedModel.value}:generateContent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-goog-api-key": geminiApiKey
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.4,
          topK: 20,
          topP: 0.8,
          maxOutputTokens: 4096,
          responseMimeType: "application/json"
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `API error: ${response.status}`);
    }

    const data = await response.json();

    // Check if response was cut off
    if (data.candidates?.[0]?.finishReason === 'MAX_TOKENS') {
      throw new Error('Response was cut off. Try using a different model or simplifying the request.');
    }

    // Extract text from Gemini response
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiResponse) {
      throw new Error('No response received from AI');
    }

    // Clean up response - remove markdown code blocks if present
    let cleanedResponse = aiResponse.trim();
    cleanedResponse = cleanedResponse.replace(/```json\n?/g, '');
    cleanedResponse = cleanedResponse.replace(/```\n?/g, '');
    cleanedResponse = cleanedResponse.trim();

    // Try to parse as JSON directly first
    try {
      recommendations.value = JSON.parse(cleanedResponse);
    } catch {
      // If direct parse fails, try to find JSON in the response
      const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        recommendations.value = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Could not parse AI response as JSON. Response: " + cleanedResponse.substring(0, 200));
      }
    }

    localStorage.setItem(`recommendations_${deviceId.value}`, JSON.stringify(recommendations.value));
    localStorage.setItem('lastAIAnalysis', new Date().toISOString());

    $q.notify({
      type: 'positive',
      message: 'Analysis Complete!',
      caption: 'Your personalized recommendations are ready',
      icon: 'auto_awesome'
    });

    checkForCriticalAlerts();

  } catch (error) {
    console.error("AI Analysis Error:", error);
    recommendations.value = {
      error: error.message || "Failed to generate recommendations. Please try again."
    };

    $q.notify({
      type: 'negative',
      message: 'Analysis failed',
      caption: error.message,
      icon: 'error'
    });
  } finally {
    loadingRecommendations.value = false;
  }
};

// Check for critical alerts
const checkForCriticalAlerts = () => {
  if (!recommendations.value) return;

  const newAlerts = [];

  recommendations.value.immediateActions?.forEach((action, idx) => {
    newAlerts.push({
      id: `immediate_${idx}`,
      type: 'critical',
      icon: 'warning',
      title: action.title,
      message: action.description,
      action: action.potentialSavings ? `Save: ${action.potentialSavings}` : null
    });
  });

  recommendations.value.maintenance?.forEach((task, idx) => {
    if (task.urgency === 'high') {
      newAlerts.push({
        id: `maintenance_${idx}`,
        type: 'warning',
        icon: 'build',
        title: task.task,
        message: task.reason,
        action: 'Schedule maintenance'
      });
    }
  });

  recommendations.value.usageInsights?.forEach((insight, idx) => {
    if (insight.severity === 'critical') {
      newAlerts.push({
        id: `insight_${idx}`,
        type: 'critical',
        icon: 'error',
        title: 'Critical Usage Alert',
        message: insight.insight,
        action: null
      });
    }
  });

  activeAlerts.value = newAlerts;
};

// Alert management
const dismissAlert = (alertId) => {
  activeAlerts.value = activeAlerts.value.filter(alert => alert.id !== alertId);
};

const dismissAllAlerts = () => {
  activeAlerts.value = [];
};

// Download recommendations
const downloadRecommendations = () => {
  if (!recommendations.value) return;

  let content = `AI-Powered Energy Recommendations\n`;
  content += `Device: ${deviceName.value}\n`;
  content += `Generated: ${new Date().toLocaleString()}\n`;
  content += `\n${'='.repeat(50)}\n\n`;

  if (recommendations.value.immediateActions?.length) {
    content += `IMMEDIATE ACTIONS:\n`;
    recommendations.value.immediateActions.forEach((action, i) => {
      content += `${i + 1}. ${action.title}\n`;
      content += `   ${action.description}\n`;
      if (action.potentialSavings) content += `   Savings: ${action.potentialSavings}\n`;
      content += `\n`;
    });
  }

  if (recommendations.value.costSavings?.length) {
    content += `COST SAVINGS:\n`;
    recommendations.value.costSavings.forEach((saving, i) => {
      content += `${i + 1}. ${saving.recommendation}\n`;
      content += `   Monthly: ${saving.monthlySavings} | Annual: ${saving.annualSavings}\n\n`;
    });
  }

  if (recommendations.value.usageInsights?.length) {
    content += `USAGE INSIGHTS:\n`;
    recommendations.value.usageInsights.forEach((insight, i) => {
      content += `${i + 1}. [${insight.severity.toUpperCase()}] ${insight.insight}\n`;
    });
    content += `\n`;
  }

  if (recommendations.value.maintenance?.length) {
    content += `MAINTENANCE:\n`;
    recommendations.value.maintenance.forEach((task, i) => {
      content += `${i + 1}. ${task.task} [${task.urgency.toUpperCase()}]\n`;
      content += `   ${task.reason}\n\n`;
    });
  }

  if (recommendations.value.efficiencyTips?.length) {
    content += `EFFICIENCY TIPS:\n`;
    recommendations.value.efficiencyTips.forEach((tip, i) => {
      content += `${i + 1}. ${tip.tip}\n`;
    });
  }

  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `energy-recommendations-${deviceId.value}-${Date.now()}.txt`;
  a.click();
  URL.revokeObjectURL(url);

  $q.notify({
    type: 'positive',
    message: 'Report Downloaded',
    icon: 'download'
  });
};

// Share recommendations
const shareRecommendations = () => {
  if (!recommendations.value) return;

  let text = `AI Energy Recommendations for ${deviceName.value}\n\n`;

  if (recommendations.value.costSavings?.length) {
    const firstSaving = recommendations.value.costSavings[0];
    text += `💰 ${firstSaving.recommendation}\n`;
    text += `Potential savings: ${firstSaving.monthlySavings}/month\n\n`;
  }

  text += `Generated by LG ThinQ Energy Monitor`;

  if (navigator.share) {
    navigator.share({
      title: 'Energy Recommendations',
      text: text
    });
  } else {
    navigator.clipboard.writeText(text);
    $q.notify({
      type: 'positive',
      message: 'Copied to clipboard',
      icon: 'content_copy'
    });
  }
};

// Go back
const goBack = () => {
  router.push('/device');
};

// API Key Management
const saveApiKey = async () => {
  await authStore.saveAISettings({
    apiKey: apiKeyInput.value,
    model: selectedModel.value,
    prompt: customPrompt.value,
    location: locationInput.value
  });
  hasApiKey.value = !!apiKeyInput.value;
  showApiKeyDialog.value = false;

  const modelName = availableModels.value.find(m => m.value === selectedModel.value)?.label || 'Selected model';

  $q.notify({
    type: 'positive',
    message: 'Settings saved successfully!',
    caption: `Using ${modelName}`,
    icon: 'check_circle'
  });

  // Fetch available models and weather after saving
  fetchAvailableModels();
  fetchWeatherData();
};

const resetToDefaults = () => {
  apiKeyInput.value = '';
  customPrompt.value = defaultPrompt;
  selectedModel.value = 'gemini-flash-latest';
  locationInput.value = defaultLocation;

  $q.notify({
    type: 'info',
    message: 'Settings reset to defaults',
    icon: 'refresh'
  });
};


// Load on mount
onMounted(async () => {
  const [credentials, aiSettings] = await Promise.all([
    authStore.loadCredentials(),
    authStore.loadAISettings()
  ]);

  if (!credentials || !deviceId.value) {
    $q.notify({
      type: 'negative',
      message: 'Missing device or authentication data',
      icon: 'error'
    });
    router.push('/');
    return;
  }
  patToken.value = credentials.patToken;
  country.value = credentials.country;

  if (aiSettings) {
    if (aiSettings.apiKey) apiKeyInput.value = aiSettings.apiKey;
    if (aiSettings.model) selectedModel.value = aiSettings.model;
    if (aiSettings.prompt) customPrompt.value = aiSettings.prompt;
    if (aiSettings.location) locationInput.value = aiSettings.location;
    hasApiKey.value = !!aiSettings.apiKey;
  }

  // Load device data and weather in parallel
  await Promise.all([fetchDeviceData(), fetchWeatherData()]);

  // Fetch available models if we have an API key
  if (apiKeyInput.value) {
    await fetchAvailableModels();
  }

  // Load saved recommendations
  const savedRecs = localStorage.getItem(`recommendations_${deviceId.value}`);
  if (savedRecs) {
    try {
      recommendations.value = JSON.parse(savedRecs);
      checkForCriticalAlerts();
    } catch (e) {
      console.error('Failed to load saved recommendations:', e);
    }
  }
});
</script>

<style scoped>
.bg-gradient-purple {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.ai-card {
  border: 2px solid #9c27b0;
  border-radius: 12px;
}

.border-left-critical {
  border-left: 4px solid #f44336;
}

.border-left-success {
  border-left: 4px solid #4caf50;
}

.border-left-info {
  border-left: 4px solid #2196f3;
}

.border-left-maintenance {
  border-left: 4px solid #9c27b0;
}

.border-left-tips {
  border-left: 4px solid #ff9800;
}

.border-left-warning {
  border-left: 4px solid #ff9800;
}

.rounded-borders {
  border-radius: 8px;
}

.prompt-input textarea {
  font-family: 'Courier New', monospace;
  font-size: 12px;
}
</style>
