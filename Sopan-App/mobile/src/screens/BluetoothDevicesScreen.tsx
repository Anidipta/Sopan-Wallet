import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { bluetoothSimulator, MockDevice } from '../services/BluetoothSimulator';

interface BluetoothDevicesScreenProps {
  onBack: () => void;
}

const BluetoothDevicesScreen: React.FC<BluetoothDevicesScreenProps> = ({ onBack }) => {
  const [devices, setDevices] = useState<MockDevice[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [connectingDeviceId, setConnectingDeviceId] = useState<string | null>(null);

  useEffect(() => {
    // Set up event listeners
    const handleDeviceFound = (device: MockDevice) => {
      setDevices(prev => {
        const existing = prev.find(d => d.id === device.id);
        if (existing) {
          return prev.map(d => d.id === device.id ? device : d);
        }
        return [...prev, device];
      });
    };

    const handleDeviceConnected = (device: MockDevice) => {
      setConnectingDeviceId(null);
      setDevices(prev => prev.map(d => d.id === device.id ? device : d));
      Alert.alert(
        '✅ Connected Successfully!', 
        `Successfully connected to ${device.name}\n\n🔗 Bluetooth connection established\n📱 Device ready for payments`,
        [{ text: 'OK', style: 'default' }]
      );
    };

    const handleDeviceDisconnected = (device: MockDevice) => {
      setDevices(prev => prev.map(d => d.id === device.id ? device : d));
    };

    const handleScanStarted = () => setIsScanning(true);
    const handleScanStopped = () => setIsScanning(false);

    bluetoothSimulator.on('deviceFound', handleDeviceFound);
    bluetoothSimulator.on('deviceConnected', handleDeviceConnected);
    bluetoothSimulator.on('deviceDisconnected', handleDeviceDisconnected);
    bluetoothSimulator.on('scanStarted', handleScanStarted);
    bluetoothSimulator.on('scanStopped', handleScanStopped);

    // Load existing devices
    setDevices(bluetoothSimulator.getAllDevices());

    return () => {
      bluetoothSimulator.removeAllListeners();
    };
  }, []);

  const startScanning = async () => {
    try {
      await bluetoothSimulator.startScanning();
    } catch (error) {
      Alert.alert('Error', 'Failed to start scanning');
    }
  };

  const stopScanning = () => {
    bluetoothSimulator.stopScanning();
  };

  const connectToDevice = async (device: MockDevice) => {
    if (device.isConnected) {
      bluetoothSimulator.disconnectDevice(device.id);
      return;
    }

    setConnectingDeviceId(device.id);
    const success = await bluetoothSimulator.connectToDevice(device.id);
    
    if (!success) {
      setConnectingDeviceId(null);
      Alert.alert('Error', 'Failed to connect to device');
    }
  }; 
 const addWalletToDevice = (device: MockDevice) => {
    Alert.prompt(
      'Add Wallet Address',
      `Enter wallet address for ${device.name}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add',
          onPress: (walletAddress?: string) => {
            if (walletAddress && walletAddress.length > 20) {
              bluetoothSimulator.addTrustedDevice(device.id, walletAddress);
              setDevices(prev => prev.map(d => 
                d.id === device.id ? { ...d, walletAddress } : d
              ));
              Alert.alert('Success', 'Wallet address added to device');
            } else {
              Alert.alert('Error', 'Please enter a valid wallet address');
            }
          }
        }
      ],
      'plain-text',
      device.walletAddress || ''
    );
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'Samsung': return '📱';
      case 'Vivo': return '📲';
      case 'iPhone': return '📱';
      case 'OnePlus': return '📱';
      case 'Xiaomi': return '📱';
      default: return '📱';
    }
  };

  const getSignalStrength = (rssi: number) => {
    if (rssi > -50) return '📶';
    if (rssi > -70) return '📶';
    if (rssi > -80) return '📶';
    return '📶';
  };

  const renderDevice = ({ item: device }: { item: MockDevice }) => (
    <LinearGradient
      colors={['#1a1a2e', '#2a2a3e']}
      style={styles.deviceCard}
    >
      <View style={styles.deviceHeader}>
        <View style={styles.deviceIconContainer}>
          <Text style={styles.deviceIcon}>{getDeviceIcon(device.deviceType)}</Text>
          <View style={[styles.statusDot, device.isConnected && styles.connectedDot]} />
        </View>
        <View style={styles.deviceInfo}>
          <Text style={styles.deviceName}>{device.name}</Text>
          <Text style={styles.deviceType}>{device.deviceType}</Text>
          <Text style={styles.signalText}>{getSignalStrength(device.rssi)} {device.rssi}dBm</Text>
          {device.walletAddress && (
            <View style={styles.walletBadge}>
              <Text style={styles.walletText}>
                {device.walletAddress.slice(0, 6)}...{device.walletAddress.slice(-6)}
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.deviceActions}>
        <TouchableOpacity
          onPress={() => connectToDevice(device)}
          disabled={connectingDeviceId === device.id}
        >
          <LinearGradient
            colors={device.isConnected ? ['#ff6b6b', '#ff5252'] : ['#14F195', '#00D4A0']}
            style={styles.actionButton}
          >
            {connectingDeviceId === device.id ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.actionButtonText}>
                {device.isConnected ? 'Disconnect' : 'Connect'}
              </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {!device.walletAddress && (
          <TouchableOpacity
            style={styles.addWalletButton}
            onPress={() => addWalletToDevice(device)}
          >
            <Text style={styles.addWalletText}>+ Wallet</Text>
          </TouchableOpacity>
        )}
      </View>
    </LinearGradient>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Nearby Devices</Text>
        <TouchableOpacity
          style={[styles.scanButton, isScanning && styles.scanningButton]}
          onPress={isScanning ? stopScanning : startScanning}
        >
          {isScanning && <ActivityIndicator size="small" color="#fff" style={styles.scanIcon} />}
          <Text style={styles.scanButtonText}>
            {isScanning ? 'Stop Scan' : 'Scan'}
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={devices}
        keyExtractor={(item) => item.id}
        renderItem={renderDevice}
        refreshControl={
          <RefreshControl
            refreshing={isScanning}
            onRefresh={startScanning}
            tintColor="#00d4aa"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No devices found</Text>
            <Text style={styles.emptySubtext}>Pull down to scan for devices</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  backButtonText: {
    color: '#00d4aa',
    fontSize: 18,
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  scanButton: {
    backgroundColor: '#00d4aa',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  scanningButton: {
    backgroundColor: '#ff6b6b',
  },
  scanIcon: {
    marginRight: 8,
  },
  scanButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  deviceCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a3e',
  },
  deviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  deviceIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  deviceType: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  walletAddress: {
    fontSize: 11,
    color: '#00d4aa',
    fontFamily: 'monospace',
  },
  deviceStatus: {
    alignItems: 'flex-end',
  },
  signalStrength: {
    fontSize: 16,
    marginBottom: 2,
  },
  rssi: {
    fontSize: 10,
    color: '#888',
  },
  deviceActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
  },
  connectButton: {
    backgroundColor: '#00d4aa',
  },
  disconnectButton: {
    backgroundColor: '#ff6b6b',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  addWalletButton: {
    backgroundColor: '#4a4a5e',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addWalletText: {
    color: '#fff',
    fontSize: 12,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#888',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
  },
});

export default BluetoothDevicesScreen;