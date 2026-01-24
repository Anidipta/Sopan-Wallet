import { StellarService } from './StellarService';
import { StorageService } from './StorageService';
import { NotificationService } from './NotificationService';

interface FailedTransaction {
  id: string;
  transaction: any;
  error: string;
  retryCount: number;
  lastAttempt: number;
}

export class ErrorRecoveryService {
  private static instance: ErrorRecoveryService;
  private maxRetries = 3;
  private retryDelay = 5000; // 5 seconds
  private failedTransactions: Map<string, FailedTransaction> = new Map();

  private constructor() {}

  static getInstance(): ErrorRecoveryService {
    if (!ErrorRecoveryService.instance) {
      ErrorRecoveryService.instance = new ErrorRecoveryService();
    }
    return ErrorRecoveryService.instance;
  }

  async handleTransactionError(
    transactionId: string,
    transaction: any,
    error: Error
  ): Promise<void> {
    console.log(`❌ Transaction ${transactionId} failed:`, error.message);

    const existing = this.failedTransactions.get(transactionId);
    const retryCount = existing ? existing.retryCount + 1 : 1;

    if (retryCount <= this.maxRetries) {
      // Store for retry
      this.failedTransactions.set(transactionId, {
        id: transactionId,
        transaction,
        error: error.message,
        retryCount,
        lastAttempt: Date.now(),
      });

      console.log(`🔄 Will retry transaction ${transactionId} (attempt ${retryCount}/${this.maxRetries})`);

      // Schedule retry
      setTimeout(() => {
        this.retryTransaction(transactionId);
      }, this.retryDelay * retryCount); // Exponential backoff
    } else {
      console.log(`⚠️ Transaction ${transactionId} failed after ${this.maxRetries} attempts`);
      this.failedTransactions.delete(transactionId);
      
      // Notify user
      const notifications = NotificationService.getInstance();
      await notifications.notifyTransactionConfirmed(transactionId); // Use as failure notification
    }
  }

  private async retryTransaction(transactionId: string): Promise<void> {
    const failed = this.failedTransactions.get(transactionId);
    if (!failed) return;

    try {
      console.log(`🔄 Retrying transaction ${transactionId}...`);

      const stellar = new StellarService('testnet');
      const storage = new StorageService();

      // Check if online
      const online = await stellar.isOnline();
      if (!online) {
        console.log('⚠️ Still offline, will retry later');
        setTimeout(() => this.retryTransaction(transactionId), this.retryDelay);
        return;
      }

      // Retry the transaction
      const wallet = await storage.getWallet();
      if (!wallet) {
        throw new Error('Wallet not found');
      }

      const hash = await stellar.sendTransaction(
        wallet.encryptedPrivateKey,
        failed.transaction.recipient,
        failed.transaction.amount
      );

      console.log(`✅ Transaction ${transactionId} succeeded on retry:`, signature);
      this.failedTransactions.delete(transactionId);

      // Notify success
      const notifications = NotificationService.getInstance();
      await notifications.notifyTransactionConfirmed(signature);
    } catch (error) {
      console.error(`❌ Retry failed for ${transactionId}:`, error);
      await this.handleTransactionError(transactionId, failed.transaction, error as Error);
    }
  }

  async retryAllFailed(): Promise<void> {
    console.log(`🔄 Retrying ${this.failedTransactions.size} failed transactions...`);
    
    for (const [id, _] of this.failedTransactions) {
      await this.retryTransaction(id);
    }
  }

  getFailedTransactions(): FailedTransaction[] {
    return Array.from(this.failedTransactions.values());
  }

  clearFailedTransaction(id: string): void {
    this.failedTransactions.delete(id);
  }

  clearAllFailed(): void {
    this.failedTransactions.clear();
  }

  // Handle network errors with user-friendly messages
  getUserFriendlyError(error: Error): string {
    const message = error.message.toLowerCase();

    if (message.includes('network') || message.includes('fetch')) {
      return 'Network connection issue. Please check your internet and try again.';
    }

    if (message.includes('insufficient') || message.includes('balance')) {
      return 'Insufficient balance. Please add more XLM to your wallet.';
    }

    if (message.includes('timeout')) {
      return 'Request timed out. The network might be congested. Please try again.';
    }

    if (message.includes('blockhash')) {
      return 'Transaction expired. Please try again.';
    }

    if (message.includes('signature')) {
      return 'Invalid signature. Please check your wallet and try again.';
    }

    if (message.includes('invalid') || message.includes('malformed')) {
      return 'Invalid transaction. Please check the recipient address and amount.';
    }

    // Default message
    return 'Transaction failed. Please try again or contact support.';
  }

  // Handle Bluetooth connection errors
  async handleBluetoothError(error: Error): Promise<string> {
    const message = error.message.toLowerCase();

    if (message.includes('permission')) {
      return 'Bluetooth permission denied. Please enable Bluetooth permissions in settings.';
    }

    if (message.includes('disabled') || message.includes('off')) {
      return 'Bluetooth is disabled. Please turn on Bluetooth and try again.';
    }

    if (message.includes('timeout') || message.includes('connection')) {
      return 'Connection timeout. Make sure the device is nearby and try again.';
    }

    if (message.includes('not found') || message.includes('no device')) {
      return 'No devices found. Make sure the recipient is advertising and nearby.';
    }

    return 'Bluetooth error. Please try again.';
  }

  // Recover from app crash or unexpected state
  async recoverAppState(): Promise<void> {
    try {
      console.log('🔄 Recovering app state...');

      const storage = new StorageService();
      const stellar = new StellarService('testnet');

      // Check for pending transactions
      const pendingTxs = await storage.getOfflineTransactions();
      
      if (pendingTxs.length > 0) {
        console.log(`Found ${pendingTxs.length} pending transactions`);

        // Check if online
        const online = await stellar.isOnline();
        
        if (online) {
          console.log('Online - attempting to sync pending transactions');
          // Sync will be handled by PaymentService
        } else {
          console.log('Offline - pending transactions will sync when online');
        }
      }

      console.log('✅ App state recovered');
    } catch (error) {
      console.error('Failed to recover app state:', error);
    }
  }
}
