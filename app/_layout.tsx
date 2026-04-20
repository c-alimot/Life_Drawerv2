import { authApi } from "@features/auth/api/auth.api";
import {
  Roboto_400Regular,
  Roboto_500Medium,
  Roboto_700Bold,
} from "@expo-google-fonts/roboto";
import {
  getOnboardingCompleted,
} from "@features/auth/utils/onboarding";
import { supabase } from "@services/supabase";
import type { Profile } from "@types";
import { useAuthStore } from "@store";
import { useFonts } from "expo-font";
import { Stack, usePathname, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

const BOOT_TIMEOUT_MS = 12000;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error("BOOTSTRAP_TIMEOUT"));
    }, timeoutMs);

    promise
      .then((value) => {
        clearTimeout(timeoutId);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
}

function mapSessionUserToProfile(
  sessionUser: {
    id: string;
    email?: string | null;
    user_metadata?: Record<string, unknown>;
    created_at?: string;
    updated_at?: string;
  },
): Profile {
  const displayName =
    typeof sessionUser.user_metadata?.display_name === "string"
      ? sessionUser.user_metadata.display_name
      : undefined;
  const avatarUrl =
    typeof sessionUser.user_metadata?.avatar_url === "string"
      ? sessionUser.user_metadata.avatar_url
      : undefined;

  return {
    id: sessionUser.id,
    email: sessionUser.email || "",
    displayName,
    avatarUrl,
    createdAt: sessionUser.created_at || new Date().toISOString(),
    updatedAt:
      sessionUser.updated_at || sessionUser.created_at || new Date().toISOString(),
  };
}

export default function RootLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const [fontsLoaded] = useFonts({
    Roboto_400Regular,
    Roboto_500Medium,
    Roboto_700Bold,
  });
  const { user, setUser, setLoading } = useAuthStore();
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboardingState] =
    useState(false);
  const [bootError, setBootError] = useState<string | null>(null);

  const runBootstrap = useCallback(
    async (isMountedRef: { current: boolean }) => {
      const start = Date.now();
      console.info("[boot] bootstrap start");
      setBootError(null);
      setIsBootstrapping(true);
      setLoading(true);

      try {
        const initResult = await withTimeout(
          Promise.all([getOnboardingCompleted(), supabase.auth.getSession()]),
          BOOT_TIMEOUT_MS,
        );

        if (!isMountedRef.current) return;

        const [onboardingCompleted, sessionResponse] = initResult;
        const sessionUser = sessionResponse.data.session?.user ?? null;

        setHasCompletedOnboardingState(onboardingCompleted);
        setUser(sessionUser ? mapSessionUserToProfile(sessionUser) : null);

        console.info("[boot] bootstrap success", {
          elapsedMs: Date.now() - start,
          hasSession: !!sessionUser,
          onboardingCompleted,
        });

        // Background profile hydration so first paint is not blocked on profile/avatar work.
        if (sessionUser) {
          authApi
            .getSession()
            .then((sessionResult) => {
              if (!isMountedRef.current) return;
              if (sessionResult.data?.user) {
                setUser(sessionResult.data.user);
                console.info("[boot] profile hydration success");
              }
            })
            .catch((error) => {
              console.warn("[boot] profile hydration failed", error);
            });
        }
      } catch (error) {
        if (!isMountedRef.current) return;

        console.error("[boot] bootstrap failed", error);
        setUser(null);
        setBootError(
          "We couldn't finish loading Life Drawer. Please try again.",
        );
      } finally {
        if (!isMountedRef.current) return;
        setLoading(false);
        setIsBootstrapping(false);
      }
    },
    [setLoading, setUser],
  );

  useEffect(() => {
    const isMountedRef = { current: true };

    runBootstrap(isMountedRef);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMountedRef.current) return;
      console.info("[boot] auth state change", {
        hasSession: !!session,
      });

      if (!session) {
        setUser(null);
        return;
      }

      setUser(mapSessionUserToProfile(session.user));
      authApi
        .getSession()
        .then((sessionResult) => {
          if (!isMountedRef.current) return;
          setUser(sessionResult.data?.user || mapSessionUserToProfile(session.user));
        })
        .catch((error) => {
          console.warn("[boot] auth change profile refresh failed", error);
        });
    });

    return () => {
      isMountedRef.current = false;
      subscription.unsubscribe();
    };
  }, [runBootstrap, setUser]);

  useEffect(() => {
    if (isBootstrapping) return;
    if (bootError) return;

    const syncRoute = async () => {
      const isAuthRoute =
        pathname === "/intro" ||
        pathname === "/login" ||
        pathname === "/signup" ||
        pathname === "/onboarding";

      if (!user) {
        if (pathname !== "/onboarding") {
          router.replace("/onboarding");
        }
        return;
      }

      if (isAuthRoute) {
        router.replace("/");
      }
    };

    syncRoute();
  }, [bootError, hasCompletedOnboarding, isBootstrapping, pathname, router, user]);

  const handleRetryBootstrap = useCallback(async () => {
    const isMountedRef = { current: true };
    await runBootstrap(isMountedRef);
  }, [runBootstrap]);

  const handleReloadWeb = useCallback(() => {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.location.reload();
    }
  }, []);

  if (bootError && !isBootstrapping && fontsLoaded) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 24,
              gap: 14,
            }}
          >
            <Text
              style={{
                textAlign: "center",
                color: "#2F2924",
                fontSize: 16,
                lineHeight: 24,
              }}
            >
              {bootError}
            </Text>
            <TouchableOpacity
              onPress={handleRetryBootstrap}
              accessibilityRole="button"
              accessibilityLabel="Retry app startup"
              style={{
                minHeight: 46,
                borderRadius: 999,
                backgroundColor: "#8C9A7F",
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: 20,
              }}
            >
              <Text style={{ color: "#FFFFFF", fontSize: 15, fontWeight: "700" }}>
                Retry
              </Text>
            </TouchableOpacity>
            {Platform.OS === "web" ? (
              <TouchableOpacity
                onPress={handleReloadWeb}
                accessibilityRole="button"
                accessibilityLabel="Reload app"
              >
                <Text style={{ color: "#556950", fontSize: 14, fontWeight: "600" }}>
                  Reload
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  if (isBootstrapping || !fontsLoaded) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ActivityIndicator size="large" />
          </View>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  const analytics =
    Platform.OS === "web"
      ? (() => {
          const { Analytics } = require("@vercel/analytics/react");

          return <Analytics />;
        })()
      : null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="intro" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="login" />
          <Stack.Screen name="signup" />
        </Stack>
        {analytics}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
