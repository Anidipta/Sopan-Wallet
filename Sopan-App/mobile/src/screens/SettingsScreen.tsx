import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Alert } from 'react-native';
import { StorageService } from '../services/StorageService';
import { BiometricService } from '../services/BiometricService';
import { NotificationService } from '../services/NotificationService';

interface SettingsScreenProps {
  onBack: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onBack }) => {
  const [network, setNetwork] = useState<'mainnet' | 'devnet' | 'testnet'>('testnet');
  const [currency, setCurrency] = useState<'USD' | 'EUR' | 'GBP'>('USD');
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricTypes, setBiometricTypes] = useState<string[]>([]);

  const storage = new StorageService();
  const biometric = new BiometricService();
  const notifications = NotificationService.getInstance();

  useEffect(() => {
    loadSettings();
    checkBiometric();
  }, []);

  const loadSettings = async () => {
    // Load saved settings
    const savedNetwork = await storage.getItem('network');
    const savedCurrency = await storage.getItem('currency');
    const savedBiometric = await storage.getItem('biometricEnabled');
    const savedNotifications = await storage.getItem('notificationsEnabled');

    if (savedNetwork) setNetwork(savedNetwork as any);
    if (savedCurrency) setCurrency(savedCurrency as any);
    if (savedBiometric) setBiometricEnabled(savedBiometric === 'true');
    if (savedNotifications) setNotificationsEnabled(savedNotifications === 'true');
  };

  const checkBiometric = async () => {
    const available = await biometric.isAvailable();
    setBiometricAvailable(available);
    
    if (available) {
      const types = await biometric.getSupportedTypes();
      setBiometricTypes(types);
    }
  };

  const handleNetworkChange = async (newNetwork: 'mainnet' | 'devnet' | 'testnet') => {
    if (newNetwork === 'mainnet') {
      Alert.alert(
        'Switch to Mainnet?',
        'You are about to switch to Mainnet. Real XLM will be used for transactions. Are you sure?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Continue',
            style: 'destructive',
            onPress: async () => {
              setNetwork(newNetwork);
              await storage.setItem('network', newNetwork);
              Alert.alert('Network Changed', 'Please restart the app for changes to take effect');
            }
          }
        ]
      );
    } else {
      setNetwork(newNetwork);
      await storage.setItem('network', newNetwork);
      Alert.alert('Network Changed', 'Please restart the app for changes to take effect');
    }
  };

  const handleCurrencyChange = async (newCurrency: 'USD' | 'EUR' | 'GBP') => {
    setCurrency(newCurrency);
    await storage.setItem('currency', newCurrency);
  };

  const handleBiometricToggle = async (value: boolean) => {
    if (value && biometricAvailable) {
      const authenticated = await biometric.authenticate('Enable biometric authentication');
      if (authenticated) {
        setBiometricEnabled(true);
        await storage.setItem('biometricEnabled', 'true');
        Alert.alert('Enabled', 'Biometric authentication enabled');
      }
    } else {
      setBiometricEnabled(false);
      await storage.setItem('biometricEnabled', 'false');
    }
  };

  const handleNotificationsToggle = async (value: boolean) => {
    if (value) {
      const granted = await notifications.requestPermissions();
      if (granted) {
        setNotificationsEnabled(true);
        await storage.setItem('notificationsEnabled', 'true');
      } else {
        Alert.alert('Permission Denied', 'Please enable notifications in system settings');
      }
    } else {
      setNotificationsEnabled(false);
      await storage.setItem('notificationsEnabled', 'false');
    }
  };

  const handleExportPrivateKey = async () => {
    Alert.alert(
      '⚠️ Warning',
      'Exporting your private key is dangerous. Anyone with your private key can access your funds. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Export',
          style: 'destructive',
          onPress: async () => {
            const authenticated = await biometric.authenticateForExport();
            if (authenticated) {
              const wallet = await storage.getWallet();
              if (wallet) {
                Alert.alert(
                  'Private Key',
                  wallet.encryptedPrivateKey,
                  [{ text: 'OK' }]
                );
              }
            }
          }
        }
      ]
    );
  };

  const handleClearCache = async () => {
    Alert.alert(
      'Clear Cache',
      'This will clear all cached data. Your wallet will not be affected. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          onPress: async () => {
            // Clear cache logic here
            Alert.alert('Success', 'Cache cleared');
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Network Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Network</Text>
          
          <View style={styles.card}>
            <TouchableOpacity
              style={[styles.option, network === 'testnet' && styles.optionSelected]}
              onPress={() => handleNetworkChange('testnet')}
            >
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Testnet</Text>
                <Text style={styles.optionSubtitle}>For testing (Recommended)</Text>
              </View>
              {network === 'testnet' && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.option, network === 'devnet' && styles.optionSelected]}
              onPress={() => handleNetworkChange('devnet')}
            >
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Devnet</Text>
                <Text style={styles.optionSubtitle}>For development</Text>
              </View>
              {network === 'devnet' && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.option, network === 'mainnet' && styles.optionSelected]}
              onPress={() => handleNetworkChange('mainnet')}
            >
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Mainnet</Text>
                <Text style={styles.optionSubtitle}>⚠️ Real XLM</Text>
              </View>
              {network === 'mainnet' && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>
          </View>
        </View>

        {/* Currency Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Display Currency</Text>
          
          <View style={styles.card}>
            {['USD', 'EUR', 'GBP'].map((curr) => (
              <TouchableOpacity
                key={curr}
                style={[styles.option, currency === curr && styles.optionSelected]}
                onPress={() => handleCurrencyChange(curr as any)}
              >
                <Text style={styles.optionTitle}>{curr}</Text>
                {currency === curr && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Security Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          
          <View style={styles.card}>
            <View style={styles.switchOption}>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>
                  {biometricTypes.length > 0 ? biometricTypes[0] : 'Biometric'} Authentication
                </Text>
                <Text style={styles.optionSubtitle}>
                  {biometricAvailable ? 'Require for payments' : 'Not available on this device'}
                </Text>
              </View>
              <Switch
                value={biometricEnabled}
                onValueChange={handleBiometricToggle}
                disabled={!biometricAvailable}
                trackColor={{ false: '#222', true: '#14F195' }}
                thumbColor="#fff"
              />
            </View>

            <TouchableOpacity style={styles.option} onPress={handleExportPrivateKey}>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Export Private Key</Text>
                <Text style={styles.optionSubtitle}>⚠️ Keep it safe</Text>
              </View>
              <Text style={styles.arrow}>→</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Notification Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          
          <View style={styles.card}>
            <View style={styles.switchOption}>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Push Notifications</Text>
                <Text style={styles.optionSubtitle}>Payment alerts</Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={handleNotificationsToggle}
                trackColor={{ false: '#222', true: '#14F195' }}
                thumbColor="#fff"
              />
            </View>
          </View>
        </View>

        {/* App Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App</Text>
          
          <View style={styles.card}>
            <TouchableOpacity style={styles.option} onPress={handleClearCache}>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Clear Cache</Text>
                <Text style={styles.optionSubtitle}>Free up space</Text>
              </View>
              <Text style={styles.arrow}>→</Text>
            </TouchableOpacity>

            <View style={styles.option}>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Version</Text>
                <Text style={styles.optionSubtitle}>1.0.0</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>SOPAN Wallet</Text>
          <Text style={styles.footerSubtext}>Offline-first Stellar payments</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    color: '#888',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 12,
    letterSpacing: 1,
  },
  card: {
    backgroundColor: '#111',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#222',
    overflow: 'hidden',
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  optionSelected: {
    backgroundColor: 'rgba(20, 241, 149, 0.05)',
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  optionSubtitle: {
    color: '#666',
    fontSize: 13,
  },
  checkmark: {
    color: '#14F195',
    fontSize: 20,
    fontWeight: 'bold',
  },
  arrow: {
    color: '#666',
    fontSize: 20,
  },
  switchOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  footerText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  footerSubtext: {
    color: '#666',
    fontSize: 12,
  },
});
