import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Transaction, OfflineTransaction } from '../types';

export class StorageService {
  private WALLET_KEY = 'wallet_keypair';
  private OFFLINE_TX_KEY = 'offline_transactions';
  private USER_DATA_KEY = 'user_data';

  async saveWallet(publicKey: string, encryptedPrivateKey: string): Promise<void> {
    await SecureStore.setItemAsync(
      this.WALLET_KEY,
      JSON.stringify({ publicKey, encryptedPrivateKey })
    );
  }

  async getWallet(): Promise<{ publicKey: string; encryptedPrivateKey: string } | null> {
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

  async clearAllData(): Promise<void> {
    // Clear wallet from secure storage
    await SecureStore.deleteItemAsync(this.WALLET_KEY);
    
    // Clear user data and transactions
    await AsyncStorage.multiRemove([
      this.USER_DATA_KEY,
      this.OFFLINE_TX_KEY
    ]);
    
    console.log('✅ All user data cleared');
  }
}
