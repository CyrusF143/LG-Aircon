<template>
  <q-btn round flat icon="account_circle" size="md">
    <q-menu anchor="bottom right" self="top right">
      <q-list style="min-width: 150px">
        <q-item-label header class="text-grey-8">Account</q-item-label>
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
import { useRouter } from 'vue-router';

const router = useRouter();

const logout = () => {
  localStorage.removeItem('patToken');
  localStorage.removeItem('country');
  localStorage.removeItem('appUser');
  router.push('/signin');
};
</script>
