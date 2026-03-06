<template>
  <q-page class="q-pa-md">
    <div class="q-gutter-md">
      <!-- Header -->
      <q-card class="bg-primary text-white">
        <q-card-section>
          <div class="text-h4">
            <q-icon name="bolt" size="sm" class="q-mr-sm" />
            LG ThinQ Energy Monitor
          </div>
          <div class="text-subtitle2">Configure your API access</div>
        </q-card-section>
      </q-card>

      <!-- PAT Token Input -->
      <q-card v-if="!hasToken">
        <q-card-section>
          <div class="text-h6 q-mb-md">Step 1: Enter Your PAT Token</div>

          <q-input
            v-model="patToken"
            label="PAT Token *"
            type="password"
            outlined
            hint="Get your token from https://connect-pat.lgthinq.com"
            :rules="[val => !!val || 'PAT Token is required']"
          >
            <template v-slot:prepend>
              <q-icon name="vpn_key" />
            </template>
          </q-input>

          <q-input
            v-model="country"
            label="Country Code"
            outlined
            class="q-mt-md"
            hint="ISO 3166-1 alpha-2 (e.g., PH, US, KR)"
            :rules="[val => !!val || 'Country code is required']"
          >
            <template v-slot:prepend>
              <q-icon name="flag" />
            </template>
          </q-input>

          <q-btn
            label="Connect & Get Devices"
            color="primary"
            class="q-mt-md full-width"
            @click="fetchDevices"
            :loading="loading"
            :disable="!patToken || !country"
          />
        </q-card-section>
      </q-card>

      <!-- Device List -->
      <q-card v-if="hasToken && devices.length > 0">
        <q-card-section>
          <div class="text-h6 q-mb-md">
            Your Devices
            <q-btn
              flat
              round
              dense
              icon="refresh"
              @click="fetchDevices"
              :loading="loading"
              class="q-ml-sm"
            />
          </div>

          <q-list separator>
            <q-item
              v-for="device in devices"
              :key="device.deviceId"
              clickable
              @click="selectDevice(device)"
            >
              <q-item-section avatar>
                <q-avatar color="primary" text-color="white" icon="devices" />
              </q-item-section>

              <q-item-section>
                <q-item-label>{{ device.deviceInfo.alias || 'Unnamed Device' }}</q-item-label>
                <q-item-label caption>
                  Type: {{ formatDeviceType(device.deviceInfo.deviceType) }}
                </q-item-label>
                <q-item-label caption>
                  Model: {{ device.deviceInfo.modelName }}
                </q-item-label>
              </q-item-section>

              <q-item-section side>
                <q-badge
                  :color="device.deviceInfo.reportable ? 'positive' : 'warning'"
                  :label="device.deviceInfo.reportable ? 'Active' : 'Inactive'"
                />
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn
            flat
            label="Change Token"
            @click="resetToken"
            color="negative"
          />
        </q-card-actions>
      </q-card>



      <!-- Error Display -->
      <q-banner v-if="error" class="bg-negative text-white" rounded>
        <template v-slot:avatar>
          <q-icon name="error" />
        </template>
        {{ error }}
        <template v-slot:action>
          <q-btn flat label="Dismiss" @click="error = null" />
        </template>
      </q-banner>

      <!-- Empty State -->
      <q-card v-if="hasToken && devices.length === 0 && !loading">
        <q-card-section class="text-center q-pa-lg">
          <q-icon name="devices_off" size="64px" color="grey-5" />
          <div class="text-h6 text-grey-7 q-mt-md">No Devices Found</div>
          <div class="text-caption text-grey-6">
            Make sure you have devices registered in your LG ThinQ app
          </div>
          <q-btn
            label="Retry"
            color="primary"
            @click="fetchDevices"
            class="q-mt-md"
          />
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup>
import { ref } from 'vue';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';

const $q = useQuasar();
const router = useRouter();

// State
const patToken = ref('');
const country = ref('PH');
const devices = ref([]);
const loading = ref(false);
const error = ref(null);
const hasToken = ref(false);

// API Configuration
const baseUrl = 'https://api-kic.lgthinq.com';
const clientId = 'quasar-dashboard-001';
const apiKey = 'v6GFvkweNo7DK7yD3ylIZ9w52aKBU0eJ7wLXkSR3';

// Generate random message ID
const generateMessageId = () => {
  return Math.random().toString(36).substring(2, 24);
};

// Fetch devices from LG ThinQ API
const fetchDevices = async () => {
  loading.value = true;
  error.value = null;

  try {
    const response = await fetch(`${baseUrl}/devices`, {
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

    if (data.response && Array.isArray(data.response)) {
      devices.value = data.response;
      hasToken.value = true;

      // Store token in localStorage
      localStorage.setItem('patToken', patToken.value);
      localStorage.setItem('country', country.value);

      $q.notify({
        type: 'positive',
        message: `Found ${devices.value.length} device(s)`,
        icon: 'check_circle'
      });
    } else if (data.error) {
      throw new Error(data.error.message || 'Failed to fetch devices');
    } else {
      throw new Error('Invalid response format');
    }
  } catch (err) {
    error.value = err.message;
    $q.notify({
      type: 'negative',
      message: `Error: ${err.message}`,
      icon: 'error'
    });
  } finally {
    loading.value = false;
  }
};

// Format device type for display
const formatDeviceType = (deviceType) => {
  return deviceType
    .replace('DEVICE_', '')
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, l => l.toUpperCase());
};

// Select a device - navigate directly to dashboard
const selectDevice = (device) => {
  // Store token and country in localStorage for the dashboard page
  localStorage.setItem('patToken', patToken.value);
  localStorage.setItem('country', country.value);

  // Navigate to device dashboard
  router.push({
    name: 'device-dashboard',
    params: { deviceId: device.deviceId },
    query: {
      name: device.deviceInfo.alias,
      type: formatDeviceType(device.deviceInfo.deviceType)
    }
  });
};

// Reset token
const resetToken = () => {
  hasToken.value = false;
  devices.value = [];
  patToken.value = '';
  localStorage.removeItem('patToken');
  localStorage.removeItem('country');
};
</script>

<style scoped>
code {
  font-family: 'Courier New', monospace;
  border-radius: 4px;
  padding: 2px 6px;
}
</style>
