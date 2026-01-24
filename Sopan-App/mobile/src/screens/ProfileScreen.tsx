import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StorageService } from '../services/StorageService';
import { StellarService } from '../services/StellarService';
import SopanIcon from '../components/SopanIcon';
import { Image } from 'react-native';

export const ProfileScreen: React.FC<{ onBack: () => void; onLogout: () => void }> = ({ onBack, onLogout }) => {
  const [userData, setUserData] = useState<any>(null);
  const [wallet, setWallet] = useState<any>(null);
  const [bluetoothEnabled, setBluetoothEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  const storage = new StorageService();
  const stellar = new StellarService('testnet');

  useEffect(() => {
    loadUserData();
    loadPendingTransactions();
  }, []);

  const loadUserData = async () => {
    const user = await storage.getUserData();
    const walletData = await storage.getWallet();
    setUserData(user);
    setWallet(walletData);
  };

  const loadPendingTransactions = async () => {
    const count = await storage.getPendingTransactionCount();
    setPendingCount(count);
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: onLogout }
      ]
    );
  };

  const handleExportKeys = () => {
    Alert.alert(
      'Export Private Key',
      '⚠️ Never share your private key with anyone. Anyone with access to your private key can steal your funds.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'I Understand',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Private Key', wallet?.encryptedPrivateKey || 'Not available');
          }
        }
      ]
    );
  };

  const handleViewOnExplorer = () => {
    if (wallet?.publicKey) {
      Linking.openURL(`https://stellar.expert/explorer/testnet/account/${wallet.publicKey}`);
    }
  };

  const handleSupport = () => {
    Alert.alert('Support', 'Email: support@sopan.app\nTelegram: @sopanwallet');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.profileCard}>
          <View style={styles.logoContainer}>
            <Image source={SopanIcon} style={{ width: 32, height: 32, resizeMode: 'contain' }} />
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {userData?.email?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          <Text style={styles.userName}>{userData?.email || 'User'}</Text>
          <Text style={styles.userPhone}>{userData?.phone || 'No phone'}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Wallet Information</Text>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Public Address</Text>
            <Text style={styles.cardValue} numberOfLines={1}>
              {wallet?.publicKey || 'Loading...'}
            </Text>
          </View>

          <TouchableOpacity style={styles.actionCard} onPress={handleViewOnExplorer}>
            <Text style={styles.actionCardIcon}>🔍</Text>
            <View style={styles.actionCardContent}>
              <Text style={styles.actionCardTitle}>View on Explorer</Text>
              <Text style={styles.actionCardDescription}>See your wallet on Stellar Expert</Text>
            </View>
            <Text style={styles.actionCardArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={handleExportKeys}>
            <Text style={styles.actionCardIcon}>🔑</Text>
            <View style={styles.actionCardContent}>
              <Text style={styles.actionCardTitle}>Export Private Key</Text>
              <Text style={styles.actionCardDescription}>Backup your wallet (Keep secure!)</Text>
            </View>
            <Text style={styles.actionCardArrow}>→</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bluetooth Devices</Text>

          <TouchableOpacity style={styles.actionCard} onPress={() => Alert.alert('Bluetooth Devices', 'Manage your trusted Bluetooth devices for payments')}>
            <Text style={styles.actionCardIcon}>📱</Text>
            <View style={styles.actionCardContent}>
              <Text style={styles.actionCardTitle}>Manage Devices</Text>
              <Text style={styles.actionCardDescription}>Add wallet addresses to Bluetooth devices</Text>
            </View>
            <Text style={styles.actionCardArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => Alert.alert('Default Wallet', 'Set your default wallet address for Bluetooth payments')}>
            <Text style={styles.actionCardIcon}>💳</Text>
            <View style={styles.actionCardContent}>
              <Text style={styles.actionCardTitle}>Default Payment Wallet</Text>
              <Text style={styles.actionCardDescription}>Choose wallet for Bluetooth payments</Text>
            </View>
            <Text style={styles.actionCardArrow}>→</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>⚡ Bluetooth Payments</Text>
              <Text style={styles.settingDescription}>Enable offline payments</Text>
            </View>
            <Switch
              value={bluetoothEnabled}
              onValueChange={setBluetoothEnabled}
              trackColor={{ false: '#2A2A3A', true: '#14F195' }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>🔔 Notifications</Text>
              <Text style={styles.settingDescription}>Transaction alerts</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#2A2A3A', true: '#14F195' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Information</Text>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>App Version</Text>
              <Text style={styles.infoValue}>1.0.0</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Network</Text>
              <Text style={styles.infoValue}>Stellar Testnet</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Pending Transactions</Text>
              <Text style={[styles.infoValue, pendingCount > 0 && styles.infoValueWarning]}>
                {pendingCount}
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.actionCard} onPress={handleSupport}>
            <Text style={styles.actionCardIcon}>💬</Text>
            <View style={styles.actionCardContent}>
              <Text style={styles.actionCardTitle}>Support & Help</Text>
              <Text style={styles.actionCardDescription}>Get help or report issues</Text>
            </View>
            <Text style={styles.actionCardArrow}>→</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.aboutSection}>
          <View style={styles.aboutLogoContainer}>
            <Image source={SopanIcon} style={{ width: 60, height: 60, resizeMode: 'contain' }} />
          </View>
          <Text style={styles.aboutTitle}>SOPAN Wallet</Text>
          <Text style={styles.aboutText}>
            Build Anywhere. Pay Offline. Powered by Stellar blockchain.
          </Text>
          <Text style={styles.aboutCopyright}>© 2026 SOPAN. All rights reserved.</Text>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
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
    backgroundColor: 'rgba(153, 69, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
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
  profileCard: {
    alignItems: 'center',
    backgroundColor: '#1A1A24',
    borderRadius: 16,
    padding: 32,
    marginBottom: 24,
    position: 'relative',
  },
  logoContainer: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#9945FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  userName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userPhone: {
    color: '#888',
    fontSize: 14,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#888',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#1A1A24',
    borderRadius: 12,
    padding: 16,
  },
  cardLabel: {
    color: '#888',
    fontSize: 12,
    marginBottom: 8,
  },
  cardValue: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'monospace',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1A1A24',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingDescription: {
    color: '#888',
    fontSize: 12,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A24',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  actionCardIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  actionCardContent: {
    flex: 1,
  },
  actionCardTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  actionCardDescription: {
    color: '#888',
    fontSize: 12,
  },
  actionCardArrow: {
    color: '#14F195',
    fontSize: 20,
  },
  infoCard: {
    backgroundColor: '#1A1A24',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    color: '#888',
    fontSize: 14,
  },
  infoValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  infoValueWarning: {
    color: '#FFA500',
  },
  aboutSection: {
    alignItems: 'center',
    padding: 24,
    marginTop: 24,
  },
  aboutLogoContainer: {
    marginBottom: 16,
  },
  aboutTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  aboutText: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  aboutCopyright: {
    color: '#666',
    fontSize: 12,
  },
  logoutButton: {
    backgroundColor: '#FF6B9D',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 40,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
