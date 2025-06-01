# Revolut WebProof - Balance Verification System

This project implements a zero-knowledge proof system using vlayer to verify that a user has more than a specified amount of money in their Revolut account without revealing the exact balance.

## 🎯 Overview

The system allows users to prove they have at least 40 EUR in their Revolut account by:

1. **Generating a TLSN (Transport Layer Security Notarization) proof** of their Revolut wallet API response
2. **Parsing the EUR balance** from the response using smart contracts
3. **Verifying the proof on-chain** and minting an NFT badge if the balance requirement is met

## 🏗️ Architecture

- **WebProofProver.sol**: Smart contract that validates TLSN proofs and parses Revolut API responses
- **WebProofVerifier.sol**: Contract that handles proof verification and NFT minting
- **prove.ts**: TypeScript script that orchestrates proof generation and verification
- **Frontend**: React application for user interaction

### Key Components

- **API Endpoint**: `https://app.revolut.com/api/retail/user/current/wallet`
- **Minimum Balance**: 40 EUR (4000 cents)
- **Proof Type**: TLSN (Transport Layer Security Notarization)
- **Verification**: On-chain using vlayer infrastructure

## 🚨 Issues Encountered

### Issue #1: vlayer API Token Environment Confusion

**Problem**: When providing a `vlayer_API_TOKEN` environment variable, the system incorrectly routes to testnet even when explicitly selecting the dev environment.

**Details**:

- Setting `VLAYER_ENV=dev` in scripts should use the development environment
- However, the presence of `vlayer_API_TOKEN` overrides this setting
- This causes proofs to be generated against testnet infrastructure instead of dev
- Results in deployment and verification failures on the wrong network

**Impact**:

- Development workflow is disrupted
- Unable to test locally with dev environment
- Confusion between different vlayer environments

### Issue #2: Multiple TLSN Proof Generation Issues

**Problem**: Several issues encountered during TLSN (Transport Layer Security Notarization) proof generation process.

**Specific Issues**:

- **Network connectivity problems** with TLSN notary servers
- **Timeout issues** during proof generation
- **Invalid notary public key errors** in some test cases
- **Inconsistent proof generation** across different environments
- **WebSocket connection failures** to notary infrastructure

**Impact**:

- Unreliable proof generation
- Failed user verification attempts
- Difficulty in testing and development
- Poor user experience during balance verification

## 🛠️ Technical Stack

- **Smart Contracts**: Solidity with Foundry
- **Proof Generation**: vlayer SDK with TLSN
- **Frontend**: React + TypeScript + Vite
- **Styling**: TailwindCSS + DaisyUI
- **Testing**: Playwright + Vitest

## 📁 Project Structure

```
revolut-proof/
├── src/vlayer/
│   ├── WebProofProver.sol    # Main proof validation logic
│   └── WebProofVerifier.sol  # NFT minting and verification
├── vlayer/
│   ├── prove.ts             # Proof generation script
│   ├── deploy.ts            # Contract deployment
│   └── src/                 # Frontend application
├── test/                    # Test files
└── testdata/               # Sample proof data
```

## 🚀 Usage

### Development Environment

```bash
# Install dependencies
cd vlayer && bun install

# Deploy contracts (dev environment)
bun run deploy:dev

# Generate and verify proof (dev environment)
bun run prove:dev

# Run frontend
bun run web:dev
```

### Testnet Environment

```bash
# Deploy to testnet
bun run deploy:testnet

# Generate proof on testnet
bun run prove:testnet

# Run frontend with testnet
bun run web:testnet
```

## 🔧 Environment Variables

```env
# vlayer configuration
VLAYER_ENV=dev|testnet|mainnet
VLAYER_API_TOKEN=your_token_here  # ⚠️ Causes routing issues

# Private key for deployments
EXAMPLES_TEST_PRIVATE_KEY=your_private_key
```

## 🧪 Testing

```bash
# Run unit tests
bun run test:unit

# Run web tests (dev environment)
bun run test-web:dev
```

## 🎯 Future Improvements

1. **Fix vlayer API token environment routing** - Ensure dev environment selection works correctly
2. **Improve TLSN reliability** - Implement retry logic and better error handling
3. **Add more currency support** - Support other currencies beyond EUR
4. **Enhanced UI/UX** - Better error messages and loading states
5. **Gas optimization** - Optimize smart contract gas usage

## 📝 Notes

- The system currently focuses on EUR balances but can be extended for other currencies
- TLSN proof generation requires stable internet connection and may take several minutes
- The minimum balance threshold (40 EUR) is configurable in the smart contract
- All proofs are verified on-chain for maximum security and transparency
