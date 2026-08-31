import type { IconName } from '@precision-calm/icons';
import { Icon } from '@precision-calm/icons';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Button } from '@precision-calm/components';
import { Text, VStack } from '@precision-calm/primitives';

export type StateKind='empty'|'noResults'|'error'|'offline'|'permission'|'reconnect'|'maintenance';
const defaults:Record<StateKind,{icon:IconName;title:string;message:string}>={
  empty:{icon:'plus',title:'Nothing here yet',message:'Create or connect something to get started.'},
  noResults:{icon:'search',title:'No matching results',message:'Change your filters or broaden your search.'},
  error:{icon:'warning',title:'Something went wrong',message:'Try again. If the problem continues, the service may be temporarily unavailable.'},
  offline:{icon:'warning',title:'You are offline',message:'Check your connection. Previously loaded information may still be available.'},
  permission:{icon:'lock',title:'Permission required',message:'Grant the required access to continue this workflow.'},
  reconnect:{icon:'refresh',title:'Connection needs attention',message:'Reconnect this source to resume automatic updates.'},
  maintenance:{icon:'settings',title:'Temporarily unavailable',message:'This area is undergoing maintenance. Try again later.'},
};
export interface StateViewProps { kind:StateKind; title?:string | undefined; message?:string | undefined; actionLabel?:string | undefined; onAction?:(()=>void) | undefined; secondaryLabel?:string | undefined; onSecondary?:(()=>void) | undefined; }
export function StateView({kind,title,message,actionLabel,onAction,secondaryLabel,onSecondary}:StateViewProps){const d=defaults[kind];return <View accessibilityRole={kind==='error'?'alert':undefined} style={styles.root}><View style={styles.icon}><Icon name={d.icon} size="lg" tone={kind==='error'?'negative':kind==='offline'||kind==='reconnect'?'warning':'secondary'}/></View><VStack align="center" gap="sm"><Text variant="h3" align="center">{title??d.title}</Text><Text tone="secondary" align="center">{message??d.message}</Text></VStack>{actionLabel&&onAction?<Button label={actionLabel} onPress={onAction}/>:null}{secondaryLabel&&onSecondary?<Button label={secondaryLabel} variant="ghost" onPress={onSecondary}/>:null}</View>}
const styles=StyleSheet.create((theme)=>({root:{minWidth:0,alignItems:'center',justifyContent:'center',padding:theme.spacing.xxl,gap:theme.spacing.md},icon:{width:theme.feedbackMetrics.stateIconBox,height:theme.feedbackMetrics.stateIconBox,borderRadius:theme.radii.lg,backgroundColor:theme.colors.background.subtle,alignItems:'center',justifyContent:'center'}}));
