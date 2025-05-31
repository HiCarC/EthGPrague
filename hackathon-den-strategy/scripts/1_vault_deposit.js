require('dotenv').config();
const { ethers } = require('ethers');

class BerabarrowVaultManager {
    constructor() {
        // Load from environment
        this.rpcUrl = process.env.RPC_URL || 'https://bartio.rpc.berachain.com/';
        this.chainId = parseInt(process.env.CHAIN_ID) || 80084;
        
        // Contract addresses
        this.contracts = {
            ethCollateralVault: process.env.ETH_COLLATERAL_CONTRACT,
            weth: process.env.WETH_ADDRESS,
            nect: process.env.NECT_ADDRESS
        };
        
        // ABI directly in code
        this.vaultABI = [
            "function deposit(uint256 assets, address receiver) external returns (uint256 shares)",
            "function withdraw(uint256 assets, address receiver, address owner) external returns (uint256 shares)",
            "function redeem(uint256 shares, address receiver, address owner) external returns (uint256 assets)",
            "function balanceOf(address account) external view returns (uint256)",
            "function totalAssets() external view returns (uint256)",
            "function totalSupply() external view returns (uint256)",
            "function convertToAssets(uint256 shares) external view returns (uint256)",
            "function convertToShares(uint256 assets) external view returns (uint256)",
            "function previewDeposit(uint256 assets) external view returns (uint256)",
            "function previewWithdraw(uint256 assets) external view returns (uint256)",
            "function asset() external view returns (address)"
        ];
        
        // Initialize provider (ethers v6 syntax)
        this.provider = new ethers.JsonRpcProvider(this.rpcUrl);
        
        console.log(`🏦 Vault Contract: ${this.contracts.ethCollateralVault}`);
        console.log(`💰 WETH Token: ${this.contracts.weth}`);
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
            
            console.log(`🔗 Connected wallet: ${this.address}`);
            
            // Check BERA balance
            const beraBalance = await this.provider.getBalance(this.address);
            console.log(`💰 BERA Balance: ${ethers.formatEther(beraBalance)} BERA`);
            
            return this.address;
        } catch (error) {
            console.error('❌ Failed to connect wallet:', error.message);
            throw error;
        }
    }

    /**
     * 💰 Check WETH balance
     */
    async checkWETHBalance() {
        try {
            const wethABI = [
                "function balanceOf(address account) external view returns (uint256)",
                "function allowance(address owner, address spender) external view returns (uint256)"
            ];
            
            const wethContract = new ethers.Contract(
                this.contracts.weth,
                wethABI,
                this.provider
            );
            
            const balance = await wethContract.balanceOf(this.address);
            const allowance = await wethContract.allowance(this.address, this.contracts.ethCollateralVault);
            
            console.log(`💎 WETH Balance: ${ethers.formatEther(balance)} WETH`);
            console.log(`✅ WETH Allowance: ${ethers.formatEther(allowance)} WETH`);
            
            return {
                balance: ethers.formatEther(balance),
                allowance: ethers.formatEther(allowance),
                balanceWei: balance,
                allowanceWei: allowance
            };
        } catch (error) {
            console.error('❌ Failed to check WETH balance:', error.message);
            return null;
        }
    }

    /**
     * ✅ Approve WETH spending
     */
    async approveWETH(amount) {
        try {
            console.log(`✅ Approving ${amount} WETH for vault...`);
            
            const wethABI = [
                "function approve(address spender, uint256 amount) external returns (bool)"
            ];
            
            const wethContract = new ethers.Contract(
                this.contracts.weth,
                wethABI,
                this.signer
            );
            
            const amountWei = ethers.parseEther(amount.toString());
            
            const tx = await wethContract.approve(this.contracts.ethCollateralVault, amountWei);
            console.log(`🚀 Approval transaction sent: ${tx.hash}`);
            
            const receipt = await tx.wait();
            console.log(`✅ WETH approved successfully!`);
            
            return tx.hash;
        } catch (error) {
            console.error('❌ Failed to approve WETH:', error.message);
            throw error;
        }
    }

    /**
     * 🏦 Deposit WETH into vault and receive shares
     */
    async depositWETH(amount) {
        try {
            console.log(`🏦 Depositing ${amount} WETH into vault...`);
            
            const vaultContract = new ethers.Contract(
                this.contracts.ethCollateralVault,
                this.vaultABI,
                this.signer
            );
            
            const amountWei = ethers.parseEther(amount.toString());
            
            // Preview how many shares we'll get
            const previewShares = await vaultContract.previewDeposit(amountWei);
            console.log(`📊 Expected shares: ${ethers.formatEther(previewShares)}`);
            
            // Execute deposit
            const tx = await vaultContract.deposit(amountWei, this.address);
            console.log(`🚀 Deposit transaction sent: ${tx.hash}`);
            
            const receipt = await tx.wait();
            console.log(`✅ WETH deposited successfully!`);
            console.log(`📄 Transaction confirmed in block: ${receipt.blockNumber}`);
            
            // Check final balances
            await this.checkVaultPosition();
            
            return {
                txHash: tx.hash,
                blockNumber: receipt.blockNumber,
                amountDeposited: amount,
                expectedShares: ethers.formatEther(previewShares)
            };
            
        } catch (error) {
            console.error('❌ Failed to deposit WETH:', error.message);
            throw error;
        }
    }

    /**
     * 📊 Check vault position and balances
     */
    async checkVaultPosition() {
        try {
            console.log(`📊 Checking vault position...`);
            
            const vaultContract = new ethers.Contract(
                this.contracts.ethCollateralVault,
                this.vaultABI,
                this.provider
            );
            
            // Get vault shares balance
            const shares = await vaultContract.balanceOf(this.address);
            const totalAssets = await vaultContract.totalAssets();
            const totalSupply = await vaultContract.totalSupply();
            
            // Convert shares to assets
            const assetsFromShares = await vaultContract.convertToAssets(shares);
            
            console.log(`🏆 Your vault shares: ${ethers.formatEther(shares)}`);
            console.log(`💎 Your assets value: ${ethers.formatEther(assetsFromShares)} WETH`);
            console.log(`📈 Total vault assets: ${ethers.formatEther(totalAssets)} WETH`);
            console.log(`🔄 Total vault supply: ${ethers.formatEther(totalSupply)} shares`);
            
            return {
                shares: ethers.formatEther(shares),
                assetsValue: ethers.formatEther(assetsFromShares),
                totalAssets: ethers.formatEther(totalAssets),
                totalSupply: ethers.formatEther(totalSupply)
            };
            
        } catch (error) {
            console.error('❌ Failed to check vault position:', error.message);
            return null;
        }
    }

    /**
     * 🎯 Execute complete WETH → Vault strategy
     */
    async executeVaultStrategy(wethAmount) {
        try {
            console.log('🎯 EXECUTING WETH → BERABORROW VAULT STRATEGY');
            console.log('='.repeat(60));
            
            // Step 1: Check current balances
            console.log('\n💰 Step 1: Checking WETH balance...');
            const balances = await this.checkWETHBalance();
            
            if (!balances || parseFloat(balances.balance) < wethAmount) {
                throw new Error(`❌ Insufficient WETH balance. Have: ${balances?.balance || '0'}, Need: ${wethAmount}`);
            }
            
            // Step 2: Approve if needed
            if (parseFloat(balances.allowance) < wethAmount) {
                console.log('\n✅ Step 2: Approving WETH...');
                await this.approveWETH(wethAmount);
            } else {
                console.log('\n✅ Step 2: WETH already approved');
            }
            
            // Step 3: Deposit into vault
            console.log('\n🏦 Step 3: Depositing WETH into vault...');
            const result = await this.depositWETH(wethAmount);
            
            console.log('\n🎉 STRATEGY EXECUTED SUCCESSFULLY!');
            console.log(`💎 Deposited: ${wethAmount} WETH`);
            console.log(`🏆 Received: ${result.expectedShares} vault shares`);
            console.log(`📄 Transaction: ${result.txHash}`);
            
            return result;
            
        } catch (error) {
            console.error('❌ Strategy execution failed:', error.message);
            throw error;
        }
    }
}

// 🚀 Main execution function
async function main() {
    const vaultManager = new BerabarrowVaultManager();
    
    try {
        // Configuration
        const WETH_AMOUNT = parseFloat(process.env.DEFAULT_ETH_AMOUNT) || 0.1; // Start small
        
        console.log(`🎯 Starting with ${WETH_AMOUNT} WETH`);
        
        // Connect wallet
        await vaultManager.connectWallet();
        
        // Execute strategy
        await vaultManager.executeVaultStrategy(WETH_AMOUNT);
        
    } catch (error) {
        console.error('❌ Execution failed:', error.message);
        process.exit(1);
    }
}

// Export for use in other scripts
module.exports = { BerabarrowVaultManager };

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
} 