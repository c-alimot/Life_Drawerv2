import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '@features/home/screens/HomeScreen';
import { CreateEntryScreen } from '@features/entries/screens/CreateEntryScreen';
import { EntryDetailScreen } from '@features/entries/screens/EntryDetailScreen';
import { EditEntryScreen } from '@features/entries/screens/EditEntryScreen';
import { LifePhasesScreen } from '@features/home/screens/LifePhasesScreen';
import { SearchScreen } from '@features/search/screens/SearchScreen';

const Stack = createNativeStackNavigator();

export function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="CreateEntry" component={CreateEntryScreen} />
        <Stack.Screen name="EntryDetail" component={EntryDetailScreen} />
        <Stack.Screen name="EditEntry" component={EditEntryScreen} />
        <Stack.Screen name="LifePhases" component={LifePhasesScreen} />
        <Stack.Screen name="Search" component={SearchScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}