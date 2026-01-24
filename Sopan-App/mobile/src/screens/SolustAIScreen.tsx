import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const SolustAIScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Solust AI</Text>
      <Text style={styles.subtitle}>(Coming Soon)</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: '#14F195',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  subtitle: {
    color: '#888',
    fontSize: 18,
  },
});
