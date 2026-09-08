import { KeyboardAvoidingView, Switch, TextInput } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

export function Example() { return <KeyboardAvoidingView><TextInput /><Switch />{DateTimePicker ? null : null}</KeyboardAvoidingView>; }
