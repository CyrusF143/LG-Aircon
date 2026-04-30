<template>
  <q-page class="ai-page">

      <!-- Header -->
      <div class="ai-header sticky-header">
        <div class="ai-header-inner">
          <q-btn flat dense round icon="arrow_back" color="white" @click="goBack" class="q-mr-sm" />
          <div class="ai-header-icon">
            <q-icon name="psychology" size="22px" color="white" />
          </div>
          <div>
            <div class="ai-header-title">AI-Powered Insights</div>
            <div class="ai-header-sub">{{ deviceName }} • {{ deviceType }}</div>
          </div>
          <q-space />
          <q-btn flat round icon="history" color="white" @click="showHistoryDrawer = true; fetchChatSessions()">
            <q-tooltip>Chat History</q-tooltip>
          </q-btn>
          <q-btn flat round icon="settings" color="white" @click="showApiKeyDialog = true">
            <q-tooltip>API Settings</q-tooltip>
          </q-btn>
          <q-btn flat round icon="refresh" color="white" @click="resetChat" :loading="sendingMessage || compacting">
            <q-tooltip>New Analysis</q-tooltip>
          </q-btn>
          <ProfileMenu />
        </div>
      </div>

      <!-- Chat History Drawer -->
      <q-drawer v-model="showHistoryDrawer" side="right" overlay bordered :width="320" class="history-drawer">
        <div class="history-drawer-header">
          <div class="history-drawer-title">
            <q-icon name="history" size="18px" class="q-mr-sm" />Chat History
          </div>
          <q-btn flat round dense icon="close" color="white" @click="showHistoryDrawer = false" />
        </div>

        <div class="history-drawer-body">
          <!-- Loading -->
          <div v-if="loadingHistory" class="text-center q-pa-lg">
            <q-spinner color="purple" size="32px" />
            <div class="text-caption text-grey-5 q-mt-sm">Loading sessions...</div>
          </div>

          <!-- Empty -->
          <div v-else-if="chatSessions.length === 0" class="text-center q-pa-xl text-grey-5">
            <q-icon name="chat_bubble_outline" size="40px" color="grey-4" />
            <div class="q-mt-sm text-caption">No saved sessions yet</div>
          </div>

          <!-- Session list -->
          <div v-else>
            <div
              v-for="session in chatSessions"
              :key="session.id"
              class="history-session-card"
            >
              <div class="history-session-top">
                <div>
                  <div class="history-session-date">{{ formatSessionDate(session.savedAt) }}</div>
                  <div class="history-session-period" v-if="session.period">
                    <q-icon name="date_range" size="11px" class="q-mr-xs" />{{ session.period }}
                  </div>
                </div>
                <q-btn flat round dense icon="delete" color="negative" size="sm" @click.stop="deleteSession(session)" />
              </div>
              <div class="history-session-preview">{{ session.preview }}</div>
              <div v-if="session.summary" class="history-session-summary">
                <q-icon name="summarize" size="12px" class="q-mr-xs text-purple" />
                {{ session.summary.slice(0, 120) }}...
              </div>
              <q-btn
                unelevated color="purple" label="Continue Chat" icon="chat" size="sm"
                class="q-mt-sm full-width" style="border-radius:8px"
                @click="loadSession(session)"
              />
            </div>
          </div>
        </div>
      </q-drawer>

      <div class="ai-content">

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
      <div v-if="energyStats" class="ai-stats-card">
        <!-- Period + weather row -->
        <div class="ai-stats-top">
          <div class="ai-period-label">
            <q-icon name="date_range" size="14px" class="q-mr-xs" />
            Analysis Period: <strong class="q-ml-xs">{{ formatAnalysisPeriod() }}</strong>
          </div>
          <div class="ai-weather-row" v-if="currentWeather">
            <q-icon name="wb_sunny" color="orange" size="16px" class="q-mr-xs" />
            <span class="ai-weather-loc">{{ currentWeather.location }}</span>
            <span class="ai-weather-chip temp">🌡 {{ currentWeather.temperature }}°C</span>
            <span class="ai-weather-chip humid">💧 {{ currentWeather.humidity }}%</span>
            <span class="ai-weather-chip desc">{{ currentWeather.description }}</span>
          </div>
          <div v-else-if="loadingWeather" class="ai-weather-row">
            <q-spinner-dots color="grey-5" size="sm" /><span class="text-caption text-grey-5 q-ml-xs">Fetching weather...</span>
          </div>
          <div v-else class="ai-weather-row text-caption text-grey-5">
            <q-icon name="cloud_off" size="14px" class="q-mr-xs" />Weather unavailable
          </div>
        </div>

        <!-- 4 stat chips -->
        <div class="ai-stat-grid">
          <div class="ai-stat-chip">
            <div class="ai-stat-icon" style="background:#e3f2fd">
              <q-icon name="bolt" size="18px" color="primary" />
            </div>
            <div class="ai-stat-value text-primary">{{ energyStats.total }} kWh</div>
            <div class="ai-stat-label">Total Usage</div>
          </div>
          <div class="ai-stat-chip">
            <div class="ai-stat-icon" style="background:#e8f5e9">
              <q-icon name="trending_up" size="18px" color="positive" />
            </div>
            <div class="ai-stat-value text-positive">{{ energyStats.average }} kWh</div>
            <div class="ai-stat-label">Daily Average</div>
          </div>
          <div class="ai-stat-chip">
            <div class="ai-stat-icon" style="background:#f3e5f5">
              <q-icon name="calendar_today" size="18px" color="purple" />
            </div>
            <div class="ai-stat-value text-purple">{{ energyStats.daysActive }}</div>
            <div class="ai-stat-label">Days Active</div>
          </div>
          <div class="ai-stat-chip">
            <div class="ai-stat-icon" style="background:#fce4ec">
              <q-icon name="local_fire_department" size="18px" color="negative" />
            </div>
            <div class="ai-stat-value text-negative">{{ energyStats.maxDayKwh }} kWh</div>
            <div class="ai-stat-label">Peak Day</div>
          </div>
        </div>
      </div>

      <!-- Chat Card -->
      <div class="ai-chat-card">

        <!-- Empty State -->
        <div v-if="chatMessages.length === 0 && !sendingMessage" class="ai-empty-state">
          <div class="ai-empty-sparkle">
            <q-icon name="auto_awesome" size="36px" color="white" />
          </div>
          <div class="ai-empty-title">Get Personalized Recommendations</div>
          <div class="ai-empty-sub">Our AI will analyze your usage patterns and provide actionable insights to save energy and money</div>
          <q-btn
            @click="startChat"
            color="purple"
            icon="psychology"
            label="Analyze My Usage"
            unelevated
            class="ai-analyze-btn"
            :disable="!energyStats || !hasApiKey"
          >
            <q-tooltip v-if="!hasApiKey">Please configure your API key in Settings</q-tooltip>
            <q-tooltip v-else-if="!energyStats">Please ensure device has energy data</q-tooltip>
          </q-btn>
        </div>

        <!-- Chat Messages -->
        <template v-if="chatMessages.length > 0 || sendingMessage">
          <div
            ref="chatContainer"
            class="ai-chat-messages"
            :style="$q.screen.lt.sm ? 'height: calc(100vh - 320px)' : 'height: 480px'"
          >
            <div v-for="(msg, idx) in chatMessages" :key="idx" class="q-mb-md">
              <!-- User message -->
              <div v-if="msg.role === 'user'" class="row justify-end">
                <div style="max-width: 80%">
                  <div class="ai-msg-label text-right">You</div>
                  <img v-if="msg.image" :src="msg.image" style="max-width: 100%; max-height: 240px; border-radius: 12px 12px 2px 12px; display: block; margin-bottom: 4px" />
                  <div v-if="msg.text" class="ai-bubble-user">{{ msg.text }}</div>
                </div>
              </div>
              <!-- AI message -->
              <div v-else class="row justify-start">
                <div style="max-width: 85%">
                  <div class="ai-msg-label">
                    <q-icon name="auto_awesome" size="xs" color="purple" class="q-mr-xs" />Gemini AI
                  </div>
                  <div class="ai-bubble-ai">{{ msg.text }}</div>
                </div>
              </div>
            </div>

            <!-- Restored session summary banner at bottom -->
            <div v-if="currentSessionSummary" class="session-summary-banner">
              <div class="session-summary-banner-header">
                <q-icon name="summarize" size="15px" class="q-mr-xs" />
                Previous Session Summary
              </div>
              <div class="session-summary-banner-text">{{ currentSessionSummary }}</div>
              <div class="session-summary-banner-footer">
                <q-icon name="arrow_upward" size="12px" class="q-mr-xs" />
                Full conversation restored above — continue chatting below
              </div>
            </div>

            <!-- Typing indicator -->
            <div v-if="sendingMessage" class="row justify-start q-mb-md">
              <div>
                <div class="ai-msg-label">
                  <q-icon name="auto_awesome" size="xs" color="purple" class="q-mr-xs" />Gemini AI
                </div>
                <div class="ai-bubble-ai ai-bubble-typing">
                  <q-spinner-dots color="purple" size="1.5em" />
                </div>
              </div>
            </div>
          </div>

          <q-separator />

          <!-- Input Bar -->
          <div class="ai-input-bar">
            <!-- Image preview -->
            <div v-if="imagePreview" class="ai-image-preview">
              <div style="position: relative; display: inline-block">
                <img :src="imagePreview" style="height: 72px; border-radius: 8px; display: block" />
                <q-btn round dense unelevated icon="close" color="negative" size="xs"
                  style="position: absolute; top: -6px; right: -6px" @click="clearImage" />
              </div>
            </div>

            <div class="row items-center q-gutter-sm">
              <q-btn flat round dense icon="add_comment" color="grey-6" @click="resetChat" :disable="sendingMessage || compacting">
                <q-tooltip anchor="top middle" self="bottom middle">Save &amp; start new analysis</q-tooltip>
              </q-btn>
              <q-btn flat round dense icon="save" color="purple" @click="saveCurrentChat" :disable="sendingMessage || compacting || chatMessages.length < 2">
                <q-tooltip anchor="top middle" self="bottom middle">Save chat to history</q-tooltip>
              </q-btn>
              <input ref="fileInput" type="file" accept="image/*" style="display:none" @change="onImageSelected" />
              <q-btn flat round dense icon="image" color="grey-6" @click="fileInput.click()" :disable="sendingMessage">
                <q-tooltip anchor="top middle" self="bottom middle">Attach image</q-tooltip>
              </q-btn>
              <q-input
                v-model="chatInput"
                :placeholder="imagePreview ? 'Add a message (optional)...' : 'Ask a follow-up question or paste an image...'"
                outlined dense class="col"
                @keyup.enter="sendChatMessage"
                @paste="onPaste"
                :disable="sendingMessage"
              />
              <q-btn round unelevated color="purple" icon="send"
                @click="sendChatMessage"
                :disable="(!chatInput.trim() && !imagePreview) || sendingMessage"
                :loading="sendingMessage" />
            </div>
          </div>
        </template>

      </div>

      </div><!-- end ai-content -->

    <!-- Saving Progress Dialog -->
    <q-dialog v-model="compacting" persistent>
      <q-card class="saving-dialog-card">
        <q-card-section class="saving-dialog-header">
          <q-icon name="cloud_upload" size="28px" color="white" />
          <div class="saving-dialog-title">Saving Chat</div>
        </q-card-section>
        <q-card-section class="saving-dialog-body">
          <q-spinner-dots color="purple" size="36px" class="q-mb-md" />
          <div class="saving-dialog-step">{{ savingStep }}</div>
          <div class="saving-dialog-sub">Please wait while we compact and save your conversation...</div>
        </q-card-section>
      </q-card>
    </q-dialog>

  </q-page>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useDeviceStore } from 'src/stores/deviceStore';
