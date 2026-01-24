export interface Transaction {
  id: string;
  amount: number;
  recipient: string;
  timestamp: number;
  status: 'pending' | 'completed' | 'failed' | 'syncing';
  mode: 'offline' | 'online';
  signature?: string;
  txHash?: string;
}

export interface UserWallet {
  publicKey: string;
  encryptedPrivateKey: string;
}

export interface OfflineTransaction {
  id: string;
  sender: string;
  recipient: string;
  amount: number;
  timestamp: number;
  signature: string;
  nonce: string;
}

export interface BluetoothDevice {
  id: string;
  name: string;
  publicKey?: string;
}
