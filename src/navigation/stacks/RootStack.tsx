import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '@store';
import { useAuth } from '@features/auth/hooks/useAuth';
import { AuthStack } from './AuthStack';
import { MainStack } from './MainStack';
import type { RootStackParamList } from '../types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { user, isLoading: authLoading } = useAuthStore();
  const { initializeAuth } = useAuth();

  useEffect(() => {
    initializeAuth();
  }, []);

  if (authLoading) {
    return null; // Or show splash screen
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animationEnabled: true,
        }}
      >
        {user ? (
          <Stack.Group>
            <Stack.Screen name="MainTabs" component={MainStack} />
          </Stack.Group>
        ) : (
          <Stack.Group>
            <Stack.Screen name="Auth" component={AuthStack} />
          </Stack.Group>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}