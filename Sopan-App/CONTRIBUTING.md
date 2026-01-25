# Contributing to Sopan Wallet 🚀

First off, thanks for taking the time to contribute! 🎉 
Sopan Wallet is an offline-first Stellar payment application built with React Native. We value your input and help in making this project better.

## 🤝 Project Structure

- **Mobile App**: React Native (Expo) app located in `/mobile`.
- **Smart Contracts**: Stellar Soroban contracts (Rust) in `/smart_contract`.
- **Server**: Backend services in `/server` (if applicable).

## 🛠️ Getting Started

### Prerequisites

1.  **Node.js** (v18+) & **npm**
2.  **Rust** (for smart contracts): `rustup target add wa32-unknown-unknown`
3.  **Soroban CLI**: `cargo install --locked soroban-cli`
4.  **Expo CLI**: `npm install -g eas-cli`

### Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/Anidipta/Sopan-Wallet.git
    cd Sopan-Wallet
    ```

2.  **Install dependencies (Mobile)**:
    ```bash
    cd mobile
    npm install
    ```

3.  **Run the App**:
    ```bash
    npx expo start
    ```

## 🐛 Reporting Bugs

Found a bug? Please verify it hasn't been reported yet. Open a new issue with:
- 🏷️ **Title**: Clear description of the issue.
- 📝 **Steps to Reproduce**: Detailed steps to recreate the bug.
- 📱 **Environment**: Device model, OS version, app version.

## 💡 Submitting Pull Requests

1.  **Fork the repo** and create your branch from `main`.
2.  If you've added code that should be tested, add tests.
3.  Ensure your code lints and builds.
4.  Format your commit messages clearly (e.g., `feat: add bluetooth scanning`, `fix: crash on login`).
5.  Submit that PR! 🚀

## 🎨 Code Style

- We use **TypeScript** for the mobile app.
- Follow existing patterns for Service classes (Singleton pattern).
- Use **functional components** with Hooks for UI.
- **Rust** code should follow standard Rust formatting (`cargo fmt`).

## 📜 License

By contributing, you agree that your contributions will be licensed under the MIT License of the project.

---
Happy Coding! 💻✨
