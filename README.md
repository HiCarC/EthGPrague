# EthGPrague $tayRich - Yield-Generating Group Booking Mini-App

Everyday DeFi

When day did you realized you were leaving yield on the table when booking your well deserved vacations? The worst, same on the same side, service providers are well getting paid in average 2 months after the service provided.
However, anticipating is both good for the tranquility of both.
To sum up:

- Service providers often wait up to two months for payments
- Centralized entities capture yield from anticipated payments
- Customers lose potential yield on their advance payments
- Web2 users face complexity in participating in Web3 solutions
- No incentive for early payments in group bookings, mostly for the one nice human that paid everything and finishes up never seeing the money back.

## Overview

$tayRich is a Worldcoin mini-app, human-only booking mini-app that restores capital efficiency to customers by redistributing yield from anticipated payments up to the booking date. Bookers receive their fair share of low-risk, risk-adjusted yield—previously captured by centralized entities.

### Solution

- Immediate yield generation from day one of booking
- Fair distribution of yield to all participants
- ZK-proof of sufficient funds for Web2 users
- Incentivized early payments
- Guaranteed on-time payments for service providers

## Implementation

### Core

- Beraborrow CDP positions for yield generation
- NECT stablecoin for risk-adjusted returns
- Revolut web proofs for Web2 user verification

### Key Features

1. **Early Yield Generation**: Pool starts generating yield from day one, even with a single member payment
2. **Risk-Adjusted Returns**: Utilizes Beraborrow CDP positions and NECT stablecoin
3. **Web2 Integration**: Revolut web proofs for non-Web3 users
4. **Human Verification**: Worldcoin-powered human-only system

## Yield generator CDP positions tokenized strategy

#### Risk-Adjusted Yield Score Computation

### 1. Horizon Scaling

To compute the **adjusted APR** for a given investment horizon
We have figure out that we had a rare information; the T date. We have levaraged the fact that we know when the withdraw will be done, so we can find the best option on the risk ajusted on the Liquid Stability Pool, using it as the default benchmark.

$$
\Delta = T - t_{now}
$$

$$
APR_{\Delta} = (1 + \mu)^{(\Delta/365d)} - 1
$$

### 2. Downside volatility (sortino numerator)

Scales volatility for the investment horizon:

$$
\sigma_{\Delta}^- = \sigma^{(\Delta/365d)}
$$

### 3. Expected loss from emergency

We have estimated the expected loss from liquidation risk using a log-normal approximation inspired by the **Black-Scholes-Merton model**. For having the **probability of breaching the liquidation threshold before a keeper can act**, based on the volatility over the investment period.

**Liquidation Probability:**

$$
p_{\text{liq}} = \Phi\left( \frac{\ln(1 - \frac{\text{CR} - \text{CR}_{\text{liq}}}{\text{CR}}) + \frac{1}{2} \sigma^2 \cdot \frac{\Delta}{365}}{\sigma \cdot \sqrt{\frac{\Delta}{365}}} \right)
$$

Where:

- **Φ(·)** is the standard normal cumulative distribution function (CDF)
- **CR** = current collateral ratio
- **CR liq** = liquidation threshold
- **σ** = annualized volatility of the collateral asset
- **Δ** = time horizon in days

### Expected liquidation loss

Once **p<sub>liq</sub>** is estimated, we compute the expected liquidation loss:

$$
L_{liq} = p_{liq} \times 0.4
$$

Where **0.4** is in this example, the assumed haircut in case of emergency liquidation due to slippage, keeper delay, or adverse price execution.

### 4. Correlation Haircut

Penalizes vaults that move closely with the baseline (lack of diversification):

$$
H_{\rho} = 1 - |\rho|
$$

### 5. Final Risk-Adjusted Yield Score

$$
S = \frac{(\mu_{\Delta} - \mu_{\Delta,SPL} - L_{liq})}{\sigma^-_{\Delta}} \times (1 - |\rho|)
$$

A higher score indicates a more favorable risk-adjusted yield.

# Beraborow contract:

```
0x697B590397c519c5ed1AbDBEa452F097Df9a9dc1
```

## Team

- Hemang Vora
- Tanguy Vansnick
- Carles Cerqueda

## Future Plans

- Expand to more service providers
- Enhance yield optimization strategies
- Improve Web2 user onboarding experience
- Add more payment verification methods

## License

This project is open source and available under the MIT License.

###With love, made in Prague
