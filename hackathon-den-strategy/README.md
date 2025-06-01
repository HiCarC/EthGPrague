1. vault deposit

node scripts/1_vault_deposit.js

node scripts/0_check_balance.js

node scripts/2_uniswap_pools.js

deployed contract: 0xe8F829fA5571Da7C6Fc59000F66ac72a2b38ccb0

forge verify-contract 0xe8F829fA5571Da7C6Fc59000F66ac72a2b38ccb0 BeraStrategyVault \
 --etherscan-api-key=FJKXD973DPS495TFXCPNKXZYH6U434F4TK \
 --watch \
 --constructor-args $(cast abi-encode "constructor(address,string,string,address)" "0x7507C1dC16935b82698E4C63f2746A5fCf994df8" "Bera Risk-Adjusted Yield Vault" "BRAYV" "0x504b635B7E22F8DF7d037cf31639811AE583E9f0") \
 --retries=2 \
 --verifier-url=https://api.berascan.com/api
