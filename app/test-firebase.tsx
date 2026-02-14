import { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { db } from '@/src/services/firebase';
import { collection, doc, getDoc } from '@react-native-firebase/firestore';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';

export default function TestFirebase() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Testing Firebase connection...');

  useEffect(() => {
    const testConnection = async () => {
      try {
        // Try to access Firestore
        await getDoc(doc(db, 'test', 'connection'));
        
        setStatus('success');
        setMessage('✅ Firebase connected successfully!');
        console.log('✅ Firebase connected successfully!');
      } catch (error) {
        setStatus('error');
        setMessage(`❌ Firebase connection error: ${error}`);
        console.error('❌ Firebase connection error:', error);
      }
    };

    testConnection();
  }, []);

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return '#10B981';
      case 'error':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View 
        entering={FadeInUp.duration(600)}
        style={[styles.card, { borderColor: getStatusColor() }]}
      >
        <Animated.Text 
          entering={FadeIn.delay(200)}
          style={[styles.title, { color: getStatusColor() }]}
        >
          Firebase Connection Test
        </Animated.Text>
        <Animated.Text 
          entering={FadeIn.delay(400)}
          style={styles.message}
        >
          {message}
        </Animated.Text>
        {status === 'loading' && (
          <Animated.View 
            entering={FadeIn}
            style={styles.loadingIndicator}
          />
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 20,
  },
  card: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 16,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: '100%',
    maxWidth: 400,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
    lineHeight: 24,
  },
  loadingIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#3B82F6',
    borderTopColor: 'transparent',
    alignSelf: 'center',
    marginTop: 20,
  },
});
