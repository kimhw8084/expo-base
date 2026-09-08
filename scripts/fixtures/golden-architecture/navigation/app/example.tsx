import { useRouter } from 'expo-router';

export function Example() { return String(Boolean(useRouter())); }
