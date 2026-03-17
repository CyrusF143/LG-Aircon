import { defineStore } from 'pinia';
import { ref } from 'vue';
import { db, auth } from 'src/boot/firebase';
import { ref as dbRef, set, get } from 'firebase/database';

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null);

  const setUser = (firebaseUser) => {
    user.value = firebaseUser;
  };

  // Returns the active user from Pinia store OR Firebase directly (survives page refresh)
  const getActiveUser = () => user.value || auth.currentUser;

  const saveCredentials = async (patToken, country) => {
    const activeUser = getActiveUser();
    if (!activeUser) return;
    await set(dbRef(db, `users/${activeUser.uid}`), { patToken, country });
  };

  const loadCredentials = async () => {
    const activeUser = getActiveUser();
    if (!activeUser) return null;
    // Keep store in sync
    if (!user.value) user.value = activeUser;
    const snapshot = await get(dbRef(db, `users/${activeUser.uid}`));
    return snapshot.exists() ? snapshot.val() : null;
  };

  return { user, setUser, saveCredentials, loadCredentials };
});
