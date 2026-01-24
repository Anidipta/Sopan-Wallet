import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { StorageService } from '../services/StorageService';
import { StellarService } from '../services/StellarService';
import SopanIcon from '../components/SopanIcon';
import { Image } from 'react-native';

interface OnboardingScreenProps {
  onComplete: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const [mode, setMode] = useState<'welcome' | 'register' | 'login'>('welcome');
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const storage = new StorageService();
  const stellar = new StellarService('testnet');

  const handleNext = () => {
    if (mode === 'register' && step === 1) {
      if (!name || !email || !phone) {
        alert('Please fill all fields');
        return;
      }
      setStep(2);
    }
  };

  const handleRegister = async () => {
    setLoading(true);
    try {
      // Save user data
      await storage.saveUserData(email, phone);
      
      // Create deterministic Stellar wallet from email+phone (so it's always the same)
      const seed = `sopan:${email}:${phone}`;
      const wallet = await stellar.createWallet(seed);
      await storage.saveWallet(wallet.publicKey, wallet.secretKey);
      
      console.log('✅ Stellar wallet created:', wallet.publicKey.substring(0, 8) + '...');
      
      onComplete();
    } catch (error) {
      console.error('Registration failed:', error);
      alert('Failed to complete setup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    try {
      if (!email || !phone) {
        alert('Please enter your email and phone number');
        return;
      }

      // Recreate Stellar wallet from credentials
      const seed = `sopan:${email}:${phone}`;
      const wallet = await stellar.createWallet(seed);
      
      // Save to storage
      await storage.saveUserData(email, phone);
      await storage.saveWallet(wallet.publicKey, wallet.secretKey);
      
      console.log('✅ Logged in with Stellar wallet:', wallet.publicKey.substring(0, 8) + '...');
      
      onComplete();
    } catch (error) {
      console.error('Login failed:', error);
      alert('Failed to login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {mode === 'welcome' ? (
          <View style={styles.stepContainer}>
            <View style={styles.logoContainer}>
              <Image source={SopanIcon} style={{ width: 100, height: 100, resizeMode: 'contain' }} />
            </View>
            <Text style={styles.title}>Welcome to SOPAN</Text>
            <Text style={styles.subtitle}>
              Send payments online or offline with Bluetooth. Your crypto wallet for any situation.
            </Text>

            <View style={styles.featureList}>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>⚡</Text>
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>Offline Payments</Text>
                  <Text style={styles.featureText}>Send XLM via Bluetooth without internet</Text>
                </View>
              </View>

              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>🔒</Text>
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>Secure & Private</Text>
                  <Text style={styles.featureText}>Your keys never leave your device</Text>
                </View>
              </View>

              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>🔄</Text>
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>Auto-Sync</Text>
                  <Text style={styles.featureText}>Transactions sync when you're back online</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.button} 
              onPress={() => setMode('register')}
            >
              <Text style={styles.buttonText}>Create New Account</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.secondaryButton} 
              onPress={() => setMode('login')}
            >
              <Text style={styles.secondaryButtonText}>Login with Existing Account</Text>
            </TouchableOpacity>
          </View>
        ) : mode === 'login' ? (
          <View style={styles.stepContainer}>
            <View style={styles.logoContainer}>
              <Image source={SopanIcon} style={{ width: 80, height: 80, resizeMode: 'contain' }} />
            </View>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>
              Login with your email and phone to restore your wallet
            </Text>

            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email Address</Text>
                <TextInput
                  style={styles.input}
                  placeholder="john@example.com"
                  placeholderTextColor="#666"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="+1 (555) 123-4567"
                  placeholderTextColor="#666"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.infoBox}>
                <Text style={styles.infoText}>
                  💡 Your wallet is deterministically generated from your credentials. Use the same email and phone you registered with.
                </Text>
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.button, loading && styles.buttonDisabled]} 
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Logging in...' : 'Login'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => setMode('welcome')}
            >
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Progress Indicator */}
            <View style={styles.progressContainer}>
              <View style={[styles.progressDot, step >= 1 && styles.progressDotActive]} />
              <View style={[styles.progressLine, step >= 2 && styles.progressLineActive]} />
              <View style={[styles.progressDot, step >= 2 && styles.progressDotActive]} />
            </View>

            {step === 1 ? (
          <View style={styles.stepContainer}>
            <View style={styles.logoContainer}>
              <Image source={SopanIcon} style={{ width: 80, height: 80, resizeMode: 'contain' }} />
            </View>
            <Text style={styles.title}>Welcome to SOPAN</Text>
            <Text style={styles.subtitle}>
              Send payments online or offline with Bluetooth. Your crypto wallet for any situation.
            </Text>

            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="John Doe"
                  placeholderTextColor="#666"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email Address</Text>
                <TextInput
                  style={styles.input}
                  placeholder="john@example.com"
                  placeholderTextColor="#666"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="+1 (555) 123-4567"
                  placeholderTextColor="#666"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <TouchableOpacity style={styles.button} onPress={handleNext}>
              <Text style={styles.buttonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.stepContainer}>
            <View style={styles.logoContainer}>
              <Image source={SopanIcon} style={{ width: 80, height: 80, resizeMode: 'contain' }} />
            </View>
            <Text style={styles.title}>Secure Wallet Setup</Text>
            <Text style={styles.subtitle}>
              We'll create a secure Stellar wallet for you. Your keys are encrypted and stored only on your device.
            </Text>

            <View style={styles.featureList}>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>✓</Text>
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>End-to-End Encryption</Text>
                  <Text style={styles.featureText}>Your private keys never leave your device</Text>
                </View>
              </View>

              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>✓</Text>
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>Offline Payments</Text>
                  <Text style={styles.featureText}>Send SOL via Bluetooth without internet</Text>
                </View>
              </View>

              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>✓</Text>
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>Auto-Sync</Text>
                  <Text style={styles.featureText}>Transactions sync when you're back online</Text>
                </View>
              </View>

              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>✓</Text>
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>Stellar Blockchain</Text>
                  <Text style={styles.featureText}>Fast (3-5s), secure, and ultra low-cost transactions</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.button, loading && styles.buttonDisabled]} 
              onPress={handleRegister}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Creating Wallet...' : 'Create Wallet & Get Started'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.backButton} onPress={() => setStep(1)}>
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
          </View>
        )}
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 60,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#2A2A3A',
  },
  progressDotActive: {
    backgroundColor: '#14F195',
  },
  progressLine: {
    width: 60,
    height: 2,
    backgroundColor: '#2A2A3A',
    marginHorizontal: 8,
  },
  progressLineActive: {
    backgroundColor: '#14F195',
  },
  stepContainer: {
    flex: 1,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  emoji: {
    fontSize: 64,
    textAlign: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  form: {
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    color: '#888',
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#1A1A24',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#2A2A3A',
  },
  featureList: {
    marginBottom: 32,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    backgroundColor: '#1A1A24',
    padding: 16,
    borderRadius: 12,
  },
  featureIcon: {
    fontSize: 24,
    color: '#14F195',
    marginRight: 12,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  featureText: {
    color: '#888',
    fontSize: 14,
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#14F195',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
  },
  backButton: {
    marginTop: 16,
    padding: 12,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#888',
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2A2A3A',
    marginTop: 12,
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoBox: {
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.3)',
    marginTop: 8,
  },
  infoText: {
    color: '#00D4FF',
    fontSize: 14,
    lineHeight: 20,
  },
});
