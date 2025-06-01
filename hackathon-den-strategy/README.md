# Bera Risk-Adjusted Yield Vault

## Basic Operations

node scripts/1_vault_deposit.js

node scripts/0_check_balance.js

node scripts/2_uniswap_pools.js

## Pool Selection Logic

# 1. Discover and list Berachain pools with target tokens (BTC, ETH, AAVE, BERA, HONEY, USDC, NECT)

node scripts/list_bera_pools.js

# 2. Find best pools on Arbitrum Uniswap V3 (for comparison/benchmarking)

node scripts/2_api_best_pools.js

# 3. Calculate risk-adjusted yield scores for optimal pool selection

node scripts/4_risk_adjusted_yield.js

# 4. ETH volatility prediction for risk assessment

node scripts/3_eth_volatility_predictor.js

deployed contract: 0x697B590397c519c5ed1AbDBEa452F097Df9a9dc1

Contract deployed and verified on mainnet: 0x697B590397c519c5ed1AbDBEa452F097Df9a9dc1
Note: LSP doesn't work but can put tokens on pools

## Pool Selection Strategy

The vault uses a sophisticated risk-adjusted yield calculation to select optimal pools:

1. **Pool Discovery**: `list_bera_pools.js` discovers available pools on Berachain across multiple DEXs (BEX, Uniswap V3, etc.) for target tokens
2. **Risk Assessment**: `4_risk_adjusted_yield.js` calculates risk-adjusted scores using:
   - Horizon-scaled APR for investment timeframe
   - Downside volatility (Sortino ratio approach)
   - Expected liquidation losses
   - Correlation haircuts
3. **Volatility Prediction**: `3_eth_volatility_predictor.js` provides volatility forecasts for better risk assessment
4. **Benchmarking**: `2_api_best_pools.js` compares against Arbitrum pools for validation

The risk-adjusted score formula: `S = ((APR_Δ - APR_ΔSPL - L_liq) / σ_Δ-) × H_ρ`

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
