import { StellarService } from './StellarService';
import { BluetoothService } from './BluetoothService';
import { StorageService } from './StorageService';
import { NotificationService } from './NotificationService';
import { ErrorRecoveryService } from './ErrorRecoveryService';
import { OfflineTransaction } from '../types';
import { getPaymentAsset } from '../config/token';
import { v4 as uuidv4 } from 'uuid';

export class PaymentService {
  private stellar: StellarService;
  private bluetooth: BluetoothService | null = null;
  private storage: StorageService;
  private notifications: NotificationService;
  private errorRecovery: ErrorRecoveryService;
  private isOnline: boolean = true;

  constructor() {
    this.stellar = new StellarService('testnet');
    this.storage = new StorageService();
    this.notifications = NotificationService.getInstance();
    this.errorRecovery = ErrorRecoveryService.getInstance();
    this.checkConnectivity();
  }

  private getBluetoothService(): BluetoothService {
    if (!this.bluetooth) {
      this.bluetooth = new BluetoothService();
    }
    return this.bluetooth;
  }

  private async checkConnectivity(): Promise<void> {
    this.isOnline = await this.stellar.isOnline();
  }

  async sendPayment(
    recipientPublicKey: string,
    amount: number,
    secretKey: string
  ): Promise<{ success: boolean; txId?: string; error?: string }> {
    await this.checkConnectivity();

    if (this.isOnline) {
      return this.sendOnlinePayment(recipientPublicKey, amount, secretKey);
    } else {
      return this.sendOfflinePayment(recipientPublicKey, amount, secretKey);
    }
  }

  private async sendOnlinePayment(
    recipientPublicKey: string,
    amount: number,
    secretKey: string
  ): Promise<{ success: boolean; txId?: string; error?: string }> {
    const txId = uuidv4();
    
    try {
      // Get payment asset (SOPAN token or native XLM)
      const asset = getPaymentAsset();
      
      const hash = await this.stellar.sendTransaction(
        secretKey,
        recipientPublicKey,
        amount,
        undefined, // memo
        asset || undefined // custom token or undefined for XLM
      );

      // Wait for confirmation
      const confirmed = await this.stellar.confirmTransaction(hash);
      
      if (confirmed) {
        await this.notifications.notifyTransactionConfirmed(hash);
      }

      return { success: true, txId: hash };
    } catch (error) {
      console.error('Online payment failed:', error);
      
      // Handle error with recovery service
      await this.errorRecovery.handleTransactionError(
        txId,
        { recipient: recipientPublicKey, amount },
        error as Error
      );

      const friendlyError = this.errorRecovery.getUserFriendlyError(error as Error);
      return { success: false, error: friendlyError };
    }
  }

  private async sendOfflinePayment(
    recipientPublicKey: string,
    amount: number,
    secretKey: string
  ): Promise<{ success: boolean; txId?: string; error?: string }> {
    try {
      const wallet = await this.storage.getWallet();
      if (!wallet) throw new Error('Wallet not found');

      const transaction: Omit<OfflineTransaction, 'signature'> = {
        id: uuidv4(),
        sender: wallet.publicKey,
        recipient: recipientPublicKey,
        amount,
        timestamp: Date.now(),
        nonce: uuidv4()
      };

      const bluetooth = this.getBluetoothService();
      const signedTx = bluetooth.signTransaction(transaction, secretKey);
      await this.storage.saveOfflineTransaction(signedTx);

      return { success: true, txId: signedTx.id };
    } catch (error) {
      console.error('Offline payment failed:', error);
      return { success: false, error: String(error) };
    }
  }

  async syncOfflineTransactions(): Promise<number> {
    try {
      const offlineTxs = await this.storage.getOfflineTransactions();
      if (offlineTxs.length === 0) return 0;

      console.log(`🔄 Syncing ${offlineTxs.length} offline transactions...`);
      let synced = 0;

      const bluetooth = this.getBluetoothService();
      const wallet = await this.storage.getWallet();
      if (!wallet) throw new Error('Wallet not found');

      for (const tx of offlineTxs) {
        try {
          // Verify transaction signature
          if (!bluetooth.verifyTransaction(tx)) {
            console.error('❌ Invalid transaction signature:', tx.id);
            continue;
          }

          // Get payment asset
          const asset = getPaymentAsset();
          
          // Submit to Stellar blockchain
          const hash = await this.stellar.sendTransaction(
            wallet.encryptedPrivateKey,
            tx.recipient,
            tx.amount,
            undefined, // memo
            asset || undefined
          );

          console.log(`✅ Synced transaction ${tx.id}:`, hash);
          synced++;

          // Wait for confirmation
          await this.stellar.confirmTransaction(hash);
        } catch (error) {
          console.error(`❌ Failed to sync transaction ${tx.id}:`, error);
          
          // Handle with error recovery
          await this.errorRecovery.handleTransactionError(
            tx.id,
            tx,
            error as Error
          );
        }
      }

      if (synced > 0) {
        await this.storage.clearOfflineTransactions();
        await this.notifications.notifySyncComplete(synced);
        console.log(`✅ Synced ${synced}/${offlineTxs.length} transactions`);
      }

      return synced;
    } catch (error) {
      console.error('Sync failed:', error);
      return 0;
    }
  }

  // Auto-sync when coming online
  async startAutoSync(): Promise<void> {
    setInterval(async () => {
      await this.checkConnectivity();
      
      if (this.isOnline) {
        const synced = await this.syncOfflineTransactions();
        if (synced > 0) {
          console.log(`🔄 Auto-synced ${synced} transactions`);
        }
      }
    }, 30000); // Check every 30 seconds
  }
}
