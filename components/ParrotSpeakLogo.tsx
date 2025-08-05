import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

export default function ParrotSpeakLogo() {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Image
          source={require('../assets/parrotspeak-logo.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
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
  logoImage: {
    width: 32,
    height: 32,
  },
  text: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3366FF',
  },
});