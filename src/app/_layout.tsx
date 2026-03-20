import { SplashScreen } from "@features/splash/screens/SplashScreen";
import { useAuthStore } from "@store";
import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  const { isAuthenticated } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Check authentication status on mount
    setIsChecking(false);
  }, []);

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
          {!isAuthenticated ? (
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
