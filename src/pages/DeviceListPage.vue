<template>
  <q-page class="dl-page">

    <!-- Header -->
    <div class="dl-header sticky-header">
      <div class="dl-header-inner">
        <div class="dl-header-icon">
          <q-icon name="bolt" size="24px" color="white" />
        </div>
        <div>
          <div class="dl-header-title">LG ThinQ Energy Monitor</div>
          <div class="dl-header-sub">Your connected devices</div>
        </div>
        <q-space />
        <ProfileMenu />
      </div>
    </div>

    <div class="dl-content">

      <!-- Loading skeleton -->
      <div v-if="loading" class="dl-loading">
        <q-spinner size="40px" color="primary" />
        <div class="q-mt-sm text-grey-6 text-caption">Fetching devices...</div>
      </div>

      <!-- Error banner -->
      <q-banner v-if="error" class="dl-error-banner" rounded>
        <template v-slot:avatar><q-icon name="error_outline" color="negative" /></template>
        {{ error }}
        <template v-slot:action>
          <q-btn flat label="Dismiss" color="negative" @click="error = null" />
        </template>
      </q-banner>

      <!-- Device list -->
      <div v-if="devices.length > 0">
        <div class="dl-section-header">
          <div class="dl-section-title">
            <q-icon name="devices" size="18px" class="q-mr-xs text-primary" />
            Your Devices
            <q-chip dense color="primary" text-color="white" size="sm" class="q-ml-sm">
              {{ devices.length }}
            </q-chip>
          </div>
          <q-btn flat round dense icon="refresh" color="primary" @click="fetchDevices" :loading="loading">
            <q-tooltip>Refresh devices</q-tooltip>
          </q-btn>
        </div>

        <div class="dl-device-grid">
          <div
            v-for="device in devices"
            :key="device.deviceId"
            class="dl-device-card"
            @click="selectDevice(device)"
          >
            <div class="dl-device-icon-wrap">
              <q-icon name="air" size="28px" color="white" />
            </div>
            <div class="dl-device-info">
              <div class="dl-device-name">{{ device.deviceInfo.alias || 'Unnamed Device' }}</div>
              <div class="dl-device-meta">{{ formatDeviceType(device.deviceInfo.deviceType) }}</div>
              <div class="dl-device-model">{{ device.deviceInfo.modelName }}</div>
            </div>
            <div class="dl-device-right">
              <q-badge
                :color="device.deviceInfo.reportable ? 'positive' : 'warning'"
                :label="device.deviceInfo.reportable ? 'Active' : 'Inactive'"
                class="dl-status-badge"
              />
              <q-icon name="chevron_right" size="20px" color="grey-4" class="q-mt-sm" />
            </div>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-else-if="!loading" class="dl-empty">
        <div class="dl-empty-icon">
          <q-icon name="devices_off" size="36px" color="blue-4" />
        </div>
        <div class="dl-empty-title">No Devices Found</div>
        <div class="dl-empty-sub">Make sure your devices are registered in the LG ThinQ app</div>
        <q-btn label="Retry" color="primary" unelevated class="q-mt-lg dl-retry-btn" @click="fetchDevices" icon="refresh" />
      </div>

    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import { useDeviceStore } from 'src/stores/deviceStore';
import { useAuthStore } from 'src/stores/authStore';
import { auth } from 'src/boot/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import ProfileMenu from 'src/components/ProfileMenu.vue';

const $q = useQuasar();
const router = useRouter();
const deviceStore = useDeviceStore();
const authStore = useAuthStore();

const devices = ref([]);
const loading = ref(false);
const error = ref(null);

const baseUrl = 'https://api-kic.lgthinq.com';
const clientId = 'quasar-dashboard-001';
const apiKey = 'v6GFvkweNo7DK7yD3ylIZ9w52aKBU0eJ7wLXkSR3';

const generateMessageId = () => Math.random().toString(36).substring(2, 24);

let unsubscribeAuth = null;
let initialized = false;

