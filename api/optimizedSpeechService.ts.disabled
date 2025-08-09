import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { API_BASE_URL } from './config';
import { mobileFetch } from '../utils/networkUtils';

// Audio configuration for optimal performance
const RECORDING_OPTIONS = {
  isMeteringEnabled: false, // Disable metering to reduce overhead
  android: {
    extension: '.m4a',
    outputFormat: 2, // MPEG_4
    audioEncoder: 3, // AAC
    sampleRate: 16000, // Lower sample rate for faster processing
    numberOfChannels: 1, // Mono for smaller files
    bitRate: 64000, // Lower bitrate for faster upload
  },
  ios: {
    extension: '.m4a',
    outputFormat: 'MPEG4AAC',
    audioQuality: 32, // Medium quality
    sampleRate: 16000,
    numberOfChannels: 1,
    bitRate: 64000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {
    mimeType: 'audio/webm',
    bitsPerSecond: 64000,
  }
};

// Parallel processing for audio operations
export async function processRecordingOptimized(
  uri: string, 
  languageCode: string
): Promise<string> {
  const startTime = Date.now();
  
  try {
    // Start reading file info and converting to base64 in parallel
    const [fileInfo, base64Audio] = await Promise.all([
      FileSystem.getInfoAsync(uri),
      FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      })
    ]);
    
    console.log(`📊 Audio file size: ${((fileInfo as any).size / 1024).toFixed(2)}KB`);
    
    // Send to server with optimized headers
    const response = await mobileFetch(`${API_BASE_URL}/api/transcribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept-Encoding': 'gzip', // Request compressed response
      },
      body: JSON.stringify({
        audio: base64Audio,
        language: languageCode
      })
    });
    
    if (!response.ok) {
      throw new Error(`Transcription failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    const processingTime = Date.now() - startTime;
    console.log(`⚡ Optimized transcription completed in ${processingTime}ms`);
    
    return data.text;
  } catch (error) {
    console.error('Error in optimized speech recognition:', error);
    throw error;
  } finally {
    // Clean up the temporary file asynchronously (don't wait)
    FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => {});
  }
}

// Preload audio module for faster first recording
export async function preloadAudioModule(): Promise<void> {
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      playThroughEarpieceAndroid: false,
      staysActiveInBackground: false,
    });
    console.log('✅ Audio module preloaded');
  } catch (error) {
    console.error('Failed to preload audio module:', error);
  }
}

// Optimized recording with custom options
let recording: Audio.Recording | null = null;

export async function startRecordingOptimized(): Promise<{ uri: string }> {
  try {
    // Request permissions
    const permission = await Audio.requestPermissionsAsync();
    if (!permission.granted) {
      throw new Error('Audio recording permission not granted');
    }
    
    // Configure audio mode for recording
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      playThroughEarpieceAndroid: false,
      staysActiveInBackground: false,
    });
    
    // Create and start recording with optimized settings
    recording = new Audio.Recording();
    await recording.prepareToRecordAsync(RECORDING_OPTIONS);
    await recording.startAsync();
    
    console.log('⚡ Optimized recording started');
    return { uri: recording.getURI() || '' };
    
  } catch (error) {
    console.error('Error starting optimized recording:', error);
    throw error;
  }
}

export async function stopRecordingOptimized(): Promise<{ uri: string; duration?: number }> {
  try {
    if (!recording) {
      throw new Error('No recording in progress');
    }
    
    // Stop recording and get status in parallel
    const [_, status] = await Promise.all([
      recording.stopAndUnloadAsync(),
      recording.getStatusAsync()
    ]);
    
    const uri = recording.getURI();
    recording = null;
    
    // Reset audio mode asynchronously (don't wait)
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      playThroughEarpieceAndroid: false,
      staysActiveInBackground: false,
    }).catch(() => {});
    
    console.log('⚡ Optimized recording stopped');
    return { 
      uri: uri || '', 
      duration: status && status.durationMillis ? status.durationMillis : undefined 
    };
    
  } catch (error) {
    console.error('Error stopping optimized recording:', error);
    recording = null;
    throw error;
  }
}