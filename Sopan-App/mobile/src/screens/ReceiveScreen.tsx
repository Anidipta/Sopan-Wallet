import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { StorageService } from '../services/StorageService';
import { StellarService } from '../services/StellarService';

export const ReceiveScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [publicKey, setPublicKey] = useState<string>('');
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const storage = new StorageService();
  const stellar = new StellarService('testnet');

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    try {
      const wallet = await storage.getWallet();
      if (wallet) {
        setPublicKey(wallet.publicKey);
        const bal = await stellar.getBalance(wallet.publicKey);
        setBalance(bal);
      }
    } catch (error) {
      console.error('Failed to load wallet:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyAddress = async () => {
    try {
      const Clipboard = require('expo-clipboard');
      await Clipboard.setStringAsync(publicKey);
      Alert.alert('✅ Copied!', 'Address copied to clipboard');
    } catch (error) {
      Alert.alert('Error', 'Failed to copy address');
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Send XLM to my Stellar address:\n${publicKey}`,
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Receive XLM</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.contentScroll}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.qrContainer}>
          <View style={styles.qrWrapper}>
            <QRCode
              value={publicKey}
              size={240}
              backgroundColor="white"
              color="#000"
            />
          </View>
          <Text style={styles.qrLabel}>Scan to send XLM</Text>
        </View>

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Current Balance</Text>
          <Text style={styles.balanceAmount}>{balance.toFixed(4)} XLM</Text>
        </View>

        <View style={styles.addressCard}>
          <Text style={styles.addressLabel}>Your Stellar Address</Text>
          <Text style={styles.addressText} numberOfLines={2}>
            {publicKey}
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton} onPress={handleCopyAddress}>
            <Text style={styles.actionIcon}>📋</Text>
            <Text style={styles.actionText}>Copy Address</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
            <Text style={styles.actionIcon}>📤</Text>
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>💡</Text>
          <Text style={styles.infoTitle}>How to receive</Text>
          <Text style={styles.infoText}>
            Share your QR code or Stellar address with the sender. They can scan it to send XLM to you, even offline via Bluetooth.
          </Text>
        </View>
      </ScrollView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(153, 69, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 100,
  },
  contentScroll: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    alignItems: 'center',
    paddingBottom: 40,
  },
  content: {
    padding: 20,
    alignItems: 'center',
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  qrWrapper: {
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 24,
    marginBottom: 16,
  },
  qrLabel: {
    color: '#888',
    fontSize: 14,
  },
  balanceCard: {
    width: '100%',
    backgroundColor: 'rgba(153, 69, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(153, 69, 255, 0.3)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  balanceLabel: {
    color: '#888',
    fontSize: 12,
    marginBottom: 8,
  },
  balanceAmount: {
    color: '#14F195',
    fontSize: 32,
    fontWeight: 'bold',
  },
  addressCard: {
    width: '100%',
    backgroundColor: 'rgba(153, 69, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(153, 69, 255, 0.3)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  addressLabel: {
    color: '#888',
    fontSize: 12,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  addressText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'monospace',
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    backgroundColor: 'rgba(153, 69, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(153, 69, 255, 0.3)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  actionText: {
    color: '#9945FF',
    fontSize: 14,
    fontWeight: '600',
  },
  infoCard: {
    width: '100%',
    backgroundColor: 'rgba(20, 241, 149, 0.1)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(20, 241, 149, 0.3)',
  },
  infoIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  infoTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  infoText: {
    color: '#888',
    fontSize: 14,
    lineHeight: 20,
  },
});
