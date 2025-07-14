import React from 'react';
import { View, Text } from 'react-native';

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
            backgroundColor: '#4ade80',
            borderRadius: width / 2,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 2,
            borderColor: '#1f2937',
          },
          style
        ]}
      >
        <Text style={{
          fontSize: Math.max(width * 0.6, 16),
          fontWeight: 'bold',
          color: 'white',
        }}>
          P
        </Text>
      </View>
    );
  } catch (error) {
    // Fallback in case of any errors
    return (
      <View style={[{
        width: width,
        height: height,
        backgroundColor: '#dc2626',
        borderRadius: width / 2,
        justifyContent: 'center',
        alignItems: 'center',
      }, style]}>
        <Text style={{ color: 'white', fontWeight: 'bold' }}>!</Text>
      </View>
    );
  }
}