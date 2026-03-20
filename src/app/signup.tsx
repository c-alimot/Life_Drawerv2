import { View, Text, StyleSheet } from 'react-native';

export default function SignupScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Signup Screen</Text>
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
