# Tokenized Strategy on CDP Positions
Create a vault strategy on Beraborrow that automatically manages a CDP. Let users “set it and forget it” but optimize for sustainability, yield, risk, and usability.

## Qualification Requirements
- All submissions must have a description and a GitHub repository with a descriptive README.
- The implementation be as ERC4626 compliant as possible.
- The implementation needs to be technically and economically sound.
- The deployed smart contracts must make use of any of the available Beraborrow collaterals.
- The implementation must deploy $NECT debt into multiple productive uses and not just the LSP (It should complement but not anchor the strategy).

## Examples
- Making the collateral delta neutral while earning PoL rewards above interest rates.
- Debt yield optimization.
- Flash Loan looping.

## Links & Resources
https://beraborrow.gitbook.io/docs/managed-vaults
https://beraborrow.gitbook.io/docs/borrowing/understanding-collateral
https://beraborrow.gitbook.io/docs/borrowing/dens


### Foundry Documentation

https://book.getfoundry.sh/

### Usage

#### Build

```shell
$ forge build
```

#### Test

```shell
$ forge test
```

#### Format

```shell
$ forge fmt
```

#### Gas Snapshots

```shell
$ forge snapshot
```

#### Anvil

```shell
$ anvil
```

#### Deploy

```shell
$ forge script script/DeployLsp.s.sol:DeployLsp --rpc-url <your_rpc_url> --private-key <your_private_key>
```

#### Cast

```shell
$ cast <subcommand>
```

#### Help

```shell
$ forge --help
$ anvil --help
$ cast --help
```
