import { StyleSheet, View } from 'react-native';

const routeSpacing = 17;
const routeColor = '#ffffff';
const styles = StyleSheet.create({
  card: { padding: 17, marginTop: routeSpacing, borderRadius: 9, backgroundColor: routeColor, boxShadow: '0 2px 8px #000000' },
});

export function Example() { return <View style={styles.card} />; }
