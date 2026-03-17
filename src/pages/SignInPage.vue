<template>
  <q-page class="flex flex-center bg-grey-2">
    <q-card style="width: 420px; max-width: 95vw;">
      <!-- Header -->
      <q-card-section class="bg-primary text-white text-center q-py-lg">
        <q-icon name="bolt" size="48px" />
        <div class="text-h5 q-mt-sm">LG ThinQ Energy Monitor</div>
        <div class="text-subtitle2 text-blue-2">
          {{ step === 'setup' ? 'Connect your LG ThinQ account' : 'Sign in to your account' }}
        </div>
      </q-card-section>

      <!-- FirebaseUI Auth -->
      <q-card-section v-if="step === 'auth'" class="q-pa-none">
        <div id="firebaseui-auth-container" />
      </q-card-section>

      <!-- PAT Token Setup Step -->
      <template v-if="step === 'setup'">
        <q-card-section class="q-gutter-md q-pt-lg">
          <div class="text-body2 text-grey-7">
            <q-icon name="info" color="primary" class="q-mr-xs" />
            One-time setup: link your LG ThinQ account.
          </div>

          <q-input
            v-model="country"
            label="Country Code *"
            outlined
            hint="ISO 3166-1 alpha-2 (e.g., PH, US, KR)"
            :rules="[val => !!val || 'Country code is required']"
          >
            <template v-slot:prepend><q-icon name="flag" /></template>
          </q-input>

          <q-input
            v-model="patToken"
            label="PAT Token *"
            type="password"
            outlined
            hint="Get your token from https://connect-pat.lgthinq.com"
            :rules="[val => !!val || 'PAT Token is required']"
          >
            <template v-slot:prepend><q-icon name="vpn_key" /></template>
          </q-input>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-btn
            label="Save & Continue"
            color="primary"
            class="full-width"
            size="lg"
            @click="saveSetup"
            :loading="loading"
            :disable="!country || !patToken"
          />
        </q-card-section>
      </template>

      <!-- Error -->
      <q-card-section class="q-pt-none" v-if="error">
        <q-banner class="bg-negative text-white" rounded>
          <template v-slot:avatar><q-icon name="error" /></template>
          {{ error }}
        </q-banner>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import { useAuthStore } from 'src/stores/authStore';
import { auth } from 'src/boot/firebase';
import { EmailAuthProvider, GoogleAuthProvider } from 'firebase/auth';
import * as firebaseui from 'firebaseui';
import 'firebaseui/dist/firebaseui.css';

const $q = useQuasar();
const router = useRouter();
const authStore = useAuthStore();

const step = ref('auth');
const country = ref('PH');
const patToken = ref('');
const loading = ref(false);
const error = ref(null);

const baseUrl = 'https://api-kic.lgthinq.com';
const clientId = 'quasar-dashboard-001';
const apiKey = 'v6GFvkweNo7DK7yD3ylIZ9w52aKBU0eJ7wLXkSR3';
const generateMessageId = () => Math.random().toString(36).substring(2, 24);

let ui = null;


const handlePostAuth = async (firebaseUser) => {
  authStore.setUser(firebaseUser);
  const credentials = await authStore.loadCredentials();
  if (credentials) {
    $q.notify({ type: 'positive', message: `Welcome, ${firebaseUser.displayName || firebaseUser.email}!`, icon: 'check_circle' });
    router.replace('/');
    return false; // don't redirect via FirebaseUI
  } else {
    step.value = 'setup';
    return false;
  }
};

onMounted(() => {
  const uiConfig = {
    callbacks: {
      signInSuccessWithAuthResult: (authResult) => {
        handlePostAuth(authResult.user);
        return false; // prevent FirebaseUI from redirecting
      }
    },
    signInOptions: [
      {
        provider: EmailAuthProvider.PROVIDER_ID,
        signInMethod: EmailAuthProvider.EMAIL_PASSWORD_SIGN_IN_METHOD,
        requireDisplayName: false
      },
      GoogleAuthProvider.PROVIDER_ID
    ],
    signInFlow: 'popup',
    tosUrl: '',
    privacyPolicyUrl: ''
  };

  ui = firebaseui.auth.AuthUI.getInstance() || new firebaseui.auth.AuthUI(auth);
  ui.start('#firebaseui-auth-container', uiConfig);
});

onBeforeUnmount(() => {
  if (ui) ui.reset();
});

const saveSetup = async () => {
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
      await authStore.saveCredentials(patToken.value, country.value);
      $q.notify({ type: 'positive', message: 'Setup complete! Welcome.', icon: 'check_circle' });
      router.replace('/');
    } else {
      throw new Error(data.error?.message || 'Invalid PAT token or country code');
    }
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};
</script>
