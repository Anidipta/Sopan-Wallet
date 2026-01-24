# Soroban Smart Contracts

This project contains Soroban smart contracts for the SOPAN Wallet ecosystem, powered by the Stellar blockchain.

## Project Structure

```text
.
├── contracts
│   └── payment-program      # Fee-collection payment contract
│       ├── src
│       │   ├── lib.rs       # Module declarations
│       │   ├── home.rs      # Main logic
│       │   └── test.rs      # Automated tests
│       └── Cargo.toml
├── Cargo.toml               # Workspace configuration
└── README.md
```

## Smart Contracts

### 💳 Payment Program (`payment-program`)

The Payment Program is a specialized contract designed to handle secure payments with an automated service fee mechanism.

#### Features
- **Automated Service Fees**: Deducts a fixed **0.01% fee** from every transaction processed through the contract.
- **On-Chain Fee Storage**: Collected fees are safely stored within the contract's balance.
- **Administrative Control**: Only the designated owner (admin) can withdraw the accumulated fees to their personal Stellar wallet.
- **Deterministic Fee Calculation**: Uses high-precision integer division to ensure consistent fee extraction.

#### Key Functions
| Function | Description | Access |
|----------|-------------|--------|
| `initialize(admin)` | Sets the contract owner/admin. Can only be called once. | Public |
| `pay(from, to, token, amount)` | Processes a payment from `from` to `to`, deducting the fee. | Authorized User |
| `withdraw_fees(token, to)` | Transfers all collected fees to the admin's address. | Admin Only |
| `get_admin()` | Returns the current admin address. | Public |

---

## Getting Started

### Prerequisites
- [Rust](https://www.rust-lang.org/)
- [Soroban CLI](https://soroban.stellar.org/docs/getting-started/setup#install-the-soroban-cli)

### Build
To build the specialized payment contract with optimizations:
```bash
cd contracts/payment-program
stellar contract build --optimize
```

### Test
To run the automated tests:
```bash
cd contracts/payment-program
cargo test
```

## Deployment
To deploy the contract to the Stellar Testnet:
```bash
stellar contract deploy \
  --wasm ../../target/wasm32v1-none/release/payment_program.wasm \
  --source-account alice \
  --network testnet \
  --alias payment_program
```
