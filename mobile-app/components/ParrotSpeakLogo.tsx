import React from 'react';
import { View, Image } from 'react-native';

interface ParrotSpeakLogoProps {
  width?: number;
  height?: number;
  style?: any;
}

export default function ParrotSpeakLogo({ 
  width = 35, 
  height = 35, 
  style 
}: ParrotSpeakLogoProps) {
  try {
    return (
      <View 
        style={[
          {
            width: width,
            height: height,
            justifyContent: 'center',
            alignItems: 'center',
          },
          style
        ]}
      >
        <Image
          source={require('../assets/parrotspeak-logo.png')}
          style={{
            width: width,
            height: height,
            resizeMode: 'contain',
          }}
          accessibilityLabel="ParrotSpeak Logo"
        />
      </View>
    );
  } catch (error) {
    // Fallback in case of any errors with the image
    return (
      <View style={[{
        width: width,
        height: height,
        backgroundColor: '#4ade80',
        borderRadius: width / 2,
        justifyContent: 'center',
        alignItems: 'center',
      }, style]}>
        <Text style={{ 
          fontSize: Math.max(width * 0.6, 16),
          fontWeight: 'bold',
          color: 'white',
        }}>
          🦜
        </Text>
      </View>
    );
  }
}