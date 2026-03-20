import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useEffect } from 'react';

export default function LoginScreen() {
  const navigation = useNavigation();

  useEffect(() => {
    // Navigate to home temporarily to show something
    // TODO: Implement actual login screen
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Login Screen</Text>
      <Text style={styles.subtitle}>(Not yet implemented)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
});
