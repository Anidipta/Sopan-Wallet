import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StellarService } from '../services/StellarService';
import { StorageService } from '../services/StorageService';
import SopanIcon from '../components/SopanIcon';
import { Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const WalletScreen: React.FC<{ onNavigate: (screen: string) => void }> = ({ onNavigate }) => {
  const [balance, setBalance] = useState<number>(0);
  const [publicKey, setPublicKey] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [activeTab, setActiveTab] = useState<'tokens' | 'collectibles'>('tokens');
  const [showToast, setShowToast] = useState(false);

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
        wallet = { publicKey: newWallet.publicKey, encryptedPrivateKey: newWallet.secretKey };
      }

      if (wallet) {
        setPublicKey(wallet.publicKey);
        await fetchBalance(wallet.publicKey);
        await checkConnectivity();

        // Subscribe to real-time balance updates
        const unsubscribe = stellar.subscribeToBalance(wallet.publicKey, (newBalance) => {
          if (Math.abs(newBalance - balance) > 0.01) {
            console.log('💰 Balance updated:', newBalance);
          }
          setBalance(newBalance);
        });

        return () => {
          unsubscribe();
        };
      }
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

  const copyAddress = async () => {
    try {
      const Clipboard = require('expo-clipboard');
      await Clipboard.setStringAsync(publicKey);
      console.log('✅ Address copied to clipboard');
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const fundWallet = async () => {
    try {
      setRefreshing(true);
      const response = await fetch(`https://friendbot.stellar.org?addr=${publicKey}`);
      if (response.ok) {
        console.log('✅ Wallet funded with 10,000 XLM');
        await fetchBalance(publicKey);

        setShowToast(true);
        setTimeout(() => setShowToast(false), 1500); // 1.5s popup
      } else {
        console.error('Failed to fund wallet');
        Alert.alert('Error', 'Failed to fund wallet');
      }
    } catch (error) {
      console.error('Friendbot error:', error);
      Alert.alert('Error', 'Friendbot service unavailable');
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#9945FF" />
        <Text style={styles.loadingText}>Initializing Wallet...</Text>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['#000000', '#0d0015', '#1a0033', '#1f0d33', '#2d1a4d', '#331a00', '#4d2600']}
      locations={[0, 0.15, 0.3, 0.5, 0.65, 0.8, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      {/* Toast Notification */}
      {showToast && (
        <View style={styles.toastContainer}>
          <View style={styles.toastContent}>
            <Ionicons name="checkmark-circle" size={24} color="#14F195" />
            <Text style={styles.toastText}>Account Funded Successfully!</Text>
          </View>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#9945FF"
            colors={['#9945FF']}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.scanButton}>
            <Ionicons name="scan" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => onNavigate('profile')}
          >
            <Ionicons name="person-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>


        {/* Balance Display */}
        <View style={styles.balanceContainer}>
          <Text style={styles.balanceAmount}>${(balance * 0.12).toFixed(2)}</Text>
          <Text style={styles.balanceSubtext}>{balance.toFixed(4)} XLM</Text>

          {/* Wallet Actions */}
          <View style={styles.walletActions}>
            <TouchableOpacity style={styles.walletActionButton} onPress={copyAddress}>
              <Ionicons name="copy-outline" size={16} color="#9945FF" />
              <Text style={styles.walletActionText}>Copy Address</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.walletActionButton} onPress={fundWallet}>
              <Ionicons name="wallet-outline" size={16} color="#FF6B35" />
              <Text style={styles.walletActionText}>Fund Wallet</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onNavigate('receive')}
          >
            <LinearGradient
              colors={['rgba(153, 69, 255, 0.3)', 'rgba(153, 69, 255, 0.1)']}
              style={styles.actionIconContainer}
            >
              <Ionicons name="add" size={28} color="#fff" />
            </LinearGradient>
            <Text style={styles.actionLabel}>Add</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onNavigate('bluetooth')}
          >
            <LinearGradient
              colors={['rgba(153, 69, 255, 0.3)', 'rgba(153, 69, 255, 0.1)']}
              style={styles.actionIconContainer}
            >
              <Ionicons name="swap-horizontal" size={28} color="#fff" />
            </LinearGradient>
            <Text style={styles.actionLabel}>Transfer</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onNavigate('history')}
          >
            <LinearGradient
              colors={['rgba(153, 69, 255, 0.3)', 'rgba(153, 69, 255, 0.1)']}
              style={styles.actionIconContainer}
            >
              <Ionicons name="calendar-outline" size={28} color="#fff" />
            </LinearGradient>
            <Text style={styles.actionLabel}>History</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onNavigate('solust')}
          >
            <LinearGradient
              colors={['rgba(153, 69, 255, 0.3)', 'rgba(153, 69, 255, 0.1)']}
              style={styles.actionIconContainer}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={28} color="#fff" />
            </LinearGradient>
            <Text style={styles.actionLabel}>Solust</Text>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'tokens' && styles.activeTab]}
            onPress={() => setActiveTab('tokens')}
          >
            <Text style={[styles.tabText, activeTab === 'tokens' && styles.activeTabText]}>
              Tokens
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'collectibles' && styles.activeTab]}
            onPress={() => setActiveTab('collectibles')}
          >
            <Text style={[styles.tabText, activeTab === 'collectibles' && styles.activeTabText]}>
              Collectibles
            </Text>
          </TouchableOpacity>
        </View>

        {/* Token List */}
        {activeTab === 'tokens' && (
          <View style={styles.tokenList}>
            <View style={styles.tokenItem}>
              <View style={styles.tokenIcon}>
                <Text style={styles.tokenIconText}>⭐</Text>
              </View>
              <View style={styles.tokenInfo}>
                <Text style={styles.tokenName}>Stellar Lumens</Text>
                <Text style={styles.tokenAmount}>{balance.toFixed(2)} XLM</Text>
              </View>
              <View style={styles.tokenValue}>
                <Text style={styles.tokenPrice}>${(balance * 0.12).toFixed(2)}</Text>
                <Text style={styles.tokenChange}>+3.14%</Text>
              </View>
            </View>

            <View style={styles.tokenItem}>
              <View style={[styles.tokenIcon, { backgroundColor: '#2775CA' }]}>
                <Text style={styles.tokenIconText}>$</Text>
              </View>
              <View style={styles.tokenInfo}>
                <Text style={styles.tokenName}>USDC</Text>
                <Text style={styles.tokenAmount}>0.00 USDC</Text>
              </View>
              <View style={styles.tokenValue}>
                <Text style={styles.tokenPrice}>$0.00</Text>
                <Text style={[styles.tokenChange, { color: '#666' }]}>+0.00%</Text>
              </View>
            </View>
          </View>
        )}

        {activeTab === 'collectibles' && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No collectibles yet</Text>
          </View>
        )}
      </ScrollView>
    </LinearGradient>
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
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(153, 69, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  accountSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    gap: 8,
  },
  accountIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(153, 69, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  accountText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  balanceContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  balanceAmount: {
    color: '#fff',
    fontSize: 56,
    fontWeight: '700',
    letterSpacing: -2,
    marginBottom: 8,
  },
  balanceSubtext: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 20,
  },
  walletActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  walletActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(153, 69, 255, 0.15)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(153, 69, 255, 0.3)',
  },
  walletActionText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 40,
    marginBottom: 50,
    gap: 30,
  },
  actionButton: {
    alignItems: 'center',
    gap: 12,
  },
  actionIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(153, 69, 255, 0.3)',
  },
  actionLabel: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#fff',
  },
  tabText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 15,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#fff',
  },
  tokenList: {
    paddingHorizontal: 20,
    gap: 16,
  },
  tokenItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  tokenIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(153, 69, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  tokenIconText: {
    fontSize: 24,
  },
  tokenInfo: {
    flex: 1,
  },
  tokenName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  tokenAmount: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 13,
  },
  tokenValue: {
    alignItems: 'flex-end',
  },
  tokenPrice: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  tokenChange: {
    color: '#14F195',
    fontSize: 13,
    fontWeight: '500',
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyStateText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 15,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 40,
    marginTop: 40,
    gap: 60,
  },
  navButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeNavButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  toastContainer: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    zIndex: 100,
    alignItems: 'center',
  },
  toastContent: {
    backgroundColor: 'rgba(20, 241, 149, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#14F195',
  },
  toastText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
