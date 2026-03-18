import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { RootNavigator } from '@navigation/stacks/RootStack';
import { testSupabaseConnection } from '@services/supabase/test';

export default function RootLayout() {
  useEffect(() => {
    testSupabaseConnection();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <RootNavigator />
    </GestureHandlerRootView>
  );
}