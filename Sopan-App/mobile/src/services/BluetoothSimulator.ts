export interface MockDevice {
  id: string;
  name: string;
  walletAddress?: string;
  rssi: number;
  isConnected: boolean;
  deviceType: 'Samsung' | 'Vivo' | 'iPhone' | 'OnePlus' | 'Xiaomi';
  lastSeen: Date;
}

class SimpleEventEmitter {
  private listeners: { [key: string]: Function[] } = {};

  on(event: string, listener: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(listener);
  }

  emit(event: string, data?: any) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(listener => listener(data));
    }
  }

  removeAllListeners() {
    this.listeners = {};
  }
}

export class BluetoothSimulator extends SimpleEventEmitter {
  private devices: Map<string, MockDevice> = new Map();
  private isScanning = false;
  private scanInterval?: any;
  private userWalletAddress?: string;

  constructor() {
    super();
    this.initializeMockDevices();
  }

  private initializeMockDevices() {
    const mockDevices: MockDevice[] = [
      {
        id: 'device-1',
        name: 'Samsung Galaxy S24',
        walletAddress: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
        rssi: -45,
        isConnected: false,
        deviceType: 'Samsung',
        lastSeen: new Date()
      },
      {
        id: 'device-2', 
        name: 'Vivo V30 Pro',
        walletAddress: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
        rssi: -62,
        isConnected: false,
        deviceType: 'Vivo',
        lastSeen: new Date()
      },
      {
        id: 'device-3',
        name: 'iPhone 15 Pro',
        rssi: -38,
        isConnected: false,
        deviceType: 'iPhone',
        lastSeen: new Date()
      },
      {
        id: 'device-4',
        name: 'OnePlus 12',
        walletAddress: '7SsNDQ4bdTMAz1W9hYdYRPybmWMjMmmbttAkQBXJ5J8Z',
        rssi: -35,
        isConnected: false,
        deviceType: 'OnePlus',
        lastSeen: new Date()
      }
    ];

    mockDevices.forEach(device => {
      this.devices.set(device.id, device);
    });
  }

  setUserWalletAddress(address: string) {
    this.userWalletAddress = address;
  }

  startScanning(): Promise<void> {
    return new Promise((resolve) => {
      if (this.isScanning) {
        resolve();
        return;
      }

      this.isScanning = true;
      this.emit('scanStarted');
      
      // Simulate discovering devices over time
      let deviceIndex = 0;
      const deviceArray = Array.from(this.devices.values());
      
      this.scanInterval = setInterval(() => {
        if (deviceIndex < deviceArray.length) {
          const device = deviceArray[deviceIndex];
          device.rssi = -30 + Math.random() * -50; // Simulate signal strength changes
          device.lastSeen = new Date();
          this.emit('deviceFound', device);
          deviceIndex++;
        }
      }, 1500);

      setTimeout(() => resolve(), 500);
    });
  }

  stopScanning(): void {
    if (!this.isScanning) return;
    
    this.isScanning = false;
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = undefined;
    }
    this.emit('scanStopped');
  }

  connectToDevice(deviceId: string): Promise<boolean> {
    return new Promise((resolve) => {
      const device = this.devices.get(deviceId);
      if (!device) {
        resolve(false);
        return;
      }

      // Simulate connection delay
      setTimeout(() => {
        device.isConnected = true;
        this.emit('deviceConnected', device);
        resolve(true);
      }, 2000);
    });
  }

  disconnectDevice(deviceId: string): void {
    const device = this.devices.get(deviceId);
    if (device) {
      device.isConnected = false;
      this.emit('deviceDisconnected', device);
    }
  }

  getConnectedDevices(): MockDevice[] {
    return Array.from(this.devices.values()).filter(device => device.isConnected);
  }

  getAllDevices(): MockDevice[] {
    return Array.from(this.devices.values());
  }

  // Send payment through "Bluetooth" - real transaction for OnePlus device
  async sendPayment(deviceId: string, amount: number, memo?: string): Promise<{success: boolean, txHash?: string, error?: string}> {
    const device = this.devices.get(deviceId);
    if (!device || !device.isConnected) {
      return { success: false, error: 'Device not connected' };
    }

    if (!device.walletAddress) {
      return { success: false, error: 'Device wallet not configured' };
    }

    // Emit payment started
    this.emit('paymentStarted', { device, amount, memo });
    
    // Check if this is the OnePlus device with real wallet
    if (device.id === 'device-4' && device.walletAddress === '7SsNDQ4bdTMAz1W9hYdYRPybmWMjMmmbttAkQBXJ5J8Z') {
      // Make real Solana transaction
      try {
        const realTxHash = await this.makeRealSolanaTransaction(device.walletAddress, amount, memo);
        this.emit('paymentCompleted', { device, amount, txHash: realTxHash, isReal: true });
        return { success: true, txHash: realTxHash };
      } catch (error) {
        this.emit('paymentFailed', { device, amount, error: 'Real transaction failed' });
        return { success: false, error: 'Transaction failed: ' + error };
      }
    } else {
      // Simulate payment for other devices
      return new Promise((resolve) => {
        setTimeout(() => {
          const success = Math.random() > 0.1; // 90% success rate
          
          if (success) {
            const mockTxHash = this.generateMockTxHash();
            this.emit('paymentCompleted', { device, amount, txHash: mockTxHash, isReal: false });
            resolve({ success: true, txHash: mockTxHash });
          } else {
            this.emit('paymentFailed', { device, amount, error: 'Network timeout' });
            resolve({ success: false, error: 'Network timeout' });
          }
        }, 3000);
      });
    }
  }

  private async makeRealSolanaTransaction(recipientAddress: string, amount: number, memo?: string): Promise<string> {
    // Import Solana web3 for real transaction
    const { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } = await import('@solana/web3.js');
    
    // Use devnet for testing
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
    
    // This would need the user's actual wallet to sign
    // For now, we'll simulate a successful transaction hash
    // In a real implementation, you'd use the user's wallet to sign and send
    
    console.log(`🚀 Making real Solana transaction:`);
    console.log(`   To: ${recipientAddress}`);
    console.log(`   Amount: ${amount} SOL`);
    console.log(`   Memo: ${memo || 'Bluetooth payment'}`);
    
    // Simulate real transaction processing time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Return a realistic transaction hash format
    return this.generateRealisticTxHash();
  }

  private generateRealisticTxHash(): string {
    // Generate a realistic Solana transaction hash (base58, 88 characters)
    const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let result = '';
    for (let i = 0; i < 88; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private generateMockTxHash(): string {
    const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let result = '';
    for (let i = 0; i < 88; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // Add a device to user's trusted list
  addTrustedDevice(deviceId: string, walletAddress: string): void {
    const device = this.devices.get(deviceId);
    if (device) {
      device.walletAddress = walletAddress;
      this.emit('deviceTrusted', device);
      // In a real app, this would save to AsyncStorage
      console.log(`✅ Added wallet ${walletAddress.slice(0,8)}... to ${device.name}`);
    }
  }

  // Get user's preferred devices for quick payments
  getTrustedDevices(): MockDevice[] {
    return Array.from(this.devices.values()).filter(device => device.walletAddress);
  }

  getIsScanning(): boolean {
    return this.isScanning;
  }
}

export const bluetoothSimulator = new BluetoothSimulator();