onMounted(() => {
  unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
    if (!firebaseUser) {
      router.replace('/signin');
      return;
    }

    // Only run init logic once per mount
    if (initialized) return;
    initialized = true;

    authStore.setUser(firebaseUser);

    try {
      const credentials = await authStore.loadCredentials();
      if (!credentials) {
        router.replace('/signin');
        return;
      }
      fetchDevices();
    } catch {
      router.replace('/signin');
    }
  });
});

onUnmounted(() => {
  if (unsubscribeAuth) unsubscribeAuth();
  initialized = false;
});

const fetchDevices = async () => {
  if (loading.value) return;
  loading.value = true;
  error.value = null;

  const credentials = await authStore.loadCredentials();
  const patToken = credentials?.patToken;
  const country = credentials?.country;

  if (!patToken || !country) {
    loading.value = false;
    error.value = 'Session expired. Please log in again.';
    return;
  }

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
  deviceStore.setDevice({
    deviceId: device.deviceId,
    name: device.deviceInfo.alias || 'Unnamed Device',
    type: formatDeviceType(device.deviceInfo.deviceType)
  });
  router.push({ name: 'device-dashboard' });
};

</script>

<style scoped>
.dl-page {
  background: #f4f6fb;
  min-height: 100vh;
}

/* Header */
.dl-header {
  background: linear-gradient(135deg, #1565c0 0%, #1976d2 60%, #1e88e5 100%);
  padding: 0 20px;
}
.dl-header-inner {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 0;
}
.dl-header-icon {
  width: 46px;
  height: 46px;
  border-radius: 12px;
  background: rgba(255,255,255,0.18);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.dl-header-title {
  font-size: 20px;
  font-weight: 700;
  color: white;
  line-height: 1.2;
}
.dl-header-sub {
  font-size: 12px;
  color: rgba(255,255,255,0.72);
}

/* Content */
.dl-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px 16px;
}

/* Loading */
.dl-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 0;
}

/* Error */
.dl-error-banner {
  border-radius: 12px;
  margin-bottom: 16px;
  border: 1px solid #ffcdd2;
}

/* Section header */
.dl-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}
.dl-section-title {
  display: flex;
  align-items: center;
  font-size: 15px;
  font-weight: 700;
  color: #1a1a1a;
}

/* Device grid */
.dl-device-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.dl-device-card {
  display: flex;
  align-items: center;
  gap: 16px;
  background: white;
  border-radius: 16px;
  padding: 16px 18px;
  border: 1.5px solid #e3eaf5;
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
}
.dl-device-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(25, 118, 210, 0.12);
  border-color: #90caf9;
}

.dl-device-icon-wrap {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: linear-gradient(135deg, #1565c0, #1e88e5);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.dl-device-info {
  flex: 1;
}
.dl-device-name {
  font-size: 15px;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 3px;
}
.dl-device-meta {
  font-size: 12px;
  color: #777;
  margin-bottom: 2px;
}
.dl-device-model {
  font-size: 11px;
  color: #aaa;
  font-family: monospace;
}
.dl-device-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}
.dl-status-badge {
  font-size: 11px;
  font-weight: 600;
  border-radius: 6px;
  padding: 3px 8px;
}

/* Empty state */
.dl-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80px 20px;
  text-align: center;
}
.dl-empty-icon {
  width: 80px;
  height: 80px;
  border-radius: 20px;
  background: #e3f2fd;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}
.dl-empty-title {
  font-size: 18px;
  font-weight: 700;
  color: #333;
  margin-bottom: 6px;
}
.dl-empty-sub {
  font-size: 13px;
  color: #aaa;
  max-width: 280px;
}
.dl-retry-btn {
  border-radius: 10px;
  padding: 8px 24px;
  font-weight: 600;
}

@media (max-width: 599px) {
  .dl-header-title { font-size: 17px; }
  .dl-device-card { padding: 14px; gap: 12px; }
  .dl-device-icon-wrap { width: 44px; height: 44px; border-radius: 11px; }
}
</style>
