import { Platform } from 'react-native';

export const nativeBridge = Platform.OS === 'ios' ? 'ios' : 'other';
