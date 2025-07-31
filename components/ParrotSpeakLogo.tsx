import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ParrotSpeakLogo() {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>🦜</Text>
      </View>
      <Text style={styles.text}>ParrotSpeak</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: 8,
  },
  icon: {
    fontSize: 24,
  },
  text: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3366FF',
  },
});