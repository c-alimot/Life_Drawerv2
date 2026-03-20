import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuthStore } from '@store';
import { useEffect, useState } from 'react';
import { SplashScreen } from '@features/splash/screens/SplashScreen';

export default function RootLayout() {
  const { session, fetchSession } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await fetchSession();
      } catch (error) {
        console.error('Error checking auth:', error);
      } finally {
        setIsChecking(false);
      }
    };

    checkAuth();
  }, [fetchSession]);

  if (isChecking) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <SplashScreen />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        >
          {!session ? (
            <>
              <Stack.Screen name="login" />
              <Stack.Screen name="signup" />
            </>
          ) : (
            <Stack.Screen name="(tabs)" />
          )}
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}