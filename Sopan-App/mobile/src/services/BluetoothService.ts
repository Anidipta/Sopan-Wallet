// Using real BLE and simulator fallback
import { BleManager, Device, State } from 'react-native-ble-plx';
import { Platform, PermissionsAndroid } from 'react-native';
import { EventEmitter } from 'events';
import { bluetoothSimulator, MockDevice } from './BluetoothSimulator';
import { OfflineTransaction } from '../types';
import * as StellarSdk from '@stellar/stellar-sdk';

interface BLETransaction {
  id: string;
  sender: string;
  recipient: string;
  amount: number;
  timestamp: number;
  signature: string;
}

export class BluetoothService extends EventEmitter {
  private bleManager: BleManager | null = null;
  private initialized: boolean = false;
  private onTransactionReceivedCallback?: (tx: BLETransaction) => void;
  private isScanningReal: boolean = false;
  private webChannel: any = null;
  private currentWalletAddress: string = '';

  constructor() {
    super();
    this.initialize();
  }

  private async initialize() {
    if (this.initialized) return;

    // Only initialize BleManager if on native
    if (Platform.OS !== 'web') {
      this.bleManager = new BleManager();
    }

    // Set up Web Broadcast Channel for P2P simulation
    if (Platform.OS === 'web' && typeof BroadcastChannel !== 'undefined') {
      this.webChannel = new BroadcastChannel('sopan_p2p_channel');
      this.webChannel.onmessage = (event: any) => {
        const { type, payload } = event.data;
        if (type === 'discovery_ping' && payload.address !== this.currentWalletAddress) {
          const deviceData = {
            id: `web-peer-${payload.address.slice(0, 8)}`,
            name: `SOPAN Web Peer (${payload.browser})`,
            walletAddress: payload.address,
            rssi: -20,
            isConnected: false,
            deviceType: 'iPhone',
            isReal: true,
            isWebPeer: true
          };
          this.emit('deviceFound', deviceData);

          // Respond to the ping
          this.webChannel.postMessage({
            type: 'discovery_pong',
            payload: {
              address: this.currentWalletAddress,
              name: this.getLocalName()
            }
          });
        } else if (type === 'discovery_pong' && payload.address !== this.currentWalletAddress) {
          this.emit('deviceFound', {
            id: `web-peer-${payload.address.slice(0, 8)}`,
            name: payload.name || `SOPAN Web Peer (${payload.browser})`,
            walletAddress: payload.address,
            rssi: -25,
            isConnected: false,
            deviceType: 'iPhone',
            isReal: true,
            isWebPeer: true
          });
        }
      };
    }

    // Set up simulator event listeners
    bluetoothSimulator.on('deviceFound', (device: any) => {
      this.emit('deviceFound', device);
    });

    bluetoothSimulator.on('deviceConnected', (device: any) => {
      this.emit('deviceConnected', device);
    });

    bluetoothSimulator.on('deviceDisconnected', (device: any) => {
      this.emit('deviceDisconnected', device);
    });

    bluetoothSimulator.on('paymentCompleted', (data: any) => {
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
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
      ]);
      return Object.values(granted).every(status => status === PermissionsAndroid.RESULTS.GRANTED);
    }
    return true;
  }

  async startScanning(): Promise<void> {
    // Start real BLE scanning if available
    if (this.bleManager) {
      try {
        const state = await this.bleManager.state();
        if (state !== State.PoweredOn) {
          console.warn('Bluetooth is not powered on');
        } else {
          this.isScanningReal = true;
          this.bleManager.startDeviceScan(null, null, (error, device) => {
            if (error) {
              console.error('BLE Scan Error:', error);
              this.isScanningReal = false;
              return;
            }
            if (device) {
              const deviceData = {
                id: device.id,
                name: device.name || 'Unknown Device',
                rssi: device.rssi,
                deviceType: 'Real Device',
                isConnected: false,
                isReal: true
              };
              this.emit('deviceFound', deviceData);
            }
          });
        }
      } catch (e) {
        console.error('Error getting BLE state:', e);
      }
    }

    // Start Web P2P Discovery
    if (this.webChannel) {
      this.webChannel.postMessage({
        type: 'discovery_ping',
        payload: {
          address: this.currentWalletAddress,
          name: this.getLocalName()
        }
      });
    }

    // Always start simulator for hybrid experience
    await bluetoothSimulator.startScanning();
    this.emit('scanStarted');
  }

  async stopScanning(): Promise<void> {
    if (this.bleManager) {
      this.bleManager.stopDeviceScan();
      this.isScanningReal = false;
    }
    bluetoothSimulator.stopScanning();
    this.emit('scanStopped');
  }

  addTrustedDevice(deviceId: string, walletAddress: string): void {
    bluetoothSimulator.addTrustedDevice(deviceId, walletAddress);
    this.emit('deviceUpdated', deviceId);
  }

  signTransaction(transaction: Omit<OfflineTransaction, 'signature'>, secretKey: string): OfflineTransaction {
    try {
      const keypair = StellarSdk.Keypair.fromSecret(secretKey);
      const dataToSign = JSON.stringify(transaction);
      const signature = keypair.sign(Buffer.from(dataToSign)).toString('base64');

      return {
        ...transaction,
        signature
      };
    } catch (error) {
      console.error('Signing failed:', error);
      throw error;
    }
  }

  verifyTransaction(transaction: OfflineTransaction): boolean {
    try {
      const { signature, ...data } = transaction;
      const keypair = StellarSdk.Keypair.fromPublicKey(transaction.sender);
      const dataToVerify = JSON.stringify(data);

      return keypair.verify(Buffer.from(dataToVerify), Buffer.from(signature, 'base64'));
    } catch (error) {
      console.error('Verification failed:', error);
      return false;
    }
  }

  async startAdvertising(walletAddress: string): Promise<void> {
    this.currentWalletAddress = walletAddress;
    bluetoothSimulator.setUserWalletAddress(walletAddress);

    if (this.webChannel) {
      this.webChannel.postMessage({
        type: 'discovery_ping',
        payload: { address: walletAddress, name: this.getLocalName() }
      });
    }

    console.log('Started Bluetooth advertising');
  }

  getLocalName(): string {
    if (Platform.OS === 'web') {
      const browser = navigator.userAgent.includes('Chrome') ? 'Chrome' :
        navigator.userAgent.includes('Firefox') ? 'Firefox' : 'Browser';
      return `SOPAN WEB PEER (${browser})`;
    }
    return Platform.OS === 'android' ? 'ANDROID SOPAN NODE' : 'IOS SOPAN NODE';
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

  getTrustedDevices(): MockDevice[] {
    return bluetoothSimulator.getTrustedDevices();
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

const bluetoothService = new BluetoothService();
export { bluetoothService };
export default BluetoothService;