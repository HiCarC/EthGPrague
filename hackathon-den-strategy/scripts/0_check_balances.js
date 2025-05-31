require('dotenv').config();
const { ethers } = require('ethers');

class BalanceChecker {
    constructor() {
        // Load from environment
        this.rpcUrl = process.env.RPC_URL || 'https://bartio.rpc.berachain.com/';
        this.chainId = parseInt(process.env.CHAIN_ID) || 80084;
        
        // Load token addresses from .env file
        this.tokenAddresses = {
            WETH: process.env.WETH_ADDRESS,
            NECT: process.env.NECT_ADDRESS
        };
        
        // Initialize provider
        this.provider = new ethers.JsonRpcProvider(this.rpcUrl);
        
        console.log(`🔗 Connected to Berachain Bartio (Chain ID: ${this.chainId})`);
        console.log(`📡 RPC: ${this.rpcUrl}`);
        
        // Debug: Show loaded addresses
        console.log(`💎 WETH Address: ${this.tokenAddresses.WETH || 'Not configured'}`);
        console.log(`🍯 NECT Address: ${this.tokenAddresses.NECT || 'Not configured'}`);
    }

    /**
     * 🔗 Connect wallet
     */
    async connectWallet() {
        try {
            const privateKey = process.env.PRIVATE_KEY;
            if (!privateKey) {
                throw new Error('❌ PRIVATE_KEY not found in .env file');
            }
            
            this.signer = new ethers.Wallet(privateKey, this.provider);
            this.address = await this.signer.getAddress();
            
            console.log(`\n🔗 Connected wallet: ${this.address}`);
            return this.address;
        } catch (error) {
            console.error('❌ Failed to connect wallet:', error.message);
            throw error;
        }
    }

    /**
     * 💰 Check native BERA balance
     */
    async checkBeraBalance() {
        try {
            const balance = await this.provider.getBalance(this.address);
            const balanceFormatted = ethers.formatEther(balance);
            
            console.log(`🐻 BERA: ${balanceFormatted} BERA`);
            
            return {
                symbol: 'BERA',
                balance: balanceFormatted,
                balanceWei: balance,
                decimals: 18,
                isNative: true,
                hasBalance: parseFloat(balanceFormatted) > 0
            };
        } catch (error) {
            console.error('❌ Failed to check BERA balance:', error.message);
            return {
                symbol: 'BERA',
                balance: '0',
                balanceWei: 0n,
                decimals: 18,
                isNative: true,
                hasBalance: false,
                error: error.message
            };
        }
    }

    /**
     * 🪙 Check ERC20 token balance
     */
    async checkTokenBalance(tokenAddress, tokenSymbol) {
        try {
            // Check if address is configured
            if (!tokenAddress) {
                console.log(`⚠️  ${tokenSymbol}: Address not configured in .env`);
                return {
                    symbol: tokenSymbol,
                    balance: '0',
                    balanceWei: 0n,
                    decimals: 18,
                    address: null,
                    hasBalance: false,
                    error: 'Address not configured'
                };
            }

            const tokenABI = [
                "function balanceOf(address account) external view returns (uint256)",
                "function decimals() external view returns (uint8)",
                "function symbol() external view returns (string)"
            ];
            
            // Use address directly (ethers v6 is more lenient)
            const tokenContract = new ethers.Contract(
                tokenAddress,
                tokenABI,
                this.provider
            );
            
            const [balance, decimals, symbol] = await Promise.all([
                tokenContract.balanceOf(this.address),
                tokenContract.decimals().catch(() => 18),
                tokenContract.symbol().catch(() => tokenSymbol)
            ]);
            
            const balanceFormatted = ethers.formatUnits(balance, decimals);
            
            console.log(`💰 ${symbol}: ${balanceFormatted} ${symbol}`);
            
            return {
                symbol,
                balance: balanceFormatted,
                balanceWei: balance,
                decimals,
                address: tokenAddress,
                hasBalance: parseFloat(balanceFormatted) > 0
            };
        } catch (error) {
            console.error(`❌ Failed to check ${tokenSymbol}:`, error.message);
            return {
                symbol: tokenSymbol,
                balance: '0',
                balanceWei: 0n,
                decimals: 18,
                address: tokenAddress,
                hasBalance: false,
                error: error.message
            };
        }
    }

