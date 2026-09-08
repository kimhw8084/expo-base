import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

export async function Example() {
  await fetch('/api/profile');
  await axios.get('/api/profile');
  await AsyncStorage.getItem('profile');
  return localStorage.getItem('profile');
}
