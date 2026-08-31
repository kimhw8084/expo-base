import {useEffect,useRef} from 'react';
import {AccessibilityInfo,Platform,Text as RNText} from 'react-native';
import {normalizeLiveMessage,shouldAnnounceChange} from '@precision-calm/platform';
export type LivePoliteness='polite'|'assertive';
export function LiveRegion({message,politeness='polite'}:{message:string;politeness?:LivePoliteness | undefined}){const previous=useRef<string | undefined>(undefined);const normalized=normalizeLiveMessage(message);useEffect(()=>{if(Platform.OS==='ios'&&shouldAnnounceChange(previous.current,normalized))AccessibilityInfo.announceForAccessibility(normalized);previous.current=normalized;},[normalized]);return <RNText accessibilityLiveRegion={politeness} aria-live={politeness}>{normalized}</RNText>}
