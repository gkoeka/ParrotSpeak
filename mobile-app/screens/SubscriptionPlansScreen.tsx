import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';
import Header from '../components/Header';
import SubscriptionPlans from '../components/SubscriptionPlans';

type SubscriptionPlansScreenNavigationProp = StackNavigationProp<RootStackParamList, 'SubscriptionPlans'>;

const SubscriptionPlansScreen: React.FC = () => {
  const navigation = useNavigation<SubscriptionPlansScreenNavigationProp>();

  const handleSelectPlan = (plan: string, amount: number, interval: string) => {
    // Navigate to checkout screen with plan details
    navigation.navigate('Checkout', {
      plan,
      amount,
      interval
    });
  };

  return (
    <View style={styles.container}>
      <Header showNewButton={false} />
      <SubscriptionPlans onSelectPlan={handleSelectPlan} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa'
  }
});

export default SubscriptionPlansScreen;