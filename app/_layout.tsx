import { authApi } from "@features/auth/api/auth.api";
import {
  getOnboardingCompleted,
} from "@features/auth/utils/onboarding";
import { supabase } from "@services/supabase";
import type { Profile } from "@types";
import { useAuthStore } from "@store";
import { Stack, usePathname, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, setUser, setLoading } = useAuthStore();
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboardingState] =
    useState(false);

  const mapSessionUserToProfile = (
    sessionUser: {
      id: string;
      email?: string | null;
      user_metadata?: Record<string, unknown>;
      created_at?: string;
      updated_at?: string;
    },
  ): Profile => {
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
        sessionUser.updated_at ||
        sessionUser.created_at ||
        new Date().toISOString(),
    };
  };

  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      setLoading(true);

      if (!isMounted) return;

      const [onboardingCompleted, sessionResult] = await Promise.all([
        getOnboardingCompleted(),
        authApi.getSession(),
      ]);

      if (!isMounted) return;

      setHasCompletedOnboardingState(onboardingCompleted);
      setUser(sessionResult.data?.user ?? null);
      setLoading(false);
      setIsBootstrapping(false);
    };

    initialize();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return;

      if (!session) {
        setUser(null);
        return;
      }

      const sessionResult = await authApi.getSession();

      if (!isMounted) return;

      setUser(sessionResult.data?.user || mapSessionUserToProfile(session.user));
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [setLoading, setUser]);

  useEffect(() => {
    if (isBootstrapping) return;

    let isMounted = true;

    const syncRoute = async () => {
      const isAuthRoute =
        pathname === "/intro" ||
        pathname === "/login" ||
        pathname === "/signup" ||
        pathname === "/onboarding";
      const isProtectedRoute = !isAuthRoute;

      if (!user) {
        const onboardingCompleted = await getOnboardingCompleted();

        if (!isMounted) return;

        if (onboardingCompleted !== hasCompletedOnboarding) {
          setHasCompletedOnboardingState(onboardingCompleted);
        }

        if (!onboardingCompleted) {
          if (pathname !== "/onboarding") {
            router.replace("/onboarding");
          }
          return;
        }

        if (pathname === "/onboarding") {
          router.replace("/intro");
          return;
        }

        if (isProtectedRoute) {
          router.replace("/intro");
        }

        return;
      }

      if (isAuthRoute) {
        router.replace("/");
      }
    };

    syncRoute();

    return () => {
      isMounted = false;
    };
  }, [hasCompletedOnboarding, isBootstrapping, pathname, router, user]);

  if (isBootstrapping) {
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
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
