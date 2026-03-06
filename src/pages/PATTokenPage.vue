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
      <q-card>
        <q-card-section>
          <div class="text-h6 q-mb-md">Enter Your PAT Token</div>

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
            @click="connect"
            :loading="loading"
            :disable="!patToken || !country"
          />
        </q-card-section>
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
    </div>
  </q-page>
</template>

<script setup>
import { ref } from 'vue';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';

const $q = useQuasar();
const router = useRouter();

const patToken = ref('');
const country = ref('PH');
const loading = ref(false);
const error = ref(null);

const baseUrl = 'https://api-kic.lgthinq.com';
const clientId = 'quasar-dashboard-001';
const apiKey = 'v6GFvkweNo7DK7yD3ylIZ9w52aKBU0eJ7wLXkSR3';

const generateMessageId = () => Math.random().toString(36).substring(2, 24);

const connect = async () => {
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
      localStorage.setItem('patToken', patToken.value);
      localStorage.setItem('country', country.value);

      $q.notify({
        type: 'positive',
        message: 'Connected successfully',
        icon: 'check_circle'
      });

      router.push('/');
    } else if (data.error) {
      throw new Error(data.error.message || 'Failed to connect');
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
</script>
