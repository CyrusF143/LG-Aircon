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
          <div class="text-subtitle2">Your connected devices</div>
        </q-card-section>
      </q-card>

      <!-- Device List -->
      <q-card v-if="devices.length > 0">
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
            @click="changeToken"
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
      <q-card v-if="devices.length === 0 && !loading">
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
import { ref, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';

const $q = useQuasar();
const router = useRouter();

const devices = ref([]);
const loading = ref(false);
const error = ref(null);

const baseUrl = 'https://api-kic.lgthinq.com';
const clientId = 'quasar-dashboard-001';
const apiKey = 'v6GFvkweNo7DK7yD3ylIZ9w52aKBU0eJ7wLXkSR3';

const generateMessageId = () => Math.random().toString(36).substring(2, 24);

onMounted(() => {
  const token = localStorage.getItem('patToken');
  if (!token) {
    router.replace('/setup');
  } else {
    fetchDevices();
  }
});

const fetchDevices = async () => {
  const patToken = localStorage.getItem('patToken');
  const country = localStorage.getItem('country');

  loading.value = true;
  error.value = null;

  try {
    const response = await fetch(`${baseUrl}/devices`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${patToken}`,
        'x-message-id': generateMessageId(),
        'x-country': country,
        'x-client-id': clientId,
        'x-api-key': apiKey
      }
    });

    const data = await response.json();

    if (data.response && Array.isArray(data.response)) {
      devices.value = data.response;

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

const formatDeviceType = (deviceType) => {
  return deviceType
    .replace('DEVICE_', '')
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, l => l.toUpperCase());
};

const selectDevice = (device) => {
  router.push({
    name: 'device-dashboard',
    params: { deviceId: device.deviceId },
    query: {
      name: device.deviceInfo.alias,
      type: formatDeviceType(device.deviceInfo.deviceType)
    }
  });
};

const changeToken = () => {
  localStorage.removeItem('patToken');
  localStorage.removeItem('country');
  router.push('/setup');
};
</script>

<style scoped>
code {
  font-family: 'Courier New', monospace;
  border-radius: 4px;
  padding: 2px 6px;
}
</style>
