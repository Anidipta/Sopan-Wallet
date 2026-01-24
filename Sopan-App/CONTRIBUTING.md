# Contributing to Sopan Wallet 🤝

Thank you for your interest in contributing to Sopan! This document provides guidelines for contributing to the project.

---

## Getting Started

1. **Fork the repository**
2. **Clone your fork**
   ```bash
   git clone 
   cd Sopan-Wallet
   ```
3. **Install dependencies**
   ```bash
   cd mobile
   npm install
   ```
4. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

---

## Development Workflow

### Running the App

```bash
cd mobile
npx expo start
```

### Building for Android

```bash
eas build --platform android --profile development
```

### Running Tests

```bash
npm test
```

---

## Code Style

### TypeScript

- Use TypeScript for all new code
- Follow existing code style
- Use meaningful variable names
- Add type annotations

### Formatting

- Use 2 spaces for indentation
- Use single quotes for strings
- Add semicolons
- Use trailing commas

### Example

```typescript
import { Keypair } from '@stellar/stellar-sdk';

export class StellarService {
  private server: Server;

  constructor(network: 'testnet' | 'mainnet') {
    this.server = new Server(
      network === 'testnet'
        ? 'https://horizon-testnet.stellar.org'
        : 'https://horizon.stellar.org'
    );
  }

  async createWallet(): Promise<{ publicKey: string; secretKey: string }> {
    const keypair = Keypair.random();
    return {
      publicKey: keypair.publicKey(),
      secretKey: keypair.secret(),
    };
  }
}
```

---

## Commit Messages

Use clear, descriptive commit messages:

### Format

```
<type>: <subject>

<body>

<footer>
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, etc.)
- **refactor**: Code refactoring
- **test**: Adding or updating tests
- **chore**: Maintenance tasks

### Examples

```
feat: add biometric authentication for payments

- Implement fingerprint/face ID support
- Add authentication prompt before transactions
- Update settings screen with biometric toggle

Closes #123
```

```
fix: resolve Bluetooth connection timeout

- Increase scan timeout to 15 seconds
- Add retry logic for failed connections
- Improve error messages

Fixes #456
```

---

## Pull Request Process

1. **Update documentation** if needed
2. **Add tests** for new features
3. **Ensure all tests pass**
4. **Update CHANGELOG.md**
5. **Create pull request** with clear description

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tested on Android
- [ ] Tested on iOS
- [ ] Added unit tests
- [ ] Added integration tests

## Screenshots
(if applicable)

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No new warnings
- [ ] Tests pass
```

---

## Areas for Contribution

### High Priority

- **iOS Support** - Port Android BLE modules to iOS
- **Smart Contracts** - Implement Soroban contracts
- **Testing** - Add unit and integration tests
- **Documentation** - Improve guides and tutorials

### Medium Priority

- **Multi-Wallet** - Support multiple wallets
- **Token Swaps** - DEX integration
- **Anchor Integration** - Fiat on/off ramps
- **Multi-Language** - i18n support

### Low Priority

- **UI Improvements** - Design enhancements
- **Performance** - Optimization
- **Analytics** - Usage tracking
- **Notifications** - Enhanced push notifications

---

## Bug Reports

### Before Submitting

1. Check existing issues
2. Test on latest version
3. Gather relevant information

### Bug Report Template

```markdown
## Description
Clear description of the bug

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. See error

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- Device: [e.g. Samsung Galaxy S21]
- OS: [e.g. Android 12]
- App Version: [e.g. 1.0.0]
- Network: [e.g. Testnet]

## Screenshots
(if applicable)

## Additional Context
Any other relevant information
```

---

## Feature Requests

### Feature Request Template

```markdown
## Problem
What problem does this solve?

## Proposed Solution
How should it work?

## Alternatives
Other solutions considered

## Additional Context
Any other relevant information
```

---

## Code Review

### What We Look For

- **Correctness** - Does it work as intended?
- **Security** - Are there security concerns?
- **Performance** - Is it efficient?
- **Maintainability** - Is it easy to understand?
- **Testing** - Are there adequate tests?
- **Documentation** - Is it well documented?

### Review Process

1. Automated checks run
2. Maintainer reviews code
3. Feedback provided
4. Changes requested (if needed)
5. Approval and merge

---

## Community Guidelines

### Be Respectful

- Be kind and courteous
- Respect different viewpoints
- Accept constructive criticism
- Focus on what's best for the project

### Be Collaborative

- Help others learn
- Share knowledge
- Provide constructive feedback
- Celebrate successes

### Be Professional

- Use inclusive language
- Stay on topic
- Avoid spam
- Follow code of conduct

---

## Questions?

- **GitHub Issues**: For bugs and features
- **Telegram**: [t.me/+82qRcx_v63UxN2Ux](https://t.me/+82qRcx_v63UxN2Ux)
- **Email**: your-email@example.com

---

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to Sopan Stellar! 🚀**
