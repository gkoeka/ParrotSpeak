import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';

interface PlanProps {
  title: string;
  price: string;
  description: string;
  features: string[];
  isPopular?: boolean;
  isBestValue?: boolean;
  isSubscription?: boolean;
  onSelect: () => void;
}

const PlanCard: React.FC<PlanProps> = ({
  title,
  price,
  description,
  features,
  isPopular,
  isBestValue,
  isSubscription,
  onSelect
}) => {
  return (
    <View style={[
      styles.planCard,
      isPopular ? styles.popularCard : null,
      isBestValue ? styles.bestValueCard : null
    ]}>
      {isPopular && (
        <View style={styles.badgeContainer}>
          <Text style={styles.badgeText}>Popular</Text>
        </View>
      )}
      {isBestValue && (
        <View style={[styles.badgeContainer, styles.bestValueBadge]}>
          <Text style={styles.badgeText}>Best Value</Text>
        </View>
      )}
      
      <Text style={styles.planTitle}>{title}</Text>
      <Text style={styles.planPrice}>{price}</Text>
      <Text style={styles.planType}>{isSubscription ? 'Recurring Subscription' : 'One-time Payment'}</Text>
      <Text style={styles.planDescription}>{description}</Text>
      
      <View style={styles.featuresContainer}>
        {features.map((feature, index) => (
          <View key={index} style={styles.featureItem}>
            <Text style={styles.featureBullet}>•</Text>
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>
      
      <TouchableOpacity
        style={[
          styles.selectButton,
          isPopular || isBestValue ? styles.highlightedButton : null
        ]}
        onPress={onSelect}
      >
        <Text style={[
          styles.selectButtonText,
          isPopular || isBestValue ? styles.highlightedButtonText : null
        ]}>
          Select Plan
        </Text>
      </TouchableOpacity>
    </View>
  );
};

interface SubscriptionPlansProps {
  onSelectPlan: (plan: string, amount: number, interval: string) => void;
}

const SubscriptionPlans: React.FC<SubscriptionPlansProps> = ({ onSelectPlan }) => {
  const handleSelectPlan = (plan: string, amount: number, interval: string) => {
    onSelectPlan(plan, amount, interval);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionTitle}>One-Time Payments</Text>
      
      <PlanCard
        title="1 Week"
        price="$4.99"
        description="Perfect for short trips"
        features={[
          "Unlimited translations",
          "Voice-to-Voice conversation",
          "Visual translation",
          "7 days of access"
        ]}
        onSelect={() => handleSelectPlan('weekly', 499, 'week')}
      />
      
      <PlanCard
        title="1 Month"
        price="$14.99"
        description="Great for longer trips"
        features={[
          "All basic features",
          "Offline mode",
          "Priority support",
          "30 days of access"
        ]}
        isPopular
        onSelect={() => handleSelectPlan('monthly', 1499, 'month')}
      />
      
      <PlanCard
        title="3 Months"
        price="$39.99"
        description="Better value for longer stays"
        features={[
          "All 1-month features",
          "Voice profile customization",
          "Save 11% vs monthly",
          "90 days of access"
        ]}
        onSelect={() => handleSelectPlan('quarterly', 3999, '3 months')}
      />
      
      <PlanCard
        title="6 Months"
        price="$69.99"
        description="Value for extended use"
        features={[
          "All premium features",
          "Multiple device sync",
          "Save 22% vs monthly",
          "180 days of access"
        ]}
        onSelect={() => handleSelectPlan('semiannual', 6999, '6 months')}
      />
      
      <Text style={styles.sectionTitle}>Recurring Subscriptions</Text>
      
      <PlanCard
        title="Monthly"
        price="$10/month"
        description="Convenient recurring access"
        features={[
          "All premium features",
          "Cloud backup of conversations",
          "Premium voice profiles",
          "Cancel anytime"
        ]}
        isSubscription
        onSelect={() => handleSelectPlan('premium_monthly', 1000, 'month')}
      />
      
      <PlanCard
        title="Annual"
        price="$99/year"
        description="Maximum savings"
        features={[
          "All monthly subscription features",
          "Save $21 compared to monthly",
          "Priority technical support",
          "Early access to new features"
        ]}
        isBestValue
        isSubscription
        onSelect={() => handleSelectPlan('premium_yearly', 9900, 'year')}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 12,
    color: '#555',
  },
  planCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#eee',
  },
  popularCard: {
    borderColor: '#3366FF',
    borderWidth: 2,
  },
  bestValueCard: {
    borderColor: '#F5A623',
    borderWidth: 2,
  },
  badgeContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#3366FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 12,
  },
  bestValueBadge: {
    backgroundColor: '#F5A623',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  planTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  planPrice: {
    fontSize: 28,
    fontWeight: '800',
    color: '#333',
    marginBottom: 4,
  },
  planType: {
    fontSize: 14,
    color: '#777',
    marginBottom: 12,
  },
  planDescription: {
    fontSize: 16,
    color: '#555',
    marginBottom: 16,
  },
  featuresContainer: {
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'center',
  },
  featureBullet: {
    fontSize: 16,
    color: '#3366FF',
    marginRight: 8,
    fontWeight: 'bold',
  },
  featureText: {
    fontSize: 15,
    color: '#444',
    flex: 1,
  },
  selectButton: {
    backgroundColor: '#f5f5f5',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  highlightedButton: {
    backgroundColor: '#3366FF',
  },
  selectButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  highlightedButtonText: {
    color: '#fff',
  },
});

export default SubscriptionPlans;