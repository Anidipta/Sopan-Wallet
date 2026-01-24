# Changelog

All notable changes to Sopan Stellar will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2024-11-10

### Added - Initial Release 🎉

#### Core Features
- **Stellar Wallet Integration**
  - Ed25519 keypair generation
  - Secure key storage with Expo SecureStore
  - Deterministic wallet creation from seed
  - Real-time balance updates via Horizon API

- **Online Payments**
  - Send XLM to any Stellar address
  - QR code scanning for recipient addresses
  - Transaction confirmation in 3-5 seconds
  - Transaction history with status tracking

- **Offline Payments (Bluetooth)**
  - BLE device discovery and scanning
  - Native Android BLE advertising
  - Cryptographic transaction signing (Ed25519)
  - Offline transaction queue
  - Automatic sync when online

- **Custom Token Support (Sopan)**
  - Token creation on Stellar
  - Trustline management
  - Token minting and distribution
  - Multi-asset payments (XLM + Sopan)

- **Security Features**
  - Biometric authentication (fingerprint/face ID)
  - Encrypted private key storage
  - No cloud storage of sensitive data
  - Transaction signature verification

- **User Interface**
  - Animated gradient backgrounds
  - Dark theme optimized for mobile
  - Intuitive navigation
  - Real-time balance updates
  - Transaction history with filters
  - QR code generation and scanning

#### Technical Implementation
- React Native 0.81.5 with Expo SDK 54
- TypeScript 5.3.0 for type safety
- @stellar/stellar-sdk 13.0.0 for blockchain integration
- react-native-ble-plx 3.2.0 for Bluetooth
- Native Android modules (Kotlin) for BLE advertising
- Comprehensive error handling and recovery

#### Documentation
- Complete README with architecture diagrams
- Technical architecture documentation
- Sopan token creation guide
- Contributing guidelines
- Quick start guide for reviewers
- MIT License

#### Development Tools
- Expo development server
- EAS build system for APK generation
- TypeScript configuration
- Git workflow

### Security
- Ed25519 cryptographic signatures
- Expo SecureStore for key encryption
- Biometric authentication gates
- Trustline-based token acceptance
- No private key transmission over BLE

---

## [Unreleased]

### Planned for v1.1.0

#### Smart Contracts (Soroban)
- [ ] Payment escrow contract
- [ ] Token vesting contract
- [ ] Staking contract

#### Platform Support
- [ ] iOS version
- [ ] Web Bluetooth API support

#### Features
- [ ] Multi-signature support
- [ ] Multiple wallet management
- [ ] DEX integration (token swaps)
- [ ] Anchor integration (fiat on/off ramps)

### Planned for v2.0.0

#### Advanced Features
- [ ] Payment channels for recurring payments
- [ ] NFC support (tap-to-pay)
- [ ] Merchant dashboard
- [ ] Analytics and insights
- [ ] Multi-language support (i18n)

#### Infrastructure
- [ ] Cloud sync with encryption
- [ ] Push notification server
- [ ] Transaction indexing service
- [ ] Analytics backend

---

## Version History

### [1.0.0] - 2024-11-10
- Initial release for Scaffold Stellar Hackathon
- Complete offline-first payment system
- Stellar blockchain integration
- Custom Sopan token
- Bluetooth offline payments
- Comprehensive documentation

---

## Migration Guide

### From Solana to Stellar

This project was originally built on Solana and migrated to Stellar. Key changes:

#### Blockchain
- **Solana** → **Stellar**
- **SOL** → **XLM**
- **SPL Tokens** → **Stellar Assets**
- **Solana RPC** → **Horizon API**

#### SDK
- `@solana/web3.js` → `@stellar/stellar-sdk`
- Different transaction structure
- Different account model
- Different fee structure

#### Benefits of Stellar
- ✅ Faster confirmations (3-5s vs 30s)
- ✅ Lower fees ($0.0001 vs $0.001)
- ✅ Built-in DEX
- ✅ Anchor ecosystem
- ✅ Regulatory compliance focus

---

## Breaking Changes

None (initial release)

---

## Deprecations

None (initial release)

---

## Known Issues

### v1.0.0

1. **BLE Advertising Limitations**
   - Peripheral mode not fully implemented
   - Workaround: Pre-pair devices via Android settings
   - Fix planned for v1.1.0

2. **iOS Support**
   - Currently Android only
   - iOS version planned for v1.1.0

3. **Transaction History**
   - Limited to local storage
   - No cloud sync
   - Enhancement planned for v2.0.0

4. **Single Wallet**
   - Only one wallet per device
   - Multi-wallet support planned for v1.1.0

---

## Contributors

- **Initial Development**: [Your Name]
- **Stellar Migration**: [Your Name]
- **Documentation**: [Your Name]

---

## Acknowledgments

- Stellar Development Foundation
- The Aha Co (Scaffold Stellar)
- Expo Team
- React Native Community
- Open Source Contributors

---

## Links

- **Repository**: https://github.com/yourusername/Sopan-stellar
- **Issues**: https://github.com/yourusername/Sopan-stellar/issues
- **Releases**: https://github.com/yourusername/Sopan-stellar/releases
- **Telegram**: https://t.me/+82qRcx_v63UxN2Ux

---

**For detailed technical changes, see commit history on GitHub.**
