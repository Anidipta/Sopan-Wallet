import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import { Buffer } from 'buffer';
global.Buffer = Buffer;

// Polyfill for EventSource (Stellar SDK streaming)
if (typeof global.EventSource === 'undefined') {
  class MockEventSource {
    static CONNECTING = 0;
    static OPEN = 1;
    static CLOSED = 2;
    CONNECTING = 0;
    OPEN = 1;
    CLOSED = 2;
    url: string;
    readyState: number = 0;

    constructor(url: string) {
      this.url = url;
    }
    addEventListener() { }
    removeEventListener() { }
    close() { }
  }
  (global as any).EventSource = MockEventSource;
}

import React, { useState, useEffect } from 'react';
import { StatusBar, View, ActivityIndicator, AppState } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { HomeScreen } from './src/screens/HomeScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { LoadingScreen } from './src/screens/LoadingScreen';
import { SolustAIScreen } from './src/screens/SolustAIScreen';
import { StorageService } from './src/services/StorageService';
import { NotificationService } from './src/services/NotificationService';
import { ErrorRecoveryService } from './src/services/ErrorRecoveryService';
import { PaymentService } from './src/services/PaymentService';

export default function App() {
  const [isOnboarded, setIsOnboarded] = useState<boolean | null>(null);
  const storage = new StorageService();
  const notifications = NotificationService.getInstance();
  const errorRecovery = ErrorRecoveryService.getInstance();

  useEffect(() => {
    initializeApp();

    // Start auto-sync for offline transactions
    const paymentService = new PaymentService();
    paymentService.startAutoSync();

    // Handle app state changes
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, []);

  const initializeApp = async () => {
    try {
      // Request notification permissions
      await notifications.requestPermissions();

      // Recover app state
      await errorRecovery.recoverAppState();

      // Check onboarding
      await checkOnboarding();
    } catch (error) {
      console.error('App initialization failed:', error);
      await checkOnboarding(); // Continue anyway
    }
  };

  const handleAppStateChange = async (nextAppState: string) => {
    if (nextAppState === 'active') {
      console.log('App became active - recovering state');
      await errorRecovery.recoverAppState();
    }
  };

  const checkOnboarding = async () => {
    const wallet = await storage.getWallet();
    setIsOnboarded(!!wallet);
  };

  const handleOnboardingComplete = () => {
    setIsOnboarded(true);
  };

  const handleLogout = async () => {
    try {
      // Clear all user data
      await storage.clearAllData();
      console.log('✅ Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsOnboarded(false);
    }
  };

  if (isOnboarded === null) {
    return (
      <SafeAreaProvider>
        <LoadingScreen />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <View style={{ flex: 1, backgroundColor: '#000000' }}>
        {isOnboarded ? (
          <HomeScreen onLogout={handleLogout} />
        ) : (
          <OnboardingScreen onComplete={handleOnboardingComplete} />
        )}
      </View>
    </SafeAreaProvider>
  );
}
