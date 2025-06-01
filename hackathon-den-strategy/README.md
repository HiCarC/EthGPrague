1. vault deposit

node scripts/1_vault_deposit.js

node scripts/0_check_balance.js

node scripts/2_uniswap_pools.js

deployed contract: 0x697B590397c519c5ed1AbDBEa452F097Df9a9dc1

0x697B590397c519c5ed1AbDBEa452F097Df9a9dc1

# Deploy contract

forge script script/DeployBeraVault.s.sol \
 --rpc-url https://rpc.berachain.com \
 --broadcast \
 --gas-limit 8000000 \
 --gas-price 2000000000 \
 --legacy

# Verify contract

forge verify-contract 0x697B590397c519c5ed1AbDBEa452F097Df9a9dc1 BeraStrategyVault \
 --etherscan-api-key=FJKXD973DPS495TFXCPNKXZYH6U434F4TK \
 --watch \
 --constructor-args $(cast abi-encode "constructor(address,string,string,address)" "0x7507C1dC16935b82698E4C63f2746A5fCf994df8" "Bera Risk-Adjusted Yield Vault" "BRAYV" "0x504b635B7E22F8DF7d037cf31639811AE583E9f0") \
 --retries=2 \
 --verifier-url=https://api.berascan.com/api

# Diagnose contract

forge script script/DiagnoseVault.s.sol --rpc-url https://rpc.berachain.com

forge script script/CheckWBERABalance.s.sol --rpc-url https://rpc.berachain.com

forge script script/CheckAndAddNECT.s.sol --rpc-url https://rpc.berachain.com --broadcast

forge script script/CheckVaultStatus.s.sol --rpc-url https://rpc.berachain.com

forge script script/ActivateEmergencyMode.s.sol --rpc-url https://rpc.berachain.com --broadcast

forge script script/DepositWBERA.s.sol --rpc-url https://rpc.berachain.com --broadcast
