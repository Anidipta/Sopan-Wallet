import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Linking } from 'react-native';
import * as Clipboard from 'expo-clipboard';

interface Transaction {
  id: string;
  type: 'sent' | 'received';
  amount: number;
  address: string;
  timestamp: number;
  status: 'confirmed' | 'pending' | 'failed';
  signature?: string;
  fee?: number;
  blockTime?: number;
}

interface TransactionDetailsScreenProps {
  transaction: Transaction;
  onBack: () => void;
}

export const TransactionDetailsScreen: React.FC<TransactionDetailsScreenProps> = ({ 
  transaction, 
  onBack 
}) => {
  const copyToClipboard = async (text: string, label: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert('Copied', `${label} copied to clipboard`);
  };

  const openExplorer = () => {
    if (transaction.signature) {
      const url = `https://stellar.expert/explorer/testnet/tx/${transaction.signature}`;
      Linking.openURL(url);
    }
  };

  const shareTransaction = () => {
    Alert.alert('Share', 'Share functionality coming soon');
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const getStatusColor = () => {
    switch (transaction.status) {
      case 'confirmed':
        return '#14F195';
      case 'pending':
        return '#FFA500';
      case 'failed':
        return '#FF4444';
      default:
        return '#666';
    }
  };

  const getStatusIcon = () => {
    switch (transaction.status) {
      case 'confirmed':
        return '✓';
      case 'pending':
        return '⏳';
      case 'failed':
        return '✗';
      default:
        return '?';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Transaction Details</Text>
        <TouchableOpacity onPress={shareTransaction} style={styles.shareButton}>
          <Text style={styles.shareButtonText}>↗</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Status Card */}
        <View style={[styles.statusCard, { borderColor: getStatusColor() }]}>
          <Text style={[styles.statusIcon, { color: getStatusColor() }]}>
            {getStatusIcon()}
          </Text>
          <Text style={[styles.statusText, { color: getStatusColor() }]}>
            {transaction.status.toUpperCase()}
          </Text>
        </View>

        {/* Amount Card */}
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>
            {transaction.type === 'sent' ? 'Sent' : 'Received'}
          </Text>
          <Text style={[
            styles.amount,
            { color: transaction.type === 'sent' ? '#FF6B6B' : '#14F195' }
          ]}>
            {transaction.type === 'sent' ? '-' : '+'}{transaction.amount} XLM
          </Text>
          <Text style={styles.amountUsd}>
            ≈ ${(transaction.amount * 0.12).toFixed(2)} USD
          </Text>
        </View>

        {/* Details */}
        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date & Time</Text>
            <Text style={styles.detailValue}>{formatDate(transaction.timestamp)}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>
              {transaction.type === 'sent' ? 'To' : 'From'}
            </Text>
            <TouchableOpacity 
              style={styles.addressContainer}
              onPress={() => copyToClipboard(transaction.address, 'Address')}
            >
              <Text style={styles.detailValue} numberOfLines={1}>
                {transaction.address}
              </Text>
              <Text style={styles.copyIcon}>📋</Text>
            </TouchableOpacity>
          </View>

          {transaction.signature && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Transaction ID</Text>
              <TouchableOpacity 
                style={styles.addressContainer}
                onPress={() => copyToClipboard(transaction.signature!, 'Transaction ID')}
              >
                <Text style={styles.detailValue} numberOfLines={1}>
                  {transaction.signature}
                </Text>
                <Text style={styles.copyIcon}>📋</Text>
              </TouchableOpacity>
            </View>
          )}

          {transaction.fee && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Network Fee</Text>
              <Text style={styles.detailValue}>{transaction.fee || '0.00001'} XLM</Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Type</Text>
            <Text style={styles.detailValue}>
              {transaction.type === 'sent' ? 'Transfer Out' : 'Transfer In'}
            </Text>
          </View>
        </View>

        {/* Actions */}
        {transaction.signature && (
          <TouchableOpacity style={styles.explorerButton} onPress={openExplorer}>
            <Text style={styles.explorerButtonText}>View on Stellar Expert</Text>
            <Text style={styles.explorerButtonIcon}>→</Text>
          </TouchableOpacity>
        )}

        {transaction.status === 'pending' && (
          <View style={styles.infoCard}>
            <Text style={styles.infoIcon}>ℹ️</Text>
            <Text style={styles.infoText}>
              This transaction is pending and will be confirmed when you're online.
            </Text>
          </View>
        )}

        {transaction.status === 'failed' && (
          <View style={[styles.infoCard, { borderColor: '#FF4444' }]}>
            <Text style={styles.infoIcon}>⚠️</Text>
            <Text style={styles.infoText}>
              This transaction failed. Please try again or contact support.
            </Text>
          </View>
        )}
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 20,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statusCard: {
    backgroundColor: '#111',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
  },
  statusIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  statusText: {
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  amountCard: {
    backgroundColor: '#111',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#222',
  },
  amountLabel: {
    color: '#888',
    fontSize: 14,
    marginBottom: 8,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  amount: {
    fontSize: 42,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  amountUsd: {
    color: '#666',
    fontSize: 16,
  },
  detailsCard: {
    backgroundColor: '#111',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#222',
  },
  detailRow: {
    marginBottom: 20,
  },
  detailLabel: {
    color: '#888',
    fontSize: 12,
    marginBottom: 8,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  detailValue: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'monospace',
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  copyIcon: {
    fontSize: 16,
  },
  explorerButton: {
    backgroundColor: '#9945FF',
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  explorerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  explorerButtonIcon: {
    color: '#fff',
    fontSize: 20,
  },
  infoCard: {
    backgroundColor: 'rgba(20, 241, 149, 0.1)',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(20, 241, 149, 0.3)',
  },
  infoIcon: {
    fontSize: 20,
  },
  infoText: {
    flex: 1,
    color: '#888',
    fontSize: 14,
    lineHeight: 20,
  },
});
