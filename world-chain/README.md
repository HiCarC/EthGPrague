## Foundry

**Foundry is a blazing fast, portable and modular toolkit for Ethereum application development written in Rust.**

Foundry consists of:

- **Forge**: Ethereum testing framework (like Truffle, Hardhat and DappTools).
- **Cast**: Swiss army knife for interacting with EVM smart contracts, sending transactions and getting chain data.
- **Anvil**: Local Ethereum node, akin to Ganache, Hardhat Network.
- **Chisel**: Fast, utilitarian, and verbose solidity REPL.

## Documentation

https://book.getfoundry.sh/

## Usage

### Build

```shell
$ forge build
```

### Test

```shell
$ forge test
```

### Format

```shell
$ forge fmt
```

### Gas Snapshots

```shell
$ forge snapshot
```

### Anvil

```shell
$ anvil
```

### Deploy

```shell
$ forge script script/Counter.s.sol:CounterScript --rpc-url <your_rpc_url> --private-key <your_private_key>
```

### Cast

```shell
$ cast <subcommand>
```

### Help

```shell
$ forge --help
$ anvil --help
$ cast --help
```

tanguyvans@Tanguyvans world-chain % cast wallet new

Successfully created new keypair.
Address: 0xdFFa4C5b8F2de0BfE8A69e38f91583C1015760A2
Private key: 0x43adad0332cde0a9edc7b01a54be31b5ba8d4180d48f5222f41334618fc3b84a

forge verify-contract \
 --rpc-url https://worldchain-sepolia.g.alchemy.com/public \
 0xAAaE4eB3092E09B4BDc2F134C84bfF2bBBBc251B \
 src/HelloWorldChain.sol:HelloWorldChain \
 --verifier blockscout \
 --verifier-url https://worldchain-sepolia.explorer.alchemy.com/api/

// Core Smart Contracts Architecture:

1. **BookingPoolFactory.sol** - Factory contract to create booking pools
2. **BookingPool.sol** - Individual pool contract for each booking
3. **IWorldID.sol** - Interface for WorldID verification
4. **PoolManager.sol** - Main manager contract

// For Beraborrow integration (future): 5. **YieldStrategy.sol** - Integration with Beraborrow for yield
