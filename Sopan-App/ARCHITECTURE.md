# 🏗️ Sopan Stellar - Technical Architecture

## Overview

Sopan is an offline-first Stellar payment application built with React Native and Expo. It enables crypto payments via Bluetooth when internet is unavailable, with automatic synchronization to the Stellar blockchain when connectivity returns.

---

## Tech Stack

### Mobile App
- **React Native** 0.81.5 - Cross-platform mobile framework
- **Expo** SDK 54 - Development and build tooling
- **TypeScript** 5.3.0 - Type-safe JavaScript

### Blockchain
- **@stellar/stellar-sdk** 13.0.0 - Stellar blockchain integration
- **Stellar Horizon API** - Blockchain queries and transactions
- **Stellar Testnet** - Development network

### Cryptography
- **tweetnacl** 1.0.3 - Ed25519 signatures
- **@noble/hashes** - Cryptographic hashing

### Storage & Communication
- **expo-secure-store** - Encrypted key storage
- **@react-native-async-storage/async-storage** - App data
- **react-native-ble-plx** 3.2.0 - Bluetooth Low Energy

### UI/UX
- **expo-linear-gradient** - Gradient backgrounds
- **react-native-qrcode-svg** - QR code generation
- **expo-camera** - QR code scanning
- **expo-local-authentication** - Biometric authentication

---

## Architecture Layers

```
┌─────────────────────────────────────────┐
│        Presentation Layer               │
│   (Screens, Components, Navigation)     │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│       Business Logic Layer              │
│         (Services, State Mgmt)          │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│            Data Layer                   │
│  (Storage, Blockchain, Bluetooth)       │
└─────────────────────────────────────────┘
```

---

## Core Services

### 1. StellarService
**Purpose**: Stellar blockchain interaction

**Responsibilities**:
- Wallet creation (Ed25519 keypairs)
- Balance queries via Horizon API
- Transaction submission
- Transaction confirmation
- Real-time balance subscriptions
- Transaction history

**Key Methods**:
```typescript
createWallet(): Promise<{publicKey, secretKey}>
getBalance(publicKey): Promise<number>
sendTransaction(secretKey, recipient, amount, asset?): Promise<signature>
confirmTransaction(signature): Promise<boolean>
subscribeToBalance(publicKey, callback): UnsubscribeFn
getRecentTransactions(publicKey): Promise<Transaction[]>
createTrustline(secretKey, assetCode, issuer): Promise<void>
```

### 2. BluetoothService
**Purpose**: Offline P2P payments via BLE

**Responsibilities**:
- BLE device scanning
- Device advertising
- Transaction transmission
- Signature verification
- Acknowledgment handling

**Key Methods**:
```typescript
initialize(): Promise<void>
scanForSopanDevices(timeout): Promise<Device[]>
startAdvertising(walletAddress): Promise<void>
sendTransaction(device, signedTx): Promise<Result>
signTransaction(tx, secretKey): SignedTransaction
verifyTransaction(signedTx): boolean
```

### 3. PaymentService
**Purpose**: Unified payment handling

**Responsibilities**:
- Online/offline payment routing
- Transaction queuing
- Auto-sync management
- Error handling

**Key Methods**:
```typescript
sendPayment(recipient, amount, secretKey, asset?): Promise<Result>
syncOfflineTransactions(): Promise<number>
startAutoSync(): Promise<void>
isOnline(): Promise<boolean>
```

### 4. StorageService
**Purpose**: Data persistence

**Responsibilities**:
- Wallet storage (encrypted)
- Transaction history
- Offline transaction queue
- App settings

**Key Methods**:
```typescript
saveWallet(publicKey, secretKey): Promise<void>
getWallet(): Promise<Wallet>
saveOfflineTransaction(tx): Promise<void>
getOfflineTransactions(): Promise<Transaction[]>
setItem(key, value): Promise<void>
getItem(key): Promise<string>
```

---

## Data Flow

### Online Payment Flow

```
User Input (SendScreen)
    ↓
Biometric Authentication
    ↓
PaymentService.sendPayment()
    ↓
StellarService.sendTransaction()
    ↓
Stellar Horizon API
    ↓
Stellar Blockchain
    ↓
Transaction Confirmation
    ↓
Notification
    ↓
UI Update
```

### Offline Payment Flow

```
User Input (BluetoothPaymentScreen)
    ↓
Biometric Authentication
    ↓
BluetoothService.scanForDevices()
    ↓
Device Selection
    ↓
Transaction Signing (Ed25519)
    ↓
Bluetooth Transmission
    ↓
StorageService.saveOfflineTransaction()
    ↓
[Wait for Online]
    ↓
PaymentService.syncOfflineTransactions()
    ↓
Stellar Blockchain
    ↓
Notification
```

---

## Security Architecture

### Key Management

```
User Creates Wallet
    ↓
Generate Ed25519 Keypair
    ↓
Encode with Base58
    ↓
Store in SecureStore (encrypted)
    ↓
Never expose in UI
```

### Transaction Signing

```
Transaction Data
    ↓
Serialize Transaction
    ↓
Sign with Private Key (Ed25519)
    ↓
Attach Signature
    ↓
Verify Signature
    ↓
Submit to Blockchain
```

### Biometric Protection

```
Sensitive Operation
    ↓
Check Biometric Availability
    ↓
Prompt User
    ↓
Verify Identity
    ↓
Allow Operation
```

---

## Screen Architecture

### Production
```
Build Server → App Store/Play Store → User Device → Stellar Mainnet
```

---


```
mobile/
├── src/
│   ├── components/       # Reusable components
│   ├── services/         # Business logic
│   │   ├── StellarService.ts
│   │   ├── BluetoothService.ts
│   │   ├── PaymentService.ts
│   │   └── StorageService.ts
│   ├── types/           # TypeScript types
│   ├── config/          # Configuration
│   └── utils/           # Helper functions
├── android/             # Native Android modules
└── package.json         # Dependencies
```

---
## Design Patterns

1. **Singleton Pattern** - Services (single instance)
2. **Service Pattern** - Business logic separation
4. **Strategy Pattern** - Online/offline routing
5. **Factory Pattern** - Wallet creation

---
## Scalability Considerations

### Current Limitations
- Single wallet per device
- Limited transaction history (local)
- No cloud backup

### Future Enhancements
- Cloud sync with encryption
- Transaction indexing service
- Push notification server
- Analytics backend
---
    **This architecture supports a scalable, maintainable, and secure payment application on Stellar (SOPAN)! 🏗️**
**This architecture supports a scalable, maintainable, and secure payment application on Stellar! 🏗️**