    /**
     * 🎯 Check WETH, NECT, and BERA balances
     */
    async checkMainBalances() {
        try {
            console.log('\n💰 CHECKING MAIN BALANCES: BERA, WETH, NECT');
            console.log('='.repeat(50));
            
            // Connect wallet
            await this.connectWallet();
            
            console.log(`\n💰 BALANCES:`);
            console.log('='.repeat(25));
            
            const balances = {};
            
            // Check BERA (native)
            balances.BERA = await this.checkBeraBalance();
            
            // Check WETH
            balances.WETH = await this.checkTokenBalance(this.tokenAddresses.WETH, 'WETH');
            
            // Check NECT
            balances.NECT = await this.checkTokenBalance(this.tokenAddresses.NECT, 'NECT');
            
            // Summary
            console.log(`\n📊 SUMMARY:`);
            console.log('='.repeat(25));
            
            const tokensWithBalance = Object.entries(balances)
                .filter(([symbol, data]) => data && data.hasBalance)
                .map(([symbol, data]) => ({ symbol, balance: data.balance }));
            
            if (tokensWithBalance.length > 0) {
                console.log(`✅ Your holdings:`);
                tokensWithBalance.forEach(token => {
                    const emoji = token.symbol === 'BERA' ? '🐻' : 
                                 token.symbol === 'WETH' ? '💎' : '🍯';
                    console.log(`   ${emoji} ${token.symbol}: ${token.balance}`);
                });
            } else {
                console.log(`⚠️  No token balances found`);
            }
            
            // Check if ready for Beraborrow
            const wethBalance = parseFloat(balances.WETH.balance);
            const nectBalance = parseFloat(balances.NECT.balance);
            const beraBalance = parseFloat(balances.BERA.balance);
            
            console.log(`\n🏦 BERABORROW READINESS:`);
            console.log('='.repeat(25));
            
            if (wethBalance > 0) {
                console.log(`✅ You have ${wethBalance} WETH for collateral`);
                console.log(`💡 You can mint ~${Math.floor(wethBalance * 2500 / 1.6)} NECT (160% ratio)`);
            } else {
                console.log(`❌ No WETH for collateral`);
                if (beraBalance > 0.01) {
                    console.log(`💡 You have ${beraBalance.toFixed(3)} BERA - consider wrapping to WETH`);
                } else {
                    console.log(`💡 You need WETH to use Beraborrow`);
                }
            }
            
            if (nectBalance > 0) {
                console.log(`✅ You have ${nectBalance} NECT`);
                console.log(`💡 Ready for swapping/yield farming`);
            } else {
                console.log(`ℹ️  No NECT tokens yet`);
            }
            
            console.log(`\n🎉 Balance check complete!`);
            console.log(`📱 Wallet: ${this.address}`);
            
            return balances;
            
        } catch (error) {
            console.error('❌ Balance check failed:', error.message);
            throw error;
        }
    }

    /**
     * 💡 Get balance suggestions
     */
    async getBalanceSuggestions() {
        try {
            const balances = await this.checkMainBalances();
            
            console.log(`\n💡 NEXT STEPS:`);
            console.log('='.repeat(25));
            
            const beraBalance = parseFloat(balances.BERA.balance);
            const wethBalance = parseFloat(balances.WETH.balance);
            const nectBalance = parseFloat(balances.NECT.balance);
            
            if (beraBalance > 0.01 && wethBalance === 0) {
                console.log(`🔄 1. Wrap some BERA → WETH for collateral`);
                console.log(`   💰 Available: ${beraBalance.toFixed(3)} BERA`);
                console.log(`   🎯 Suggested: Wrap 0.5 BERA → 0.5 WETH`);
            }
            
            if (wethBalance > 0.001 && nectBalance === 0) {
                console.log(`🏦 2. Use WETH as collateral to mint NECT`);
                console.log(`   💰 Available: ${wethBalance} WETH`);
                console.log(`   🍯 Can mint: ~${Math.floor(wethBalance * 2500 / 1.6)} NECT`);
            }
            
            if (nectBalance > 0) {
                console.log(`🔄 3. Swap NECT → BTC/other tokens`);
                console.log(`📈 4. Deploy to yield farming`);
            }
            
            if (beraBalance < 0.01) {
                console.log(`⛽ Get more BERA for gas fees from faucet`);
            }
            
            // Configuration check
            if (!this.tokenAddresses.WETH || !this.tokenAddresses.NECT) {
                console.log(`\n⚠️  CONFIGURATION NEEDED:`);
                if (!this.tokenAddresses.WETH) {
                    console.log(`   Add WETH_ADDRESS to .env file`);
                }
                if (!this.tokenAddresses.NECT) {
                    console.log(`   Add NECT_ADDRESS to .env file`);
                }
            }
            
        } catch (error) {
            console.error('❌ Suggestions failed:', error.message);
        }
    }
}

// 🚀 Main execution function
async function main() {
    const checker = new BalanceChecker();
    
    try {
        // Check if user wants suggestions too
        const args = process.argv.slice(2);
        const withSuggestions = args.includes('--suggestions') || args.includes('-s');
        
        if (withSuggestions) {
            await checker.getBalanceSuggestions();
        } else {
            await checker.checkMainBalances();
        }
        
    } catch (error) {
        console.error('❌ Execution failed:', error.message);
        process.exit(1);
    }
}

// Export for use in other scripts
module.exports = { BalanceChecker };

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
} 