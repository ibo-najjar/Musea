import { requireNativeModule } from 'expo';
import { EventSubscription } from 'expo-modules-core';

type AddTabInterceptorModule = {
  setInterceptedTabIndex(index: number): void;
  addListener(eventName: string, listener: () => void): EventSubscription;
};

const nativeModule = requireNativeModule<AddTabInterceptorModule>('AddTabInterceptor');

export function setInterceptedTabIndex(index: number): void {
  nativeModule.setInterceptedTabIndex(index);
}

export function addInterceptedTabPressListener(listener: () => void): EventSubscription {
  return nativeModule.addListener('onInterceptedTabPress', listener);
}
