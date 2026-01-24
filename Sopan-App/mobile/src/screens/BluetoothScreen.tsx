import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { BluetoothService } from '../services/BluetoothService';
import { StorageService } from '../services/StorageService';

type Tab = 'send' | 'receive';

export const BluetoothScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<Tab>('send');
  const [scanning, setScanning] = useState(false);
  const [advertising, setAdvertising] = useState(false);
  const [devices, setDevices] = useState<any[]>([]);
  const [bluetoothService] = useState(() => new BluetoothService());
  const [storage] = useState(() => new StorageService());
  const [walletAddress, setWalletAddress] = useState<string>('');

  useEffect(() => {
    loadWalletAddress();
    return () => {
      if (advertising) {
        stopAdvertising();
      }
    };
  }, []);

  const loadWalletAddress = async () => {
    const wallet = await storage.getWallet();
    if (wallet) {
      setWalletAddress(wallet.publicKey);
    }
  };

  const startScan = async () => {
    try {
      setScanning(true);
      setDevices([]);
      await bluetoothService.initialize();
      
      Alert.alert(
        'Scanning for SOPAN Devices',
        'Looking for nearby devices with Bluetooth enabled. This may take 10 seconds...',
        [{ text: 'OK' }]
      );
      
      const foundDevices = await bluetoothService.scanForDevices(10000);
      
      if (foundDevices.length === 0) {
        Alert.alert(
          'No Devices Found',
          'Make sure:\n\n1. The other device has SOPAN installed\n2. They are on the "Receive" tab\n3. "Enable Advertising" is turned ON\n4. Both devices have Bluetooth enabled\n5. Devices are within 10 meters',
          [{ text: 'OK' }]
        );
      } else {
        setDevices(foundDevices);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to scan for devices';
      Alert.alert('Bluetooth Error', errorMessage);
    } finally {
      setScanning(false);
    }
  };

  const startAdvertising = async () => {
    try {
      await bluetoothService.initialize();
      await bluetoothService.startAdvertising(walletAddress);
      setAdvertising(true);
      Alert.alert(
        '✅ Advertising Started',
        'Your device is now discoverable to nearby SOPAN users. Keep this screen open to receive payments.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start advertising';
      Alert.alert('Advertising Error', errorMessage);
    }
  };

  const stopAdvertising = async () => {
    try {
      await bluetoothService.stopAdvertising();
      setAdvertising(false);
    } catch (error) {
      console.error('Failed to stop advertising:', error);
    }
  };

  const toggleAdvertising = async () => {
    if (advertising) {
      await stopAdvertising();
    } else {
      await startAdvertising();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Bluetooth Pay</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'send' && styles.tabActive]}
          onPress={() => setActiveTab('send')}
        >
          <Text style={[styles.tabText, activeTab === 'send' && styles.tabTextActive]}>
            Send
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'receive' && styles.tabActive]}
          onPress={() => setActiveTab('receive')}
        >
          <Text style={[styles.tabText, activeTab === 'receive' && styles.tabTextActive]}>
            Receive
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {activeTab === 'send' ? (
          <>
            <View style={styles.infoCard}>
              <Text style={styles.infoIcon}>📤</Text>
              <Text style={styles.infoTitle}>Send Payment</Text>
              <Text style={styles.infoText}>
                Scan for nearby devices to send XLM via Bluetooth
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.scanButton, scanning && styles.scanButtonDisabled]}
              onPress={startScan}
              disabled={scanning}
            >
              {scanning ? (
                <>
                  <ActivityIndicator color="#000" />
                  <Text style={styles.scanButtonText}>Scanning...</Text>
                </>
              ) : (
                <Text style={styles.scanButtonText}>🔍 Scan for Devices</Text>
              )}
            </TouchableOpacity>

            <ScrollView style={styles.deviceList}>
              {devices.length === 0 && !scanning && (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No devices found</Text>
                  <Text style={styles.emptyStateSubtext}>
                    Tap "Scan for Devices" to find nearby SOPAN users
                  </Text>
                </View>
              )}

              {devices.map((device, index) => (
                <TouchableOpacity key={index} style={styles.deviceCard}>
                  <View style={styles.deviceIcon}>
                    <Text style={styles.deviceIconText}>📱</Text>
                  </View>
                  <View style={styles.deviceInfo}>
                    <Text style={styles.deviceName}>{device.name || 'Unknown Device'}</Text>
                    <Text style={styles.deviceId}>{device.id}</Text>
                  </View>
                  <View style={styles.deviceArrow}>
                    <Text style={styles.deviceArrowText}>→</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        ) : (
          <>
            <View style={styles.infoCard}>
              <Text style={styles.infoIcon}>📥</Text>
              <Text style={styles.infoTitle}>Receive Payment</Text>
              <Text style={styles.infoText}>
                Note: BLE advertising requires additional native modules. For now, use device Bluetooth settings to make your device discoverable, or share your wallet address directly.
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.advertisingButton,
                advertising && styles.advertisingButtonActive
              ]}
              onPress={toggleAdvertising}
            >
              <View style={styles.advertisingToggle}>
                <View style={[
                  styles.advertisingToggleCircle,
                  advertising && styles.advertisingToggleCircleActive
                ]} />
              </View>
              <View style={styles.advertisingContent}>
                <Text style={styles.advertisingTitle}>
                  {advertising ? '🟢 Accepting Payments' : '⚪ Enable Advertising'}
                </Text>
                <Text style={styles.advertisingSubtext}>
                  {advertising 
                    ? 'Your device is discoverable to nearby users'
                    : 'Turn on to receive payments via Bluetooth'
                  }
                </Text>
              </View>
            </TouchableOpacity>

            {advertising && (
              <View style={styles.walletCard}>
                <Text style={styles.walletLabel}>Your Wallet Address:</Text>
                <Text style={styles.walletAddress} numberOfLines={1} ellipsizeMode="middle">
                  {walletAddress}
                </Text>
                <Text style={styles.walletHint}>
                  Keep this screen open to receive payments
                </Text>
              </View>
            )}

            <View style={styles.howItWorks}>
              <Text style={styles.howItWorksTitle}>How to receive</Text>
              <View style={styles.step}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>1</Text>
                </View>
                <Text style={styles.stepText}>Toggle "Enable Advertising" ON</Text>
              </View>
              <View style={styles.step}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>2</Text>
                </View>
                <Text style={styles.stepText}>Keep this screen open</Text>
              </View>
              <View style={styles.step}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>3</Text>
                </View>
                <Text style={styles.stepText}>Sender will scan and find your device</Text>
              </View>
              <View style={styles.step}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>4</Text>
                </View>
                <Text style={styles.stepText}>Accept or reject incoming payments</Text>
              </View>
            </View>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#1A1A24',
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#00D4FF',
  },
  tabText: {
    color: '#888',
    fontSize: 16,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#000',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1A1A24',
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
  infoCard: {
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.3)',
  },
  infoIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  infoTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  infoText: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  scanButton: {
    backgroundColor: '#00D4FF',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  scanButtonDisabled: {
    opacity: 0.5,
  },
  scanButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
  },
  deviceList: {
    flex: 1,
    marginBottom: 24,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
  },
  deviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A24',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  deviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2A2A3A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  deviceIconText: {
    fontSize: 24,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  deviceId: {
    color: '#666',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  deviceArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2A2A3A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deviceArrowText: {
    color: '#00D4FF',
    fontSize: 18,
  },
  howItWorks: {
    backgroundColor: '#1A1A24',
    borderRadius: 16,
    padding: 20,
  },
  howItWorksTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#00D4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    color: '#000',
    fontSize: 14,
    fontWeight: 'bold',
  },
  stepText: {
    color: '#888',
    fontSize: 14,
    flex: 1,
  },
  advertisingButton: {
    backgroundColor: '#1A1A24',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#2A2A3A',
  },
  advertisingButtonActive: {
    backgroundColor: 'rgba(20, 241, 149, 0.1)',
    borderColor: '#14F195',
  },
  advertisingToggle: {
    width: 56,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2A2A3A',
    padding: 2,
    marginRight: 16,
    justifyContent: 'center',
  },
  advertisingToggleCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#666',
  },
  advertisingToggleCircleActive: {
    backgroundColor: '#14F195',
    alignSelf: 'flex-end',
  },
  advertisingContent: {
    flex: 1,
  },
  advertisingTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  advertisingSubtext: {
    color: '#888',
    fontSize: 14,
  },
  walletCard: {
    backgroundColor: '#1A1A24',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#2A2A3A',
  },
  walletLabel: {
    color: '#888',
    fontSize: 12,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  walletAddress: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'monospace',
    marginBottom: 12,
  },
  walletHint: {
    color: '#14F195',
    fontSize: 14,
    textAlign: 'center',
  },
});
