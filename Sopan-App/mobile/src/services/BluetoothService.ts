// Using Bluetooth simulator for seamless demo experience
import { bluetoothSimulator, MockDevice } from './BluetoothSimulator';
import { OfflineTransaction } from '../types';

interface BLETransaction {
  id: string;
  sender: string;
  recipient: string;
  amount: number;
  timestamp: number;
  signature: string;
}

export class BluetoothService {
  private initialized: boolean = false;
  private onTransactionReceivedCallback?: (tx: BLETransaction) => void;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    if (this.initialized) return;
    
    // Set up simulator event listeners
    bluetoothSimulator.on('paymentCompleted', (data) => {
      if (this.onTransactionReceivedCallback) {
        const tx: BLETransaction = {
          id: data.txHash || Date.now().toString(),
          sender: 'current_user',
          recipient: data.device.walletAddress || data.device.id,
          amount: data.amount,
          timestamp: Date.now(),
          signature: data.txHash || 'mock_signature'
        };
        this.onTransactionReceivedCallback(tx);
      }
    });

    this.initialized = true;
  }

  async requestPermissions(): Promise<boolean> {
    // Simulate permission request
    return true;
  }

  async startScanning(): Promise<void> {
    await bluetoothSimulator.startScanning();
  }

  async stopScanning(): Promise<void> {
    bluetoothSimulator.stopScanning();
  }

  async startAdvertising(walletAddress: string): Promise<void> {
    bluetoothSimulator.setUserWalletAddress(walletAddress);
    // Simulate advertising
    console.log('Started Bluetooth advertising');
  }

  async stopAdvertising(): Promise<void> {
    // Simulate stopping advertising
    console.log('Stopped Bluetooth advertising');
  }

  async sendTransaction(deviceId: string, transaction: OfflineTransaction): Promise<boolean> {
    try {
      const result = await bluetoothSimulator.sendPayment(
        deviceId,
        transaction.amount,
        transaction.memo
      );
      return result.success;
    } catch (error) {
      console.error('Failed to send transaction:', error);
      return false;
    }
  }

  getConnectedDevices(): MockDevice[] {
    return bluetoothSimulator.getConnectedDevices();
  }

  getAllDevices(): MockDevice[] {
    return bluetoothSimulator.getAllDevices();
  }

  onTransactionReceived(callback: (tx: BLETransaction) => void): void {
    this.onTransactionReceivedCallback = callback;
  }

  isAdvertising(): boolean {
    return false; // Simplified for demo
  }

  async connectToDevice(deviceId: string): Promise<boolean> {
    return await bluetoothSimulator.connectToDevice(deviceId);
  }

  disconnectDevice(deviceId: string): void {
    bluetoothSimulator.disconnectDevice(deviceId);
  }
}

export default BluetoothService;