import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export async function readToken(key: string) {
  return Platform.OS === 'web'
    ? globalThis.sessionStorage.getItem(key)
    : SecureStore.getItemAsync(key);
}

export async function writeToken(key: string, value: string | null) {
  if (Platform.OS === 'web') {
    if (value) globalThis.sessionStorage.setItem(key, value);
    else globalThis.sessionStorage.removeItem(key);
  } else if (value) await SecureStore.setItemAsync(key, value);
  else await SecureStore.deleteItemAsync(key);
}
