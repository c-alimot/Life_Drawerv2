import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '@features/auth/screens/LoginScreen';
import { SignupScreen } from '@features/auth/screens/SignupScreen';
import { OnboardingScreen } from '@features/auth/screens/OnboardingScreen';
import type { AuthStackParamList } from '../types/navigation';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animationEnabled: true,
      }}
    >
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
    </Stack.Navigator>
  );
}