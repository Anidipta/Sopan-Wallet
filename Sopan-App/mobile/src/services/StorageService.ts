import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { Transaction, OfflineTransaction } from '../types';

export class StorageService {
  private WALLET_KEY = 'wallet_keypair';
  private OFFLINE_TX_KEY = 'offline_transactions';
  private USER_DATA_KEY = 'user_data';

  async saveWallet(publicKey: string, encryptedPrivateKey: string): Promise<void> {
    if (Platform.OS === 'web') {
      await AsyncStorage.setItem(this.WALLET_KEY, JSON.stringify({ publicKey, encryptedPrivateKey }));
      return;
    }
    await SecureStore.setItemAsync(
      this.WALLET_KEY,
      JSON.stringify({ publicKey, encryptedPrivateKey })
    );
  }

  async getWallet(): Promise<{ publicKey: string; encryptedPrivateKey: string } | null> {
    if (Platform.OS === 'web') {
      const data = await AsyncStorage.getItem(this.WALLET_KEY);
      return data ? JSON.parse(data) : null;
    }
    const data = await SecureStore.getItemAsync(this.WALLET_KEY);
    return data ? JSON.parse(data) : null;
  }

  async saveOfflineTransaction(transaction: OfflineTransaction): Promise<void> {
    const existing = await this.getOfflineTransactions();
    existing.push(transaction);
    await AsyncStorage.setItem(this.OFFLINE_TX_KEY, JSON.stringify(existing));
  }

  async getOfflineTransactions(): Promise<OfflineTransaction[]> {
    const data = await AsyncStorage.getItem(this.OFFLINE_TX_KEY);
    return data ? JSON.parse(data) : [];
  }

  async clearOfflineTransactions(): Promise<void> {
    await AsyncStorage.setItem(this.OFFLINE_TX_KEY, JSON.stringify([]));
  }

  async updateOfflineTransactionStatus(txId: string, status: 'synced' | 'failed'): Promise<void> {
    const transactions = await this.getOfflineTransactions();
    const updated = transactions.filter(tx => tx.id !== txId);
    await AsyncStorage.setItem(this.OFFLINE_TX_KEY, JSON.stringify(updated));
  }

  async getPendingTransactionCount(): Promise<number> {
    const transactions = await this.getOfflineTransactions();
    return transactions.length;
  }

  async saveUserData(email: string, phone?: string): Promise<void> {
    await AsyncStorage.setItem(this.USER_DATA_KEY, JSON.stringify({ email, phone }));
  }

  async getUserData(): Promise<{ email: string; phone?: string } | null> {
    const data = await AsyncStorage.getItem(this.USER_DATA_KEY);
    return data ? JSON.parse(data) : null;
  }

  private DEPLOYMENTS_KEY = 'deployments';

  async saveDeployment(deployment: any): Promise<void> {
    const existing = await this.getDeployments();
    // Check if exists and update
    const index = existing.findIndex((d: any) => d.id === deployment.id);
    if (index >= 0) {
      existing[index] = deployment;
    } else {
      existing.unshift(deployment);
    }
    await AsyncStorage.setItem(this.DEPLOYMENTS_KEY, JSON.stringify(existing));
  }

  async getDeployments(): Promise<any[]> {
    const data = await AsyncStorage.getItem(this.DEPLOYMENTS_KEY);
    return data ? JSON.parse(data) : [];
  }

  async clearAllData(): Promise<void> {
    // Clear wallet from secure storage
    await SecureStore.deleteItemAsync(this.WALLET_KEY);

    // Clear user data and transactions
    await AsyncStorage.multiRemove([
      this.USER_DATA_KEY,
      this.OFFLINE_TX_KEY,
      this.DEPLOYMENTS_KEY
    ]);

    console.log('✅ All user data cleared');
  }

  async setItem(key: string, value: string): Promise<void> {
    await AsyncStorage.setItem(key, value);
  }

  async getItem(key: string): Promise<string | null> {
    return await AsyncStorage.getItem(key);
  }
}
