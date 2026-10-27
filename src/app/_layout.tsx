import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { defaultShouldDehydrateMutation } from '@tanstack/react-query';
import { useColorScheme } from 'react-native';

import {
  queryCacheMaxAge,
  queryClient,
  queryPersister,
} from '@/api/queryClient';
import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';


SplashScreen.preventAutoHideAsync();

if (__DEV__) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('../../ReactotronConfig')
}


export default function TabLayout() {
  const colorScheme = useColorScheme();
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: queryPersister,
        maxAge: queryCacheMaxAge,
        dehydrateOptions: {
          shouldDehydrateMutation: (mutation) =>
            defaultShouldDehydrateMutation(mutation) || mutation.state.isPaused,
        },
      }}
      onSuccess={() => queryClient.resumePausedMutations()}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AnimatedSplashOverlay />
        <AppTabs />
      </ThemeProvider>
    </PersistQueryClientProvider>
  );
}
