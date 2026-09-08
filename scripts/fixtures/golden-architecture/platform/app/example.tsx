import { Dimensions, Platform, useWindowDimensions } from 'react-native';

export function Example() {
  const viewport = useWindowDimensions();
  const width = Dimensions.get('window').width;
  const native = Platform.OS === 'ios';
  const web = window.innerWidth > 900 || matchMedia('(min-width: 900px)').matches;
  return <>{String(viewport.width + width + Number(native) + Number(web))}</>;
}
