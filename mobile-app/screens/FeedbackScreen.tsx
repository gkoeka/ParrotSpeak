import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';
import Icon from 'react-native-vector-icons/Feather';
import Header from '../components/Header';
import { submitFeedback } from '../api/feedbackService';

type FeedbackScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Feedback'>;

type FeedbackCategory = 'bug' | 'feature' | 'translation' | 'other';

export default function FeedbackScreen() {
  const navigation = useNavigation<FeedbackScreenNavigationProp>();
  const [feedback, setFeedback] = useState('');
  const [category, setCategory] = useState<FeedbackCategory>('other');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Categories with icons and descriptions
  const categories = [
    { id: 'bug' as FeedbackCategory, name: 'Report Bug', icon: 'alert-circle', 
      description: 'Something isn\'t working correctly' },
    { id: 'feature' as FeedbackCategory, name: 'Suggest Feature', icon: 'star', 
      description: 'I have an idea for improvement' },
    { id: 'translation' as FeedbackCategory, name: 'Translation Issue', icon: 'message-square', 
      description: 'Problems with translations' },
    { id: 'other' as FeedbackCategory, name: 'Other Feedback', icon: 'help-circle', 
      description: 'General comments or questions' }
  ];
  
  // Handle feedback submission
  const handleSubmit = async () => {
    if (!feedback.trim()) {
      Alert.alert('Error', 'Please enter your feedback');
      return;
    }
    
    try {
      setIsSubmitting(true);
      const response = await submitFeedback(feedback, category, email || undefined);
      
      if (response.success) {
        Alert.alert('Thank You!', 'Your feedback has been submitted successfully.', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert('Error', response.message);
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      Alert.alert('Error', 'Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.headerWrapper}>
        <Header showNewButton={false} showSettingsButton={false} />
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Submit Feedback</Text>
      </View>
      
      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>What type of feedback do you have?</Text>
        
        <View style={styles.categoriesContainer}>
          {categories.map(item => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.categoryButton,
                category === item.id && styles.selectedCategory
              ]}
              onPress={() => setCategory(item.id)}
            >
              <Icon 
                name={item.icon} 
                size={24} 
                color={category === item.id ? '#fff' : '#333'} 
              />
              <Text style={[
                styles.categoryName,
                category === item.id && styles.selectedCategoryText
              ]}>
                {item.name}
              </Text>
              <Text style={[
                styles.categoryDescription,
                category === item.id && styles.selectedCategoryText
              ]}>
                {item.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        <Text style={styles.sectionTitle}>Your feedback</Text>
        <TextInput
          style={styles.feedbackInput}
          multiline
          placeholder="Please describe your feedback in detail..."
          value={feedback}
          onChangeText={setFeedback}
          textAlignVertical="top"
        />
        
        <Text style={styles.sectionTitle}>Your email (optional)</Text>
        <Text style={styles.emailDescription}>
          If you'd like us to follow up with you about this feedback
        </Text>
        <TextInput
          style={styles.emailInput}
          placeholder="your.email@example.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        
        <TouchableOpacity 
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Icon name="send" size={18} color="#fff" style={styles.submitIcon} />
              <Text style={styles.submitText}>Submit Feedback</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa'
  },
  headerWrapper: {
    position: 'relative',
    height: 60
  },
  backButton: {
    position: 'absolute',
    left: 16,
    top: 12,
    zIndex: 10
  },
  headerTitle: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 12,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: '#333'
  },
  content: {
    flex: 1,
    padding: 16
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    color: '#333'
  },
  categoriesContainer: {
    flexDirection: 'column',
    marginBottom: 8
  },
  categoryButton: {
    flexDirection: 'column',
    padding: 12,
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#e1e4e8'
  },
  selectedCategory: {
    backgroundColor: '#4b7bec',
    borderColor: '#4b7bec'
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
    color: '#333'
  },
  selectedCategoryText: {
    color: '#fff'
  },
  categoryDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 4
  },
  feedbackInput: {
    height: 120,
    borderWidth: 1,
    borderColor: '#e1e4e8',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff'
  },
  emailDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8
  },
  emailInput: {
    height: 50,
    borderWidth: 1,
    borderColor: '#e1e4e8',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff'
  },
  submitButton: {
    backgroundColor: '#4b7bec',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 40,
    flexDirection: 'row',
    justifyContent: 'center'
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  submitIcon: {
    marginRight: 8
  }
});