<template>
  <q-page class="flex flex-center bg-grey-2">
    <q-card style="width: 420px; max-width: 95vw;">
      <!-- Card Header -->
      <q-card-section class="bg-primary text-white text-center q-py-lg">
        <q-icon name="bolt" size="48px" />
        <div class="text-h5 q-mt-sm">LG ThinQ Energy Monitor</div>
        <div class="text-subtitle2 text-blue-2">
          {{ isNewUser ? 'Create an account to get started' : 'Sign in to your account' }}
        </div>
      </q-card-section>

      <q-card-section class="q-gutter-md q-pt-lg">
        <q-input
          v-model="username"
          label="Username *"
          outlined
          :rules="[val => !!val || 'Username is required']"
          autocomplete="username"
        >
          <template v-slot:prepend>
            <q-icon name="person" />
          </template>
        </q-input>

        <q-input
          v-model="password"
          label="Password *"
          :type="showPassword ? 'text' : 'password'"
          outlined
          :rules="[val => !!val || 'Password is required', val => val.length >= 6 || 'Minimum 6 characters']"
          autocomplete="current-password"
        >
          <template v-slot:prepend>
            <q-icon name="lock" />
          </template>
          <template v-slot:append>
            <q-icon
              :name="showPassword ? 'visibility_off' : 'visibility'"
              class="cursor-pointer"
              @click="showPassword = !showPassword"
            />
          </template>
        </q-input>

        <template v-if="isNewUser">
          <q-input
            v-model="country"
            label="Country Code *"
            outlined
            hint="ISO 3166-1 alpha-2 (e.g., PH, US, KR)"
            :rules="[val => !!val || 'Country code is required']"
          >
            <template v-slot:prepend>
              <q-icon name="flag" />
            </template>
          </q-input>

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
        </template>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <q-btn
          :label="isNewUser ? 'Create Account' : 'Sign In'"
          color="primary"
          class="full-width"
          size="lg"
          @click="submit"
          :loading="loading"
          :disable="!canSubmit"
        />

        <div class="text-center q-mt-md">
          <span class="text-grey-7 text-caption">
            {{ isNewUser ? 'Already have an account?' : "Don't have an account?" }}
          </span>
          <q-btn
            flat
            dense
            size="sm"
            :label="isNewUser ? 'Sign In' : 'Create Account'"
            color="primary"
            @click="toggleMode"
            class="q-ml-xs"
          />
        </div>
      </q-card-section>

      <!-- Error Display -->
      <q-card-section class="q-pt-none" v-if="error">
        <q-banner class="bg-negative text-white" rounded>
          <template v-slot:avatar>
            <q-icon name="error" />
          </template>
          {{ error }}
        </q-banner>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';

const $q = useQuasar();
const router = useRouter();

const username = ref('');
const password = ref('');
const country = ref('PH');
const patToken = ref('');
const showPassword = ref(false);
const loading = ref(false);
const error = ref(null);
const isNewUser = ref(!localStorage.getItem('appUser'));

const baseUrl = 'https://api-kic.lgthinq.com';
const clientId = 'quasar-dashboard-001';
const apiKey = 'v6GFvkweNo7DK7yD3ylIZ9w52aKBU0eJ7wLXkSR3';

const generateMessageId = () => Math.random().toString(36).substring(2, 24);

const canSubmit = computed(() => {
  if (!username.value || !password.value) return false;
  if (isNewUser.value && (!country.value || !patToken.value)) return false;
  return true;
});

const toggleMode = () => {
  isNewUser.value = !isNewUser.value;
  error.value = null;
};

const submit = async () => {
  error.value = null;

  if (isNewUser.value) {
    await createAccount();
  } else {
    signIn();
  }
};

const createAccount = async () => {
  loading.value = true;

  try {
    // Validate PAT token by fetching devices
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
      // Save account and credentials
      localStorage.setItem('appUser', JSON.stringify({ username: username.value, password: password.value }));
      localStorage.setItem('patToken', patToken.value);
      localStorage.setItem('country', country.value);

      $q.notify({ type: 'positive', message: 'Account created! Please sign in.', icon: 'check_circle' });
      isNewUser.value = false;
      username.value = '';
      password.value = '';
      patToken.value = '';
    } else if (data.error) {
      throw new Error(data.error.message || 'Invalid PAT token');
    } else {
      throw new Error('Invalid response from API');
    }
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

const DEFAULT_ACCOUNT = {
  username: 'admin',
  password: 'admin123',
  patToken: 'thinqpat_84c4f9d0c174baf6a48b85bc4d34e6791978fba9e6521296af4c',
  country: 'PH'
};

const signIn = () => {
  // Check default admin account
  if (username.value === DEFAULT_ACCOUNT.username && password.value === DEFAULT_ACCOUNT.password) {
    localStorage.setItem('patToken', DEFAULT_ACCOUNT.patToken);
    localStorage.setItem('country', DEFAULT_ACCOUNT.country);
    localStorage.setItem('appUser', JSON.stringify({ username: DEFAULT_ACCOUNT.username, password: DEFAULT_ACCOUNT.password }));
    $q.notify({ type: 'positive', message: `Welcome back, ${username.value}!`, icon: 'check_circle' });
    router.replace('/');
    return;
  }

  // Check user-created account
  const stored = JSON.parse(localStorage.getItem('appUser') || 'null');

  if (!stored) {
    error.value = 'No account found. Please create one first.';
    return;
  }

  if (stored.username !== username.value || stored.password !== password.value) {
    error.value = 'Incorrect username or password.';
    return;
  }

  $q.notify({ type: 'positive', message: `Welcome back, ${username.value}!`, icon: 'check_circle' });
  router.replace('/');
};
</script>
