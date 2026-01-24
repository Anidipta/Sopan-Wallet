import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

const { BLEAdvertiser } = NativeModules;

class NativeBLEAdvertiserService {
  private eventEmitter: NativeEventEmitter | null = null;
  private listeners: { [key: string]: any } = {};

  constructor() {
    if (Platform.OS === 'android' && BLEAdvertiser) {
      this.eventEmitter = new NativeEventEmitter(BLEAdvertiser);
    }
  }

  /**
   * Check if native BLE advertising is available
   */
  isAvailable(): boolean {
    return Platform.OS === 'android' && BLEAdvertiser != null;
  }

  /**
  * Start advertising the device as a SOPAN receiver
   */
  async startAdvertising(walletAddress: string): Promise<boolean> {
    if (!this.isAvailable()) {
      throw new Error('Native BLE Advertiser not available. Make sure you rebuilt the app after adding native modules.');
    }

    try {
      // Use first 8 characters of wallet address as device identifier
      const deviceId = walletAddress.substring(0, 8);
      const result = await BLEAdvertiser.startAdvertising(deviceId);
      console.log('✅ Native BLE advertising started');
      return result;
    } catch (error) {
      console.error('❌ Failed to start native advertising:', error);
      throw error;
    }
  }

  /**
   * Stop advertising
   */
  async stopAdvertising(): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      const result = await BLEAdvertiser.stopAdvertising();
      console.log('✅ Native BLE advertising stopped');
      return result;
    } catch (error) {
      console.error('❌ Failed to stop native advertising:', error);
      throw error;
    }
  }

  /**
   * Check if currently advertising
   */
  async isAdvertising(): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      return await BLEAdvertiser.isAdvertising();
    } catch (error) {
      console.error('❌ Failed to check advertising status:', error);
      return false;
    }
  }

  /**
   * Listen to advertising events
   */
  onAdvertisingStarted(callback: () => void): () => void {
    if (!this.eventEmitter) {
      return () => {};
    }

    const listener = this.eventEmitter.addListener('onAdvertisingStarted', callback);
    this.listeners['onAdvertisingStarted'] = listener;

    return () => {
      listener.remove();
      delete this.listeners['onAdvertisingStarted'];
    };
  }

  /**
   * Listen to advertising failure events
   */
  onAdvertisingFailed(callback: (error: { error: string; errorCode: number }) => void): () => void {
    if (!this.eventEmitter) {
      return () => {};
    }

    const listener = this.eventEmitter.addListener('onAdvertisingFailed', callback);
    this.listeners['onAdvertisingFailed'] = listener;

    return () => {
      listener.remove();
      delete this.listeners['onAdvertisingFailed'];
    };
  }

  /**
   * Remove all listeners
   */
  removeAllListeners(): void {
    Object.values(this.listeners).forEach(listener => {
      if (listener && listener.remove) {
        listener.remove();
      }
    });
    this.listeners = {};
  }
}

export default new NativeBLEAdvertiserService();
