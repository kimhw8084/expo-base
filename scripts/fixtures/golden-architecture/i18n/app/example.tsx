import { I18nManager, View } from 'react-native';

export function Example() {
  const price = new Intl.NumberFormat('en-US').format(1234.5);
  const direction = I18nManager.isRTL ? 'rtl' : 'ltr';
  return <View style={{ direction }}>{price}</View>;
}
