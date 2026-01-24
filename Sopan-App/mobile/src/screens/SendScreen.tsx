import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { PaymentService } from '../services/PaymentService';
import { StorageService } from '../services/StorageService';
import { BiometricService } from '../services/BiometricService';
import { NotificationService } from '../services/NotificationService';

interface SendScreenProps {
  onBack: () => void;
  onScanQR: () => void;
  initialRecipient?: string;
}

export const SendScreen: React.FC<SendScreenProps> = ({ onBack, onScanQR, initialRecipient }) => {
  const [recipient, setRecipient] = useState(initialRecipient || '');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  // Update recipient when initialRecipient changes (from QR scan)
  useEffect(() => {
    if (initialRecipient) {
      setRecipient(initialRecipient);
      console.log('✅ Address autofilled from QR scan:', initialRecipient);
    }
  }, [initialRecipient]);

  const payment = new PaymentService();
  const storage = new StorageService();
  const biometric = new BiometricService();
  const notifications = NotificationService.getInstance();

  const handleSend = async () => {
    if (!recipient || !amount) {
      Alert.alert('Error', 'Please enter recipient and amount');
      return;
    }

    const wallet = await storage.getWallet();
    if (!wallet) {
      Alert.alert('Error', 'Wallet not found');
      return;
    }

    // Biometric authentication
    const biometricAvailable = await biometric.isAvailable();
    if (biometricAvailable) {
      const authenticated = await biometric.authenticateForPayment(parseFloat(amount));
      if (!authenticated) {
        Alert.alert('Authentication Failed', 'Payment cancelled');
        return;
      }
    }

    setLoading(true);
    const result = await payment.sendPayment(
      recipient,
      parseFloat(amount),
      wallet.encryptedPrivateKey
    );
    setLoading(false);

    if (result.success) {
      Alert.alert('Success', `Payment sent!\nTX: ${result.txId}`);
      await notifications.notifyPaymentSent(parseFloat(amount), recipient);
      setRecipient('');
      setAmount('');
    } else {
      Alert.alert('Error', result.error || 'Payment failed');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Send XLM</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Recipient Address</Text>
          <TextInput
            style={[styles.input, initialRecipient && styles.inputAutofilled]}
            placeholder="Enter Stellar address (G...)"
            placeholderTextColor="#666"
            value={recipient}
            onChangeText={setRecipient}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {initialRecipient && (
            <View style={styles.autofilledBadge}>
              <Text style={styles.autofilledText}>✓ From QR Scan</Text>
            </View>
          )}
          <TouchableOpacity style={styles.scanButton} onPress={onScanQR}>
            <Text style={styles.scanButtonText}>📷 Scan QR</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Amount (XLM)</Text>
          <View style={styles.amountInputWrapper}>
            <TextInput
              style={styles.amountInput}
              placeholder="0.00"
              placeholderTextColor="#666"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
            />
            <Text style={styles.currency}>XLM</Text>
          </View>
          <View style={styles.quickAmounts}>
            {['0.1', '0.5', '1.0', '5.0'].map((amt) => (
              <TouchableOpacity
                key={amt}
                style={styles.quickAmountButton}
                onPress={() => setAmount(amt)}
              >
                <Text style={styles.quickAmountText}>{amt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Network Fee</Text>
            <Text style={styles.summaryValue}>~0.00001 XLM</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total</Text>
            <Text style={styles.summaryValueBold}>
              {amount ? (parseFloat(amount) + 0.00001).toFixed(6) : '0.00'} XLM
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.sendButton, loading && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.sendButtonText}>Send Payment</Text>
          )}
        </TouchableOpacity>
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
  form: {
    padding: 20,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    color: '#888',
    fontSize: 14,
    marginBottom: 8,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#1A1A24',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    fontFamily: 'monospace',
  },
  inputAutofilled: {
    borderWidth: 2,
    borderColor: '#14F195',
    backgroundColor: 'rgba(20, 241, 149, 0.05)',
  },
  autofilledBadge: {
    position: 'absolute',
    top: 8,
    right: 16,
    backgroundColor: '#14F195',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  autofilledText: {
    color: '#000',
    fontSize: 10,
    fontWeight: 'bold',
  },
  scanButton: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#2A2A3A',
    borderRadius: 12,
    alignItems: 'center',
  },
  scanButtonText: {
    color: '#14F195',
    fontSize: 14,
    fontWeight: '600',
  },
  amountInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A24',
    borderRadius: 12,
    paddingRight: 16,
  },
  amountInput: {
    flex: 1,
    padding: 16,
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  currency: {
    color: '#888',
    fontSize: 18,
    fontWeight: '600',
  },
  quickAmounts: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  quickAmountButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#2A2A3A',
    borderRadius: 12,
    alignItems: 'center',
  },
  quickAmountText: {
    color: '#14F195',
    fontSize: 14,
    fontWeight: '600',
  },
  summary: {
    backgroundColor: '#1A1A24',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    color: '#888',
    fontSize: 14,
  },
  summaryValue: {
    color: '#fff',
    fontSize: 14,
  },
  summaryValueBold: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sendButton: {
    backgroundColor: '#14F195',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
