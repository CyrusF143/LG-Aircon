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
              @click="resetChat"
              :loading="sendingMessage"
            >
              <q-tooltip>New Analysis</q-tooltip>
            </q-btn>
            <ProfileMenu />
          </div>
        </q-card-section>
      </q-card>

      <!-- API Key Setup Dialog -->
      <q-dialog v-model="showApiKeyDialog" :maximized="$q.screen.lt.sm" transition-show="slide-up" transition-hide="slide-down">
        <q-card :style="$q.screen.lt.sm ? 'display:flex; flex-direction:column' : 'display:flex; flex-direction:column; min-width: 400px; max-width: 560px; max-height: 90vh; overflow: hidden'">
          <q-card-section class="bg-purple text-white">
            <div class="row items-center">
              <div class="text-h6 col">
                <q-icon name="key" class="q-mr-sm" />
                Google Gemini API Settings
              </div>
              <q-btn v-if="$q.screen.lt.sm" flat round dense icon="close" color="white" v-close-popup />
            </div>
          </q-card-section>

          <div :style="$q.screen.lt.sm ? 'flex: 1; overflow-y: auto' : 'overflow-y: auto; max-height: calc(90vh - 130px)'">

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
          </div>

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

      <!-- Chat Card -->
      <q-card class="ai-card">
        <!-- Empty State -->
        <q-card-section v-if="chatMessages.length === 0 && !sendingMessage">
          <div class="text-center q-pa-lg">
            <q-icon name="auto_awesome" size="80px" color="purple" class="q-mb-md" />
            <div class="text-h6 q-mb-sm">Get Personalized Recommendations</div>
            <div class="text-body2 text-grey-7 q-mb-lg">
              Our AI will analyze your usage patterns and provide actionable insights to save energy and money
            </div>
            <q-btn
              @click="startChat"
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
        </q-card-section>

        <!-- Chat Messages -->
        <template v-if="chatMessages.length > 0 || sendingMessage">
          <div
            ref="chatContainer"
            :style="$q.screen.lt.sm ? 'height: calc(100vh - 350px)' : 'height: 500px'"
            style="overflow-y: auto; padding: 16px"
          >
            <div v-for="(msg, idx) in chatMessages" :key="idx" class="q-mb-md">
              <!-- User message -->
              <div v-if="msg.role === 'user'" class="row justify-end">
                <div style="max-width: 80%">
                  <div class="text-caption text-right text-grey-6 q-mb-xs">You</div>
                  <img v-if="msg.image" :src="msg.image" style="max-width: 100%; max-height: 240px; border-radius: 12px 12px 2px 12px; display: block; margin-bottom: 4px" />
                  <div v-if="msg.text" class="bg-purple text-white q-pa-md" style="border-radius: 12px 12px 2px 12px; white-space: pre-wrap; word-break: break-word">
                    {{ msg.text }}
                  </div>
                </div>
              </div>
              <!-- AI message -->
              <div v-else class="row justify-start">
                <div style="max-width: 85%">
                  <div class="text-caption text-grey-6 q-mb-xs">
                    <q-icon name="auto_awesome" size="xs" color="purple" class="q-mr-xs" />Gemini AI
                  </div>
                  <div class="bg-grey-2 q-pa-md" style="border-radius: 12px 12px 12px 2px; white-space: pre-wrap; word-break: break-word">
                    {{ msg.text }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Typing indicator -->
            <div v-if="sendingMessage" class="row justify-start q-mb-md">
              <div>
                <div class="text-caption text-grey-6 q-mb-xs">
                  <q-icon name="auto_awesome" size="xs" color="purple" class="q-mr-xs" />Gemini AI
                </div>
                <div class="bg-grey-2 q-pa-md" style="border-radius: 12px 12px 12px 2px">
                  <q-spinner-dots color="purple" size="1.5em" />
                </div>
              </div>
            </div>
          </div>

          <q-separator />

          <!-- Input Bar -->
          <q-card-section class="q-pa-sm">
            <!-- Image preview -->
            <div v-if="imagePreview" class="row items-center q-mb-sm q-gutter-sm">
              <div style="position: relative; display: inline-block">
                <img :src="imagePreview" style="height: 72px; border-radius: 8px; display: block" />
                <q-btn
                  round dense unelevated icon="close" color="negative" size="xs"
                  style="position: absolute; top: -6px; right: -6px"
                  @click="clearImage"
                />
              </div>
            </div>

            <div class="row items-center q-gutter-sm">
              <q-btn flat round dense icon="add_comment" color="grey-6" @click="resetChat" :disable="sendingMessage">
                <q-tooltip anchor="top middle" self="bottom middle">Start new analysis</q-tooltip>
              </q-btn>
              <!-- Hidden file input -->
              <input ref="fileInput" type="file" accept="image/*" style="display:none" @change="onImageSelected" />
              <q-btn flat round dense icon="image" color="grey-6" @click="fileInput.click()" :disable="sendingMessage">
                <q-tooltip anchor="top middle" self="bottom middle">Attach image</q-tooltip>
              </q-btn>
              <q-input
                v-model="chatInput"
                :placeholder="imagePreview ? 'Add a message (optional)...' : 'Ask a follow-up question or paste an image...'"
                outlined
                dense
                class="col"
                @keyup.enter="sendChatMessage"
                @paste="onPaste"
                :disable="sendingMessage"
              />
              <q-btn
                round unelevated color="purple" icon="send"
                @click="sendChatMessage"
                :disable="(!chatInput.trim() && !imagePreview) || sendingMessage"
                :loading="sendingMessage"
              />
            </div>
          </q-card-section>
        </template>
      </q-card>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue';
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

// Chat state
const chatMessages = ref([]);
const chatInput = ref('');
const sendingMessage = ref(false);
const chatContainer = ref(null);
const fileInput = ref(null);
const imagePreview = ref(null);
const imageData = ref(null); // { mimeType, data: base64 }

// Energy state
const energyStats = ref(null);
const deviceStatus = ref(null);
const energyData = ref([]);
const periodType = ref('DAILY');

// API Key Management
const showApiKeyDialog = ref(false);
const apiKeyInput = ref('');
const hasApiKey = ref(false);
const selectedModel = ref('gemini-flash-latest');

const defaultPrompt = `Analyze my AC energy usage and give me personalized recommendations.

Device: {deviceName}
Power: {powerStatus} | Run State: {runState}
Mode: {acJobMode} | Fan: {fanSpeed} ({windStrengthDetail})
Room Temp: {currentRoomTemp}°C → Target: {targetTemp}°C
Wind Direction (Up-Down Swing): {windDirectionUpDown}
Usage: {monthlyKwh} kWh ({avgKwh} kWh/day avg), Peak: {peakKwh} kWh
Rate: ₱{ratePerKwh}/kWh (Philippines)
Location: {location}
Outside: {outdoorTemp}°C, {humidity}% humidity, {weatherDesc}`;

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

// Build the prompt from template with current device data
const buildPrompt = () => {
  return customPrompt.value
    .replace('{deviceName}', deviceName.value)
    .replace('{powerStatus}', deviceStatus.value?.operation?.airConOperationMode || 'Unknown')
    .replace('{runState}', deviceStatus.value?.runState?.currentState || 'Unknown')
    .replace('{acJobMode}', deviceStatus.value?.airConJobMode?.currentJobMode || 'Unknown')
    .replace('{fanSpeed}', deviceStatus.value?.airFlow?.windStrength || 'Unknown')
    .replace('{windStrengthDetail}', deviceStatus.value?.airFlow?.windStrengthDetail || 'Unknown')
    .replace('{currentRoomTemp}', deviceStatus.value?.temperature?.currentTemperature ?? 'N/A')
    .replace('{targetTemp}', deviceStatus.value?.temperature?.targetTemperature ?? 'N/A')
    .replace('{windDirectionUpDown}', deviceStatus.value?.windDirection?.rotateUpDown ? 'Swing ON' : 'Swing OFF')
    .replace('{monthlyKwh}', energyStats.value?.total || 0)
    .replace('{avgKwh}', energyStats.value?.average || 0)
    .replace('{peakKwh}', energyStats.value?.maxDayKwh || 0)
    .replace('{ratePerKwh}', 12.50)
    .replace('{location}', currentWeather.value?.location || locationInput.value)
    .replace('{outdoorTemp}', currentWeather.value?.temperature ?? 'N/A')
    .replace('{humidity}', currentWeather.value?.humidity ?? 'N/A')
    .replace('{weatherDesc}', currentWeather.value?.description || 'N/A');
};

// Call Gemini API with full conversation history
const callGemini = async (messages) => {
  const contents = messages.map(m => {
    const parts = [];
    if (m.imageData) parts.push({ inlineData: m.imageData });
    if (m.apiText || m.text) parts.push({ text: m.apiText || m.text });
    return { role: m.role, parts };
  });

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel.value}:generateContent`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-goog-api-key': apiKeyInput.value },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: 'You are a friendly energy advisor. Always respond in clear, natural language using bullet points and sections. Never return JSON or code blocks.' }]
        },
        contents,
        generationConfig: { temperature: 0.7, maxOutputTokens: 4096 }
      })
    }
  );

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || `API error: ${response.status}`);
  }

  const data = await response.json();

  if (data.candidates?.[0]?.finishReason === 'MAX_TOKENS') {
    throw new Error('Response was cut off. Try a different model.');
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('No response received from AI');
  return text;
};

const onImageSelected = (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    const base64 = ev.target.result.split(',')[1];
    imagePreview.value = ev.target.result;
    imageData.value = { mimeType: file.type, data: base64 };
  };
  reader.readAsDataURL(file);
  e.target.value = '';
};

const clearImage = () => {
  imagePreview.value = null;
  imageData.value = null;
};

const onPaste = (e) => {
  const items = e.clipboardData?.items;
  if (!items) return;
  for (const item of items) {
    if (item.kind === 'file' && item.type.startsWith('image/')) {
      e.preventDefault();
      const file = item.getAsFile();
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        canvas.getContext('2d').drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
        imagePreview.value = dataUrl;
        imageData.value = { mimeType: 'image/jpeg', data: dataUrl.split(',')[1] };
        URL.revokeObjectURL(url);
      };
      img.src = url;
      break;
    }
  }
};

const scrollToBottom = async () => {
  await nextTick();
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
  }
};

// Start a new analysis chat — first message uses the prompt template
const startChat = async () => {
  if (!apiKeyInput.value) {
    showApiKeyDialog.value = true;
    return;
  }

  chatMessages.value.push({
    role: 'user',
    text: '🔍 Analyze my AC energy usage and give me personalized recommendations.',
    apiText: buildPrompt()
  });

  sendingMessage.value = true;
  await scrollToBottom();

  try {
    const reply = await callGemini(chatMessages.value);
    chatMessages.value.push({ role: 'model', text: reply });
  } catch (err) {
    chatMessages.value.push({ role: 'model', text: `❌ Error: ${err.message}` });
  } finally {
    sendingMessage.value = false;
    await scrollToBottom();
  }
};

// Send a follow-up message
const sendChatMessage = async () => {
  const text = chatInput.value.trim();
  if ((!text && !imageData.value) || sendingMessage.value) return;

  const msg = { role: 'user', text };
  if (imageData.value) {
    msg.image = imagePreview.value;
    msg.imageData = imageData.value;
  }

  chatInput.value = '';
  clearImage();
  chatMessages.value.push(msg);
  sendingMessage.value = true;
  await scrollToBottom();

  try {
    const reply = await callGemini(chatMessages.value);
    chatMessages.value.push({ role: 'model', text: reply });
  } catch (err) {
    chatMessages.value.push({ role: 'model', text: `❌ Error: ${err.message}` });
  } finally {
    sendingMessage.value = false;
    await scrollToBottom();
  }
};

// Clear chat and go back to empty state
const resetChat = () => {
  chatMessages.value = [];
  chatInput.value = '';
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
