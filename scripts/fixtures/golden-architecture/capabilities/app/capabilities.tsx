import * as SecureStore from 'expo-secure-store';
import { AppState } from 'react-native';

export function CapabilityBypass() {
  void SecureStore.getItemAsync('token');
  return AppState.currentState;
}
