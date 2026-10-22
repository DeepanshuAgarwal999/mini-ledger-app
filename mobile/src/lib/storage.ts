import * as SecureStore from 'expo-secure-store';

/** Encrypted key-value storage (Keychain / Keystore). See storage.web.ts for the web fallback. */
export const storage = {
  get: (key: string) => SecureStore.getItemAsync(key),
  set: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  remove: (key: string) => SecureStore.deleteItemAsync(key),
};
