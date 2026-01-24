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
  ScrollView,
  useWindowDimensions,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { bluetoothService } from '../services/BluetoothService';
import { MockDevice } from '../services/BluetoothSimulator';

interface BluetoothDevicesScreenProps {
  onBack: () => void;
}

const BluetoothDevicesScreen: React.FC<BluetoothDevicesScreenProps> = ({ onBack }) => {
  const { width } = useWindowDimensions();
  const [devices, setDevices] = useState<MockDevice[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [connectingDeviceId, setConnectingDeviceId] = useState<string | null>(null);
  const [localName, setLocalName] = useState('SOPAN Device');

  const numColumns = width > 1000 ? 3 : width > 600 ? 2 : 1;
  const cardWidth = (width - 40 - (numColumns - 1) * 16) / numColumns;

  useEffect(() => {
    // Get local discovery name
    const name = bluetoothService.getLocalName();
    setLocalName(name);

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

    bluetoothService.on('deviceFound', handleDeviceFound);
    bluetoothService.on('deviceConnected', handleDeviceConnected);
    bluetoothService.on('deviceDisconnected', handleDeviceDisconnected);
    bluetoothService.on('scanStarted', handleScanStarted);
    bluetoothService.on('scanStopped', handleScanStopped);

    // Load existing devices
    setDevices(bluetoothService.getAllDevices());

    return () => {
      bluetoothService.off('deviceFound', handleDeviceFound);
      bluetoothService.off('deviceConnected', handleDeviceConnected);
      bluetoothService.off('deviceDisconnected', handleDeviceDisconnected);
      bluetoothService.off('scanStarted', handleScanStarted);
      bluetoothService.off('scanStopped', handleScanStopped);
    };
  }, []);

  const startScanning = async () => {
    try {
      await bluetoothService.requestPermissions();
      await bluetoothService.startScanning();
    } catch (error) {
      Alert.alert('Error', 'Failed to start scanning');
    }
  };

  const stopScanning = () => {
    bluetoothService.stopScanning();
  };

  const connectToDevice = async (device: MockDevice) => {
    if (device.isConnected) {
      bluetoothService.disconnectDevice(device.id);
      return;
    }

    setConnectingDeviceId(device.id);
    const success = await bluetoothService.connectToDevice(device.id);

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
              bluetoothService.addTrustedDevice(device.id, walletAddress);
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
      style={[styles.deviceCard, { width: cardWidth }]}
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
              <Text style={styles.walletText} numberOfLines={1} ellipsizeMode="middle">
                {device.walletAddress}
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.deviceActions}>
        <TouchableOpacity
          style={styles.fullWidthAction}
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
          <Ionicons name="arrow-back" size={24} color="#fff" />
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

      <View style={styles.discoverableBanner}>
        <Text style={styles.discoverableText}>
          NOW DISCOVERABLE AS <Text style={styles.localNameBold}>"{localName.toUpperCase()}"</Text>
        </Text>
      </View>

      <FlatList
        data={devices}
        key={numColumns}
        numColumns={numColumns}
        keyExtractor={(item) => item.id}
        renderItem={renderDevice}
        contentContainerStyle={styles.listContent}
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
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(153, 69, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  scanButton: {
    backgroundColor: '#9945FF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  scanningButton: {
    backgroundColor: '#FF6B35',
  },
  scanIcon: {
    marginRight: 8,
  },
  scanButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  deviceCard: {
    backgroundColor: 'rgba(15, 15, 25, 0.95)',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: 'rgba(153, 69, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  deviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  deviceIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  deviceType: {
    fontSize: 11,
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  walletBadge: {
    backgroundColor: 'rgba(20, 241, 149, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 4,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(20, 241, 149, 0.15)',
  },
  walletText: {
    color: '#14F195',
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '600',
  },
  deviceIconContainer: {
    position: 'relative',
    marginRight: 16,
  },
  statusDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#444',
    borderWidth: 2,
    borderColor: '#0f0f19',
  },
  connectedDot: {
    backgroundColor: '#14F195',
  },
  signalText: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
  },
  deviceActions: {
    flexDirection: 'column',
    width: '100%',
    marginTop: 12,
  },
  fullWidthAction: {
    width: '100%',
    marginBottom: 10,
  },
  actionButton: {
    paddingVertical: 16,
    borderRadius: 4,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#000',
    fontWeight: '900',
    fontSize: 15,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  addWalletButton: {
    paddingVertical: 12,
    borderRadius: 4,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  addWalletText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  discoverableBanner: {
    backgroundColor: 'rgba(20, 241, 149, 0.05)',
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderTopWidth: 1,
    borderColor: 'rgba(20, 241, 149, 0.1)',
  },
  discoverableText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  localNameBold: {
    color: '#14F195',
    fontWeight: '900',
  },
});

export default BluetoothDevicesScreen;