import { useAuthStore } from 'src/stores/authStore';
import { auth, firestore } from 'src/boot/firebase';
import { collection, getDocs, addDoc, updateDoc, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
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

// Chat history
const showHistoryDrawer = ref(false);
const chatSessions = ref([]);
const loadingHistory = ref(false);
const compacting = ref(false);
const savingStep = ref(''); // shown in the saving dialog
const currentSessionSummary = ref(null); // summary from a loaded previous session
const currentSessionId = ref(null); // Firestore doc ID if continuing an existing session

// Energy state
const energyStats = ref(null);
const deviceStatus = ref(null);
const energyData = ref([]);
const periodType = ref('DAILY');

// Bill history from Firestore
const billHistory = ref([]);

const fetchBillHistory = async () => {
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  try {
    const q = query(collection(firestore, 'users', uid, 'bills'), orderBy('savedAt', 'desc'));
    const snapshot = await getDocs(q);
    billHistory.value = snapshot.docs.map(d => d.data());
  } catch {
    // non-critical, silently skip
  }
};

const formatBillHistoryForPrompt = () => {
  if (!billHistory.value.length) return 'No saved bill records yet.';
  return billHistory.value.slice(0, 6).map(b =>
    `- ${b.dateRange}: ₱${b.calculatedBill?.toFixed(2)} (${b.deviceTotalKwh} kWh device, rate ₱${b.ratePerKwh}/kWh, ${b.daysActive} days active, avg ${b.avgKwhPerDay} kWh/day, peak ${b.peakDayKwh} kWh)`
  ).join('\n');
};

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
Outside: {outdoorTemp}°C, {humidity}% humidity, {weatherDesc}

Bill History (recent periods):
{billHistory}`;

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
    .replace('{weatherDesc}', currentWeather.value?.description || 'N/A')
    .replace('{billHistory}', formatBillHistoryForPrompt());
};

// Call Gemini API with full conversation history
const callGemini = async (messages) => {
  const contents = messages.map(m => {
    const parts = [];
    if (m.imageData) parts.push({ inlineData: m.imageData });
    if (m.apiText || m.text) parts.push({ text: m.apiText || m.text });
    return { role: m.role, parts };
  });

  const isFirstMessage = messages.filter(m => m.role === 'user').length === 1;
  const summaryContext = currentSessionSummary.value
    ? `\n\nContext from previous conversation: ${currentSessionSummary.value}`
    : '';
  const systemText = isFirstMessage
    ? `You are a friendly energy advisor. For this initial analysis, respond with clear sections and bullet points to organize your insights. Never return JSON or code blocks.${summaryContext}`
    : `You are a friendly energy advisor in a conversation. The user is asking a follow-up question. Respond naturally and conversationally — no need for headers or full re-analysis unless specifically asked. Keep it concise and helpful. Never return JSON or code blocks.${summaryContext}`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel.value}:generateContent`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-goog-api-key': apiKeyInput.value },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemText }] },
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

const typeMessage = (text) => {
  return new Promise((resolve) => {
    chatMessages.value.push({ role: 'model', text: '' });
    const idx = chatMessages.value.length - 1;
    let i = 0;
    const interval = setInterval(async () => {
      chatMessages.value[idx].text += text[i];
      i++;
      if (i % 8 === 0) await scrollToBottom();
      if (i >= text.length) {
        clearInterval(interval);
        await scrollToBottom();
        resolve();
      }
    }, 12);
  });
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
    sendingMessage.value = false;
    await typeMessage(reply);
  } catch (err) {
    sendingMessage.value = false;
    await typeMessage(`❌ Error: ${err.message}`);
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
    sendingMessage.value = false;
    await typeMessage(reply);
  } catch (err) {
    sendingMessage.value = false;
    await typeMessage(`❌ Error: ${err.message}`);
  }
};

