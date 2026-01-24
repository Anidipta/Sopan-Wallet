import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StellarService } from '../services/StellarService';
import { StorageService } from '../services/StorageService';
import SopanIcon from '../components/SopanIcon';
import { Image } from 'react-native';

export const WalletScreen: React.FC<{ onNavigate: (screen: string) => void }> = ({ onNavigate }) => {
  const [balance, setBalance] = useState<number>(0);
  const [publicKey, setPublicKey] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  const stellar = new StellarService('testnet');
  const storage = new StorageService();

  useEffect(() => {
    initWallet();
  }, []);

  const initWallet = async () => {
    try {
      let wallet = await storage.getWallet();
      
      if (!wallet) {
        const newWallet = await stellar.createWallet();
        await storage.saveWallet(newWallet.publicKey, newWallet.secretKey);
        wallet = newWallet;
      }

      setPublicKey(wallet.publicKey);
      await fetchBalance(wallet.publicKey);
      await checkConnectivity();

      // Subscribe to real-time balance updates
      const unsubscribe = stellar.subscribeToBalance(wallet.publicKey, (newBalance) => {
        // Only log if balance actually changed significantly
        if (Math.abs(newBalance - balance) > 0.01) {
          console.log('💰 Balance updated:', newBalance);
        }
        setBalance(newBalance);
      });

      // Cleanup subscription on unmount
      return () => {
        unsubscribe();
      };
    } catch (error) {
      console.error('Wallet init failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBalance = async (pubKey: string) => {
    try {
      const bal = await stellar.getBalance(pubKey);
      setBalance(bal);
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    }
  };

  const checkConnectivity = async () => {
    const online = await stellar.isOnline();
    setIsOnline(online);
  };

  const copyAddress = async () => {
    try {
      const Clipboard = require('expo-clipboard');
      await Clipboard.setStringAsync(publicKey);
      console.log('✅ Address copied to clipboard');
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchBalance(publicKey);
      await checkConnectivity();
      console.log('✅ Refreshed balance');
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#14F195" />
        <Text style={styles.loadingText}>Initializing Wallet...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#14F195"
            colors={['#14F195']}
          />
        }
      >
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Image source={SopanIcon} style={{ width: 32, height: 32, resizeMode: 'contain' }} />
          <Text style={styles.title}>SOPAN</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={[styles.statusBadge, isOnline ? styles.online : styles.offline]}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>{isOnline ? 'Online' : 'Offline'}</Text>
          </View>
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={() => onNavigate('profile')}
          >
            <Text style={styles.profileButtonText}>👤</Text>
          </TouchableOpacity>
        </View>
      </View>

      <LinearGradient
        colors={['#14F195', '#9945FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.balanceCard}
      >
        <View style={styles.balanceContent}>
          <Text style={styles.balanceLabel}>Total Balance</Text>
          <Text style={styles.balanceAmount}>{balance.toFixed(4)} XLM</Text>
          <Text style={styles.balanceUsd}>≈ ${(balance * 0.12).toFixed(2)} USD</Text>
        </View>
      </LinearGradient>

      <View style={styles.addressCard}>
        <Text style={styles.addressLabel}>Your Address</Text>
        <Text style={styles.addressText} numberOfLines={1} ellipsizeMode="middle">
          {publicKey}
        </Text>
        <TouchableOpacity style={styles.copyButton} onPress={copyAddress}>
          <Text style={styles.copyButtonText}>Copy Address</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.actionsGrid}>
        <TouchableOpacity style={styles.actionButton} onPress={() => onNavigate('send')}>
          <LinearGradient
            colors={['#9945FF', '#7B2FD9']}
            style={styles.actionIcon}
          >
            <Text style={styles.actionIconText}>↑</Text>
          </LinearGradient>
          <Text style={styles.actionLabel}>Send</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={() => onNavigate('receive')}>
          <LinearGradient
            colors={['#14F195', '#00D4A0']}
            style={styles.actionIcon}
          >
            <Text style={styles.actionIconText}>↓</Text>
          </LinearGradient>
          <Text style={styles.actionLabel}>Receive</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={() => onNavigate('bluetooth')}>
          <LinearGradient
            colors={['#00D4FF', '#0099CC']}
            style={styles.actionIcon}
          >
            <Text style={styles.actionIconText}>⚡</Text>
          </LinearGradient>
          <Text style={styles.actionLabel}>Bluetooth</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={() => onNavigate('history')}>
          <LinearGradient
            colors={['#FF6B9D', '#FF4081']}
            style={styles.actionIcon}
          >
            <Text style={styles.actionIconText}>📋</Text>
          </LinearGradient>
          <Text style={styles.actionLabel}>History</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={() => onNavigate('settings')}>
          <LinearGradient
            colors={['#666', '#444']}
            style={styles.actionIcon}
          >
            <Text style={styles.actionIconText}>⚙️</Text>
          </LinearGradient>
          <Text style={styles.actionLabel}>Settings</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>💡 Offline Payments</Text>
        <Text style={styles.infoText}>
          Send payments via Bluetooth when offline. Transactions sync automatically when you're back online.
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
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#222222',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileButtonText: {
    fontSize: 20,
  },
  online: {
    backgroundColor: 'rgba(20, 241, 149, 0.15)',
  },
  offline: {
    backgroundColor: 'rgba(255, 107, 157, 0.15)',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#14F195',
  },
  statusText: {
    color: '#14F195',
    fontSize: 12,
    fontWeight: '600',
  },
  balanceCard: {
    margin: 20,
    padding: 40,
    borderRadius: 24,
    minHeight: 180,
  },
  balanceContent: {
    alignItems: 'center',
  },
  balanceLabel: {
    color: 'rgba(0, 0, 0, 0.7)',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  balanceAmount: {
    color: '#000',
    fontSize: 48,
    fontWeight: '700',
    letterSpacing: -1,
    marginBottom: 8,
  },
  balanceUsd: {
    color: 'rgba(0, 0, 0, 0.6)',
    fontSize: 16,
    fontWeight: '500',
  },
  addressCard: {
    margin: 20,
    marginTop: 0,
    padding: 24,
    backgroundColor: '#111111',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#222222',
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
    marginBottom: 16,
    fontFamily: 'monospace',
  },
  copyButton: {
    backgroundColor: '#2A2A3A',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  copyButtonText: {
    color: '#14F195',
    fontSize: 14,
    fontWeight: '600',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 20,
    gap: 16,
  },
  actionButton: {
    width: '47%',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#111111',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#222222',
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  actionIconText: {
    fontSize: 28,
  },
  actionLabel: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  infoCard: {
    margin: 20,
    padding: 24,
    backgroundColor: '#111111',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#222222',
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
