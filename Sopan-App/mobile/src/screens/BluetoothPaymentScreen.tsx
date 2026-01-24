import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { bluetoothSimulator, MockDevice } from '../services/BluetoothSimulator';

interface BluetoothPaymentScreenProps {
  onBack: () => void;
  onManageDevices: () => void;
}

const BluetoothPaymentScreen: React.FC<BluetoothPaymentScreenProps> = ({ onBack, onManageDevices }) => {
  const [connectedDevices, setConnectedDevices] = useState<MockDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<MockDevice | null>(null);
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);

  useEffect(() => {
    // Load connected devices
    setConnectedDevices(bluetoothSimulator.getConnectedDevices());

    // Set up event listeners
    const handleDeviceConnected = (device: MockDevice) => {
      setConnectedDevices(bluetoothSimulator.getConnectedDevices());
    };

    const handleDeviceDisconnected = (device: MockDevice) => {
      setConnectedDevices(bluetoothSimulator.getConnectedDevices());
      if (selectedDevice?.id === device.id) {
        setSelectedDevice(null);
      }
    };

    const handlePaymentCompleted = (data: any) => {
      setRecentTransactions(prev => [
        {
          id: Date.now().toString(),
          device: data.device,
          amount: data.amount,
          txHash: data.txHash,
          timestamp: new Date(),
          status: 'completed',
          isReal: data.isReal || false
        },
        ...prev.slice(0, 9) // Keep last 10 transactions
      ]);
    };

    const handlePaymentFailed = (data: any) => {
      setRecentTransactions(prev => [
        {
          id: Date.now().toString(),
          device: data.device,
          amount: data.amount,
          error: data.error,
          timestamp: new Date(),
          status: 'failed'
        },
        ...prev.slice(0, 9)
      ]);
    };

    bluetoothSimulator.on('deviceConnected', handleDeviceConnected);
    bluetoothSimulator.on('deviceDisconnected', handleDeviceDisconnected);
    bluetoothSimulator.on('paymentCompleted', handlePaymentCompleted);
    bluetoothSimulator.on('paymentFailed', handlePaymentFailed);

    return () => {
      bluetoothSimulator.removeAllListeners();
    };
  }, [selectedDevice]);

  const sendPayment = async () => {
    if (!selectedDevice) {
      Alert.alert('Error', 'Please select a device');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setIsProcessing(true);

    try {
      const result = await bluetoothSimulator.sendPayment(
        selectedDevice.id,
        parseFloat(amount),
        memo || undefined
      );

      if (result.success) {
        const isRealPayment = selectedDevice.id === 'device-4' && selectedDevice.walletAddress === '7SsNDQ4bdTMAz1W9hYdYRPybmWMjMmmbttAkQBXJ5J8Z';
        
        Alert.alert(
          isRealPayment ? '🚀 Real Payment Sent!' : '✅ Payment Sent!',
          `Successfully sent ${amount} XLM to ${selectedDevice.name}\n${isRealPayment ? '💰 Real Stellar transaction' : '🎭 Simulated payment'}\nTx: ${result.txHash?.slice(0, 8)}...`,
          [{ text: 'OK', onPress: () => {
            setAmount('');
            setMemo('');
          }}]
        );
      } else {
        Alert.alert('Payment Failed', result.error || 'Unknown error');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send payment');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeviceSelection = (device: MockDevice) => {
    setSelectedDevice(device);
    
    // Show special message for OnePlus 12 with real wallet
    if (device.id === 'device-4' && device.walletAddress === '7SsNDQ4bdTMAz1W9hYdYRPybmWMjMmmbttAkQBXJ5J8Z') {
      Alert.alert(
        '🚀 Real Payment Mode',
        `Selected: ${device.name}\n\n💰 Real Stellar transactions will be sent to:\n${device.walletAddress}\n\n⚠️ This will use actual XLM from your wallet!`,
        [{ text: 'Got it!', style: 'default' }]
      );
    }
  };

  const renderDeviceOption = ({ item: device }: { item: MockDevice }) => (
    <TouchableOpacity
      style={styles.deviceCard}
      onPress={() => handleDeviceSelection(device)}
    >
      <LinearGradient
        colors={selectedDevice?.id === device.id ? ['#00D4FF', '#0099CC'] : ['#1a1a2e', '#2a2a3e']}
        style={styles.deviceGradient}
      >
        <View style={styles.deviceHeader}>
          <Text style={styles.deviceEmoji}>
            {device.deviceType === 'Samsung' ? '📱' : 
             device.deviceType === 'Vivo' ? '📲' : 
             device.deviceType === 'iPhone' ? '📱' : '📱'}
          </Text>
          <View style={styles.connectedDot} />
        </View>
        <Text style={styles.deviceName}>{device.name.split(' ')[0]}</Text>
        <Text style={styles.deviceBrand}>{device.deviceType}</Text>
        <Text style={styles.deviceWallet}>
          {device.walletAddress?.slice(0, 6)}...
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderTransaction = ({ item: tx }: { item: any }) => (
    <LinearGradient
      colors={tx.isReal ? ['#14F195', '#00D4A0'] : ['#1a1a2e', '#2a2a3e']}
      style={styles.transactionCard}
    >
      <View style={styles.transactionHeader}>
        <Text style={styles.transactionDevice}>{tx.device.name}</Text>
        <View style={styles.transactionBadges}>
          {tx.isReal && (
            <View style={styles.realBadge}>
              <Text style={styles.realBadgeText}>REAL</Text>
            </View>
          )}
          <Text style={[
            styles.transactionStatus,
            tx.status === 'completed' ? styles.statusCompleted : styles.statusFailed
          ]}>
            {tx.status === 'completed' ? '✅' : '❌'}
          </Text>
        </View>
      </View>
      <Text style={[styles.transactionAmount, tx.isReal && styles.realTransactionAmount]}>
        {tx.amount} XLM {tx.isReal ? '🚀' : '🎭'}
      </Text>
      {tx.txHash && (
        <Text style={[styles.transactionHash, tx.isReal && styles.realTransactionHash]}>
          {tx.txHash.slice(0, 12)}...{tx.txHash.slice(-12)}
        </Text>
      )}
      {tx.error && (
        <Text style={styles.transactionError}>{tx.error}</Text>
      )}
      <Text style={styles.transactionTime}>
        {tx.timestamp.toLocaleTimeString()}
      </Text>
    </LinearGradient>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Bluetooth Pay</Text>
        <TouchableOpacity style={styles.manageButton} onPress={onManageDevices}>
          <LinearGradient
            colors={['#00D4FF', '#0099CC']}
            style={styles.manageGradient}
          >
            <Text style={styles.manageButtonText}>⚡</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {bluetoothSimulator.getTrustedDevices().length === 0 ? (
          <View style={styles.emptyState}>
            <LinearGradient
              colors={['#1a1a2e', '#2a2a3e']}
              style={styles.emptyCard}
            >
              <Text style={styles.emptyIcon}>⚡</Text>
              <Text style={styles.emptyTitle}>Connect & Pay</Text>
              <Text style={styles.emptySubtitle}>
                Set up your Bluetooth devices for instant offline payments
              </Text>
              <TouchableOpacity onPress={onManageDevices}>
                <LinearGradient
                  colors={['#00D4FF', '#0099CC']}
                  style={styles.setupButton}
                >
                  <Text style={styles.setupButtonText}>Get Started</Text>
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        ) : (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Connected Devices</Text>
              <TouchableOpacity onPress={onManageDevices} style={styles.addDeviceBtn}>
                <Text style={styles.addDeviceText}>+ Add</Text>
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={bluetoothSimulator.getTrustedDevices()}
              keyExtractor={(item) => item.id}
              renderItem={renderDeviceOption}
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.devicesList}
            />

            {selectedDevice && (
              <LinearGradient
                colors={selectedDevice.id === 'device-4' ? ['#14F195', '#00D4A0'] : ['#1a1a2e', '#2a2a3e']}
                style={styles.paymentCard}
              >
                <View style={styles.paymentHeader}>
                  <Text style={[styles.paymentTitle, selectedDevice.id === 'device-4' && styles.realPaymentTitle]}>
                    Send Payment
                  </Text>
                  <View style={styles.selectedDeviceInfo}>
                    <Text style={[styles.selectedDeviceName, selectedDevice.id === 'device-4' && styles.realDeviceName]}>
                      {selectedDevice.name}
                    </Text>
                    <View style={[styles.connectedBadge, selectedDevice.id === 'device-4' && styles.realConnectedBadge]}>
                      <Text style={[styles.connectedBadgeText, selectedDevice.id === 'device-4' && styles.realConnectedBadgeText]}>
                        Connected
                      </Text>
                    </View>
                  </View>
                </View>

                {selectedDevice.id === 'device-4' && (
                  <View style={styles.realPaymentWarning}>
                    <Text style={styles.warningText}>
                      ⚠️ Real Solana transaction to: {selectedDevice.walletAddress?.slice(0, 8)}...{selectedDevice.walletAddress?.slice(-8)}
                    </Text>
                  </View>
                )}

                <View style={styles.amountSection}>
                  <Text style={styles.amountLabel}>Amount</Text>
                  <View style={styles.amountInput}>
                    <TextInput
                      style={styles.amountText}
                      value={amount}
                      onChangeText={setAmount}
                      placeholder="0.00"
                      placeholderTextColor="#666"
                      keyboardType="numeric"
                    />
                    <Text style={styles.currencyText}>XLM</Text>
                  </View>
                </View>

                <View style={styles.memoSection}>
                  <TextInput
                    style={styles.memoInput}
                    value={memo}
                    onChangeText={setMemo}
                    placeholder="Add a note (optional)"
                    placeholderTextColor="#666"
                  />
                </View>

                <TouchableOpacity
                  onPress={sendPayment}
                  disabled={isProcessing || !amount}
                >
                  <LinearGradient
                    colors={isProcessing || !amount ? ['#666', '#444'] : ['#00D4FF', '#0099CC']}
                    style={styles.sendButton}
                  >
                    {isProcessing ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.sendButtonText}>
                        Send {amount || '0'} XLM ⚡
                      </Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </LinearGradient>
            )}

          {recentTransactions.length > 0 && (
            <View style={styles.transactionsSection}>
              <Text style={styles.sectionTitle}>Recent Transactions</Text>
              <FlatList
                data={recentTransactions}
                keyExtractor={(item) => item.id}
                renderItem={renderTransaction}
                style={styles.transactionsList}
              />
            </View>
          )}
        </>
      )}
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
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    color: '#14F195',
    fontSize: 20,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  manageButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  manageGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  manageButtonText: {
    fontSize: 20,
  },
  emptyState: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  emptyCard: {
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  setupButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  setupButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  addDeviceBtn: {
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addDeviceText: {
    color: '#14F195',
    fontSize: 14,
    fontWeight: '600',
  },
  devicesList: {
    paddingLeft: 20,
    marginBottom: 24,
  },
  deviceCard: {
    marginRight: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },
  deviceGradient: {
    width: 120,
    padding: 20,
    alignItems: 'center',
  },
  deviceHeader: {
    position: 'relative',
    marginBottom: 12,
  },
  deviceEmoji: {
    fontSize: 40,
  },
  connectedDot: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#14F195',
    borderWidth: 2,
    borderColor: '#000',
  },
  deviceName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 4,
  },
  deviceBrand: {
    fontSize: 12,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 4,
  },
  deviceWallet: {
    fontSize: 10,
    color: '#14F195',
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  paymentForm: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginTop: 10,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#2a2a3e',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#00d4aa',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#666',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  transactionsSection: {
    marginTop: 20,
  },
  transactionsList: {
    maxHeight: 200,
  },
  transactionCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  transactionDevice: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  transactionStatus: {
    fontSize: 16,
  },
  statusCompleted: {
    color: '#00d4aa',
  },
  statusFailed: {
    color: '#ff6b6b',
  },
  transactionAmount: {
    fontSize: 16,
    color: '#00d4aa',
    fontWeight: '600',
    marginBottom: 4,
  },
  transactionHash: {
    fontSize: 10,
    color: '#888',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  transactionError: {
    fontSize: 12,
    color: '#ff6b6b',
    marginBottom: 4,
  },
  transactionTime: {
    fontSize: 10,
    color: '#666',
  },
  paymentCard: {
    margin: 20,
    borderRadius: 20,
    padding: 24,
  },
  paymentHeader: {
    marginBottom: 24,
  },
  paymentTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  selectedDeviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedDeviceName: {
    fontSize: 16,
    color: '#ccc',
  },
  connectedBadge: {
    backgroundColor: '#14F195',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  connectedBadgeText: {
    fontSize: 12,
    color: '#000',
    fontWeight: 'bold',
  },
  realPaymentTitle: {
    color: '#000',
  },
  realDeviceName: {
    color: '#000',
  },
  realConnectedBadge: {
    backgroundColor: '#000',
  },
  realConnectedBadgeText: {
    color: '#14F195',
  },
  realPaymentWarning: {
    backgroundColor: '#000',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  warningText: {
    fontSize: 12,
    color: '#14F195',
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  amountSection: {
    marginBottom: 20,
  },
  amountLabel: {
    fontSize: 14,
    color: '#888',
    marginBottom: 8,
  },
  amountInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  amountText: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  currencyText: {
    fontSize: 18,
    color: '#14F195',
    fontWeight: 'bold',
  },
  memoSection: {
    marginBottom: 24,
  },
  memoInput: {
    backgroundColor: '#000',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#fff',
  },
  sendButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  sendButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  transactionsSection: {
    margin: 20,
  },
  transactionsList: {
    maxHeight: 200,
  },
  transactionCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  transactionDevice: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  transactionBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  realBadge: {
    backgroundColor: '#000',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  realBadgeText: {
    fontSize: 10,
    color: '#14F195',
    fontWeight: 'bold',
  },
  transactionStatus: {
    fontSize: 16,
  },
  statusCompleted: {
    color: '#14F195',
  },
  statusFailed: {
    color: '#ff6b6b',
  },
  transactionAmount: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  realTransactionAmount: {
    color: '#000',
  },
  transactionHash: {
    fontSize: 12,
    color: '#888',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  realTransactionHash: {
    color: '#000',
    opacity: 0.7,
  },
  transactionError: {
    fontSize: 12,
    color: '#ff6b6b',
    marginBottom: 4,
  },
  transactionTime: {
    fontSize: 10,
    color: '#666',
  },
});

export default BluetoothPaymentScreen;