// Compact conversation into a short summary then save to Firestore
const compactAndSave = async () => {
  if (chatMessages.value.length < 2) return;
  const uid = auth.currentUser?.uid;
  if (!uid || !apiKeyInput.value) return;

  compacting.value = true;
  savingStep.value = 'Compacting conversation...';
  try {
    const newTranscript = chatMessages.value
      .map(m => `${m.role === 'user' ? 'User' : 'AI'}: ${m.text}`)
      .join('\n');

    const compactPrompt = currentSessionSummary.value
      ? `You previously summarized a conversation as:\n"${currentSessionSummary.value}"\n\nThe conversation continued with new messages:\n${newTranscript}\n\nUpdate the summary to incorporate the new exchanges. Be thorough — include all important details such as: exact energy usage figures (kWh, averages, peak days), specific AC settings discussed (temperature targets, fan speed, mode, swing), every recommendation given and whether the user acted on it, any bill calculations or cost figures mentioned, user concerns or preferences raised, and any unresolved questions. Length is fine as long as all key details are preserved. This will be used to fully restore context when continuing the conversation later.`
      : `Create a detailed summary of this AC energy advisor conversation. Include all important details: exact energy usage figures (total kWh, daily average, peak day), AC device settings discussed (temperature, fan speed, mode, swing), every specific recommendation given by the AI, any bill calculations or cost estimates mentioned, user concerns or preferences, and any unresolved questions. Do not omit specifics — a thorough summary is preferred over a brief one. This will be used to fully restore context when continuing the conversation later.\n\n${newTranscript}`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel.value}:generateContent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-goog-api-key': apiKeyInput.value },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: compactPrompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 1024 }
        })
      }
    );
    const data = await res.json();
    const summary = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    savingStep.value = 'Saving to chat history...';
    const displayMessages = chatMessages.value.map(({ role, text }) => ({ role, text }));
    const firstAiMsg = displayMessages.find(m => m.role === 'model');
    const preview = firstAiMsg?.text?.slice(0, 100) || '';

    const sessionData = {
      messages: displayMessages,
      summary,
      preview,
      period: formatAnalysisPeriod(),
      deviceName: deviceName.value,
      savedAt: new Date().toISOString()
    };

    if (currentSessionId.value) {
      await updateDoc(doc(firestore, 'users', uid, 'aiChats', currentSessionId.value), sessionData);
    } else {
      const newDoc = await addDoc(collection(firestore, 'users', uid, 'aiChats'), sessionData);
      currentSessionId.value = newDoc.id;
    }

    savingStep.value = 'Saved!';
    await fetchChatSessions();
    $q.notify({ type: 'positive', message: 'Chat saved to history!', icon: 'cloud_done' });
  } catch (e) {
    console.error('Failed to compact/save chat:', e);
    $q.notify({ type: 'negative', message: 'Failed to save chat', icon: 'error' });
  } finally {
    compacting.value = false;
    savingStep.value = '';
  }
};

