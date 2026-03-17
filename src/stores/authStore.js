import { defineStore } from 'pinia';
import { ref } from 'vue';
import { db, auth } from 'src/boot/firebase';
import { ref as dbRef, set, get } from 'firebase/database';
import { onAuthStateChanged } from 'firebase/auth';

// Resolves with the current user once Firebase auth is initialized (survives refresh)
const waitForAuth = () => new Promise((resolve) => {
  const unsub = onAuthStateChanged(auth, (user) => {
    unsub();
    resolve(user);
  });
});

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null);

  const setUser = (firebaseUser) => {
    user.value = firebaseUser;
  };

  const saveCredentials = async (patToken, country) => {
    const activeUser = user.value || await waitForAuth();
    if (!activeUser) return;
    await set(dbRef(db, `users/${activeUser.uid}`), { patToken, country });
  };

  const loadCredentials = async () => {
    // Wait for Firebase to restore session if Pinia was reset (page refresh)
    const activeUser = user.value || await waitForAuth();
    if (!activeUser) return null;
    if (!user.value) user.value = activeUser;
    const snapshot = await get(dbRef(db, `users/${activeUser.uid}`));
    return snapshot.exists() ? snapshot.val() : null;
  };

  return { user, setUser, saveCredentials, loadCredentials };
});
