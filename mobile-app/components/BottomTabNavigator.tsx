import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';

type NavigationProp = StackNavigationProp<RootStackParamList>;

const { width } = Dimensions.get('window');

interface TabItem {
  key: string;
  title: string;
  icon: string;
  screen: keyof RootStackParamList;
}

const tabs: TabItem[] = [
  { key: 'home', title: 'Home', icon: 'home', screen: 'Home' },
  { key: 'conversations', title: 'Chats', icon: 'message-circle', screen: 'ConversationsList' },
  { key: 'camera', title: 'Camera', icon: 'camera', screen: 'Camera' },
  { key: 'analytics', title: 'Analytics', icon: 'bar-chart-2', screen: 'Analytics' },
  { key: 'settings', title: 'Settings', icon: 'settings', screen: 'Settings' },
];

export default function BottomTabNavigator() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();
  
  const currentRoute = route.name as keyof RootStackParamList;

  const handleTabPress = (screen: keyof RootStackParamList) => {
    navigation.navigate(screen);
  };

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = currentRoute === tab.screen;
        
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tab}
            onPress={() => handleTabPress(tab.screen)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, isActive && styles.activeIconContainer]}>
              <Icon
                name={tab.icon}
                size={20}
                color={isActive ? '#3366FF' : '#666'}
              />
            </View>
            <Text style={[styles.label, isActive && styles.activeLabel]}>
              {tab.title}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
    paddingBottom: 20, // Extra padding for safe area
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  iconContainer: {
    marginBottom: 4,
    padding: 4,
    borderRadius: 12,
  },
  activeIconContainer: {
    backgroundColor: 'rgba(51, 102, 255, 0.1)',
  },
  label: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },
  activeLabel: {
    color: '#3366FF',
    fontWeight: '600',
  },
});