// Manually save current chat without resetting
const saveCurrentChat = async () => {
  await compactAndSave();
};

// Fetch all saved chat sessions
const fetchChatSessions = async () => {
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  loadingHistory.value = true;
  try {
    const q = query(collection(firestore, 'users', uid, 'aiChats'), orderBy('savedAt', 'desc'));
    const snap = await getDocs(q);
    chatSessions.value = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.error('Failed to fetch chat sessions:', e);
  } finally {
    loadingHistory.value = false;
  }
};

// Load a previous session for display + inject summary as context
const loadSession = (session) => {
  chatMessages.value = session.messages.map(m => ({ ...m }));
  currentSessionSummary.value = session.summary;
  currentSessionId.value = session.id;
  showHistoryDrawer.value = false;
  $q.notify({ type: 'positive', message: 'Session loaded — you can continue the conversation', icon: 'history' });
};

// Delete a saved session
const deleteSession = async (session) => {
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  try {
    await deleteDoc(doc(firestore, 'users', uid, 'aiChats', session.id));
    chatSessions.value = chatSessions.value.filter(s => s.id !== session.id);
    $q.notify({ type: 'positive', message: 'Session deleted', icon: 'delete' });
  } catch {
    $q.notify({ type: 'negative', message: 'Failed to delete session' });
  }
};

