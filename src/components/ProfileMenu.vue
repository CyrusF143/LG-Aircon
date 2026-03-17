<template>
  <q-btn round flat icon="account_circle" size="md">
    <q-menu anchor="bottom right" self="top right">
      <q-list style="min-width: 150px">
        <q-item-label header class="text-grey-8">{{ displayName }}</q-item-label>
        <q-separator />
        <q-item clickable v-close-popup @click="logout">
          <q-item-section avatar>
            <q-icon name="logout" color="negative" />
          </q-item-section>
          <q-item-section class="text-negative">Logout</q-item-section>
        </q-item>
      </q-list>
    </q-menu>
  </q-btn>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from 'src/stores/authStore';
import { auth } from 'src/boot/firebase';
import { signOut } from 'firebase/auth';

const router = useRouter();
const authStore = useAuthStore();

const displayName = computed(() => {
  const u = authStore.user;
  return u?.displayName || u?.email || 'Account';
});

const logout = () => {
  authStore.setUser(null);
  router.push('/signin');
  signOut(auth).catch(() => {});
};
</script>
