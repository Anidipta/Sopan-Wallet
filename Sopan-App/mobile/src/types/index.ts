export interface Transaction {
  id: string;
  type: 'send' | 'receive' | 'deploy';
  amount: number;
  recipient: string;
  sender: string;
  timestamp: number;
  status: 'pending' | 'completed' | 'failed' | 'syncing';
  mode: 'offline' | 'online';
  signature?: string;
  txHash?: string;
  memo?: string;
  fee?: number;
  contractId?: string;
  isDeployment?: boolean;
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
  blockHash?: string; // Reference to the block it belongs to
  memo?: string;
}

export interface OfflineBlock {
  index: number;
  previousHash: string;
  timestamp: number;
  transactions: OfflineTransaction[];
  hash: string;
  nonce: number;
  difficulty: number;
  signatures: string[]; // Signatures from peer validators
  cumulativeWork: number; // Sum of work for this chain
}

export interface BluetoothDevice {
  id: string;
  name: string;
  publicKey?: string;
}