const formatSessionDate = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

// Clear chat and go back to empty state — compact+save first if there's content
const resetChat = async () => {
  if (chatMessages.value.length >= 2) await compactAndSave();
  chatMessages.value = [];
  chatInput.value = '';
  currentSessionSummary.value = null;
  currentSessionId.value = null;
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

  // Load device data, weather, bill history and chat sessions in parallel
  await Promise.all([fetchDeviceData(), fetchWeatherData(), fetchBillHistory(), fetchChatSessions()]);

  // Fetch available models if we have an API key
  if (apiKeyInput.value) {
    await fetchAvailableModels();
  }
});

onUnmounted(async () => {
  if (chatMessages.value.length >= 2) await compactAndSave();
});
</script>

<style scoped>
/* Page */
.ai-page {
  background: #f4f6fb;
  min-height: 100vh;
}

/* Header */
.ai-header {
  background: linear-gradient(135deg, #5e35b1 0%, #7b1fa2 60%, #9c27b0 100%);
  padding: 0 20px;
}
.ai-header-inner {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 0;
}
.ai-header-icon {
  width: 42px;
  height: 42px;
  border-radius: 11px;
  background: rgba(255,255,255,0.18);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.ai-header-title {
  font-size: 19px;
  font-weight: 700;
  color: white;
  line-height: 1.2;
}
.ai-header-sub {
  font-size: 12px;
  color: rgba(255,255,255,0.7);
}

/* Content */
.ai-content {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Stats card */
.ai-stats-card {
  background: white;
  border-radius: 16px;
  border: 1px solid #e8eef5;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}
.ai-stats-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  padding: 14px 18px;
  background: linear-gradient(135deg, #f3e5f5, #ede7f6);
  border-bottom: 1px solid #e1bee7;
}
.ai-period-label {
  display: flex;
  align-items: center;
  font-size: 13px;
  color: #555;
  font-weight: 500;
}
.ai-weather-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.ai-weather-loc {
  font-size: 12px;
  font-weight: 600;
  color: #444;
}
.ai-weather-chip {
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 20px;
}
.ai-weather-chip.temp   { background: #fff3e0; color: #e65100; }
.ai-weather-chip.humid  { background: #e3f2fd; color: #1565c0; }
.ai-weather-chip.desc   { background: #f5f5f5; color: #555; }

/* 4-stat grid */
.ai-stat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
}
.ai-stat-chip {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 10px;
  border-right: 1px solid #f0f4f8;
  text-align: center;
}
.ai-stat-chip:last-child { border-right: none; }
.ai-stat-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
}
.ai-stat-value {
  font-size: 18px;
  font-weight: 800;
  line-height: 1.1;
  margin-bottom: 3px;
}
.ai-stat-label {
  font-size: 10px;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  font-weight: 500;
}

/* Chat card */
.ai-chat-card {
  background: white;
  border-radius: 16px;
  border: 2px solid #ce93d8;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(156, 39, 176, 0.08);
}

/* Empty state */
.ai-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 52px 24px;
  text-align: center;
}
.ai-empty-sparkle {
  width: 72px;
  height: 72px;
  border-radius: 20px;
  background: linear-gradient(135deg, #7b1fa2, #9c27b0);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 18px;
  box-shadow: 0 6px 20px rgba(156, 39, 176, 0.3);
}
.ai-empty-title {
  font-size: 18px;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 8px;
}
.ai-empty-sub {
  font-size: 13px;
  color: #888;
  max-width: 400px;
  line-height: 1.6;
  margin-bottom: 24px;
}
.ai-analyze-btn {
  border-radius: 12px;
  padding: 10px 28px;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.5px;
}

/* Chat messages */
.ai-chat-messages {
  overflow-y: auto;
  padding: 18px;
}
.ai-msg-label {
  font-size: 11px;
  color: #aaa;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
}
.ai-bubble-user {
  background: linear-gradient(135deg, #7b1fa2, #9c27b0);
  color: white;
  padding: 12px 16px;
  border-radius: 14px 14px 2px 14px;
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 14px;
  line-height: 1.5;
}
.ai-bubble-ai {
  background: #f5f0ff;
  color: #2d2d2d;
  padding: 12px 16px;
  border-radius: 14px 14px 14px 2px;
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 14px;
  line-height: 1.6;
  border: 1px solid #e1bee7;
}
.ai-bubble-typing { padding: 10px 16px; }

/* Input bar */
/* Restored session summary banner */
.session-summary-banner {
  background: linear-gradient(135deg, #f3e5f5, #ede7f6);
  border: 1.5px solid #ce93d8;
  border-radius: 12px;
  padding: 12px 14px;
  margin-bottom: 18px;
}
.session-summary-banner-header {
  display: flex;
  align-items: center;
  font-size: 11px;
  font-weight: 700;
  color: #6a1b9a;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}
.session-summary-banner-text {
  font-size: 13px;
  color: #444;
  line-height: 1.6;
  margin-bottom: 8px;
}
.session-summary-banner-footer {
  display: flex;
  align-items: center;
  font-size: 11px;
  color: #9e9e9e;
  font-style: italic;
}

.ai-input-bar {
  padding: 10px 14px 12px;
}
.ai-image-preview { margin-bottom: 8px; }

/* Responsive */
@media (max-width: 599px) {
  .ai-stat-grid { grid-template-columns: 1fr 1fr; }
  .ai-stat-chip { border-bottom: 1px solid #f0f4f8; }
  .ai-stat-chip:nth-child(even) { border-right: none; }
  .ai-stat-chip:nth-last-child(-n+2) { border-bottom: none; }
  .ai-stats-top { flex-direction: column; align-items: flex-start; }
  .ai-header-title { font-size: 16px; }
}

.prompt-input textarea {
  font-family: 'Courier New', monospace;
  font-size: 12px;
}

/* History drawer */
/* Saving dialog */
.saving-dialog-card {
  border-radius: 16px;
  overflow: hidden;
  min-width: 280px;
  text-align: center;
}
.saving-dialog-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 16px 20px;
  background: linear-gradient(135deg, #5e35b1, #9c27b0);
}
.saving-dialog-title {
  font-size: 16px;
  font-weight: 700;
  color: white;
}
.saving-dialog-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 20px 20px;
}
.saving-dialog-step {
  font-size: 14px;
  font-weight: 600;
  color: #6a1b9a;
  margin-bottom: 6px;
}
.saving-dialog-sub {
  font-size: 12px;
  color: #aaa;
}

/* History drawer */
.history-drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  background: linear-gradient(135deg, #5e35b1, #9c27b0);
}
.history-drawer-title {
  display: flex;
  align-items: center;
  font-size: 15px;
  font-weight: 700;
  color: white;
}
.history-drawer-body {
  padding: 12px;
  overflow-y: auto;
  height: calc(100% - 56px);
}
.history-session-card {
  background: #faf5ff;
  border: 1.5px solid #e1bee7;
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 10px;
  cursor: pointer;
  transition: box-shadow 0.15s ease;
}
.history-session-card:hover {
  box-shadow: 0 4px 12px rgba(156,39,176,0.12);
}
.history-session-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 6px;
}
.history-session-date {
  font-size: 12px;
  font-weight: 700;
  color: #6a1b9a;
}
.history-session-period {
  font-size: 11px;
  color: #aaa;
  display: flex;
  align-items: center;
}
.history-session-preview {
  font-size: 12px;
  color: #444;
  line-height: 1.5;
  margin-bottom: 6px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.history-session-summary {
  font-size: 11px;
  color: #888;
  line-height: 1.4;
  background: white;
  border-radius: 6px;
  padding: 6px 8px;
  border: 1px solid #f0e6ff;
  display: flex;
  align-items: flex-start;
  gap: 2px;
}
</style>
