require('dotenv').config();
const { ethers } = require('ethers');

class BerabarrowBorrower {
    constructor() {
        // Load from environment
        this.rpcUrl = process.env.RPC_URL || 'https://bartio.rpc.berachain.com/';
        this.chainId = parseInt(process.env.CHAIN_ID) || 80084;
        
        // Beraborrow contract addresses from app.beraborrow.com
        this.contracts = {
            borrowerOperations: '0xDB32cA8f3bB099A76D4Ec713a2c2AACB3d8e84B9',
            denManager: '0x359Ba3964ED09e9570ce47B56e2d831D503db0a6',
            nectToken: '0x1cE0a25D13CE4d52071aE7e02Cf1F6606F4C79d3',
            priceFeed: '0xa686DC84330b1B3787816de2DaCa485D305c8589',
            sortedDens: '0x312711c156A8808D1bFb09c7d0Ca3A553affc3E6',
            weth: process.env.WETH_ADDRESS || '0x2f6f07cdcf3588944bf4c42ac74ff24bf56e7590'
        };
        
        // Initialize provider
        this.provider = new ethers.JsonRpcProvider(this.rpcUrl);
        
        console.log(`🏦 Using BorrowerOperations: ${this.contracts.borrowerOperations}`);
        console.log(`🍯 NECT Token: ${this.contracts.nectToken}`);
        console.log(`💎 WETH Token: ${this.contracts.weth}`);
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
            
            // Check BERA balance for gas
            const beraBalance = await this.provider.getBalance(this.address);
            console.log(`💰 BERA Balance: ${ethers.formatEther(beraBalance)} BERA`);
            
            return this.address;
        } catch (error) {
            console.error('❌ Failed to connect wallet:', error.message);
            throw error;
        }
    }

    /**
     * 💰 Check WETH balance and allowance
     */
    async checkWETHStatus() {
        try {
            const wethABI = [
                "function balanceOf(address account) external view returns (uint256)",
                "function allowance(address owner, address spender) external view returns (uint256)",
                "function approve(address spender, uint256 amount) external returns (bool)"
            ];
            
            const wethContract = new ethers.Contract(this.contracts.weth, wethABI, this.provider);
            
            const balance = await wethContract.balanceOf(this.address);
            const allowance = await wethContract.allowance(this.address, this.contracts.borrowerOperations);
            
            console.log(`💎 WETH Balance: ${ethers.formatEther(balance)} WETH`);
            console.log(`✅ WETH Allowance: ${ethers.formatEther(allowance)} WETH`);
            
            return {
                balance: ethers.formatEther(balance),
                allowance: ethers.formatEther(allowance),
                balanceWei: balance,
                allowanceWei: allowance,
                contract: wethContract
            };
        } catch (error) {
            console.error('❌ Failed to check WETH status:', error.message);
            throw error;
        }
    }

    /**
     * ✅ Approve WETH for BorrowerOperations
     */
    async approveWETH(amount) {
        try {
            console.log(`✅ Approving ${amount} WETH for BorrowerOperations...`);
            
            const wethABI = [
                "function approve(address spender, uint256 amount) external returns (bool)"
            ];
            
            const wethContract = new ethers.Contract(this.contracts.weth, wethABI, this.signer);
            const amountWei = ethers.parseEther(amount.toString());
            
            const tx = await wethContract.approve(this.contracts.borrowerOperations, amountWei);
            console.log(`🚀 Approval transaction: ${tx.hash}`);
            
            const receipt = await tx.wait();
            console.log(`✅ WETH approved successfully!`);
            
            return tx.hash;
        } catch (error) {
            console.error('❌ Failed to approve WETH:', error.message);
            throw error;
        }
    }

    /**
     * 📊 Get current ETH price
     */
    async getETHPrice() {
        try {
            const priceFeedABI = [
                "function fetchPrice() external view returns (uint256)"
            ];
            
            const priceFeed = new ethers.Contract(this.contracts.priceFeed, priceFeedABI, this.provider);
            const price = await priceFeed.fetchPrice();
            
            const ethPrice = ethers.formatEther(price);
            console.log(`📊 Current ETH Price: $${ethPrice}`);
            
            return price;
        } catch (error) {
            console.log('⚠️ Using estimated ETH price: $2500');
            return ethers.parseEther('2500'); // Fallback price
        }
    }

    /**
     * 🧮 Calculate safe NECT amount for target ratio
     */
    calculateSafeNECTAmount(wethAmount, targetRatio = 2.0) {
        // wethAmount * ethPrice / targetRatio = maxNECT
        const ethPrice = 2500; // Using fallback price for calculation
        const collateralValue = wethAmount * ethPrice;
        const maxNECT = collateralValue / targetRatio;
        
        console.log(`🧮 CALCULATION:`);
        console.log(`   💎 Collateral: ${wethAmount} WETH`);
        console.log(`   💰 ETH Price: $${ethPrice}`);
        console.log(`   📊 Collateral Value: $${collateralValue}`);
        console.log(`   🎯 Target Ratio: ${targetRatio * 100}%`);
        console.log(`   🍯 Max NECT: ${maxNECT} NECT`);
        
        return Math.floor(maxNECT * 0.95); // Use 95% of max for safety buffer
    }

    /**
     * 🏦 Open Den and borrow NECT
     */
    /**
     * 🏦 Open Den and borrow NECT
     */
    async openDenAndBorrow(wethAmount, nectAmount) {
        try {
            console.log(`🏦 Opening Den with ${wethAmount} WETH to borrow ${nectAmount} NECT...`);
            
            const borrowerOpsABI = [
                "function openDen(address denManager, address account, uint256 _maxFeePercentage, uint256 _collateralAmount, uint256 _debtAmount, address _upperHint, address _lowerHint) external"
            ];
            
            const borrowerOps = new ethers.Contract(
                this.contracts.borrowerOperations,
                borrowerOpsABI,
                this.signer
            );
            
            const wethAmountWei = ethers.parseEther(wethAmount.toString());
            const nectAmountWei = ethers.parseEther(nectAmount.toString());
            
            // Calculate collateral ratio
            const ethPrice = await this.getETHPrice();
            const collateralValue = wethAmountWei * ethPrice / ethers.parseEther('1');
            const collateralRatio = collateralValue * ethers.parseEther('1') / nectAmountWei;
            
            console.log(`💎 Collateral Ratio: ${ethers.formatEther(collateralRatio)} (${(parseFloat(ethers.formatEther(collateralRatio)) * 100).toFixed(1)}%)`);
            
            // Check minimum ratio (should be > 1.1 = 110%)
            if (collateralRatio < ethers.parseEther('1.1')) {
                throw new Error(`❌ Collateral ratio too low. Minimum: 110%, Current: ${(parseFloat(ethers.formatEther(collateralRatio)) * 100).toFixed(1)}%`);
            }
            
            // Set parameters
            const maxFeePercentage = ethers.parseEther('0.005'); // 0.5% max fee
            const upperHint = ethers.ZeroAddress; // No hint for simplicity
            const lowerHint = ethers.ZeroAddress; // No hint for simplicity
            
            // Execute transaction - CORRECTED with proper parameters
            const tx = await borrowerOps.openDen(
                this.contracts.denManager,  // First parameter: denManager address
                this.address,               // Second parameter: account (your wallet)
                maxFeePercentage,          // Third parameter: max fee
                wethAmountWei,             // Fourth parameter: collateral amount
                nectAmountWei,             // Fifth parameter: debt amount
                upperHint,                 // Sixth parameter: upper hint
                lowerHint                  // Seventh parameter: lower hint
            );
            
            console.log(`🚀 Transaction sent: ${tx.hash}`);
            console.log(`⏳ Waiting for confirmation...`);
            
            const receipt = await tx.wait();
            console.log(`✅ Den opened successfully!`);
            console.log(`📄 Transaction confirmed in block: ${receipt.blockNumber}`);
            
            return {
                txHash: tx.hash,
                blockNumber: receipt.blockNumber,
                wethDeposited: wethAmount,
                nectBorrowed: nectAmount,
                collateralRatio: ethers.formatEther(collateralRatio)
            };
            
        } catch (error) {
            console.error('❌ Failed to open den:', error.message);
            throw error;
        }
    }

    /**
     * 📊 Check Den status
     */
    async checkDenStatus() {
        try {
            console.log(`📊 Checking Den status...`);
            
            const denManagerABI = [
                "function getDenColl(address _borrower) external view returns (uint256)",
                "function getDenDebt(address _borrower) external view returns (uint256)",
                "function getDenStatus(address _borrower) external view returns (uint256)"
            ];
            
            const denManager = new ethers.Contract(this.contracts.denManager, denManagerABI, this.provider);
            
            try {
                const collateral = await denManager.getDenColl(this.address);
                const debt = await denManager.getDenDebt(this.address);
                const status = await denManager.getDenStatus(this.address);
                
                console.log(`💎 Collateral: ${ethers.formatEther(collateral)} WETH`);
                console.log(`🍯 Debt: ${ethers.formatEther(debt)} NECT`);
                console.log(`📊 Status: ${status.toString()} (0=closed, 1=active)`);
                
                // Check NECT balance
                const nectABI = ["function balanceOf(address account) external view returns (uint256)"];
                const nectToken = new ethers.Contract(this.contracts.nectToken, nectABI, this.provider);
                const nectBalance = await nectToken.balanceOf(this.address);
                
                console.log(`🍯 NECT Balance: ${ethers.formatEther(nectBalance)} NECT`);
                
                return {
                    collateral: ethers.formatEther(collateral),
                    debt: ethers.formatEther(debt),
                    status: status.toString(),
                    nectBalance: ethers.formatEther(nectBalance)
                };
            } catch (error) {
                console.log(`ℹ️  No existing den found (this is normal for first-time users)`);
                return {
                    collateral: '0',
                    debt: '0',
                    status: '0',
                    nectBalance: '0'
                };
            }
            
        } catch (error) {
            console.error('❌ Failed to check den status:', error.message);
            return null;
        }
    }

    /**
     * 🎯 Execute complete borrowing strategy
     */
    async executeBorrowingStrategy(wethAmount, targetRatio = 2.0) {
        try {
            console.log('🎯 EXECUTING BERABORROW BORROWING STRATEGY');
            console.log('='.repeat(60));
            console.log(`💎 Collateral: ${wethAmount} WETH`);
            console.log(`🎯 Target Ratio: ${targetRatio * 100}%`);
            
            // Calculate safe NECT amount
            const nectAmount = this.calculateSafeNECTAmount(wethAmount, targetRatio);
            console.log(`🍯 Safe NECT to borrow: ${nectAmount} NECT`);
            console.log('');
            
            // Step 1: Check WETH status
            console.log('💰 Step 1: Checking WETH balance and allowance...');
            const wethStatus = await this.checkWETHStatus();
            
            if (parseFloat(wethStatus.balance) < wethAmount) {
                throw new Error(`❌ Insufficient WETH. Have: ${wethStatus.balance}, Need: ${wethAmount}`);
            }
            
            // Step 2: Approve if needed
            if (parseFloat(wethStatus.allowance) < wethAmount) {
                console.log('\n✅ Step 2: Approving WETH...');
                await this.approveWETH(wethAmount);
            } else {
                console.log('\n✅ Step 2: WETH already approved');
            }
            
            // Step 3: Check current den status
            console.log('\n📊 Step 3: Checking current den status...');
            await this.checkDenStatus();
            
            // Step 4: Open den and borrow
            console.log('\n🏦 Step 4: Opening den and borrowing NECT...');
            const result = await this.openDenAndBorrow(wethAmount, nectAmount);
            
            // Step 5: Verify operation
            console.log('\n✅ Step 5: Verifying borrowing operation...');
            await this.checkDenStatus();
            
            console.log('\n🎉 BORROWING STRATEGY EXECUTED SUCCESSFULLY!');
            console.log(`💎 Collateral deposited: ${wethAmount} WETH`);
            console.log(`🍯 NECT borrowed: ${nectAmount} NECT`);
            console.log(`📊 Collateral ratio: ${(parseFloat(result.collateralRatio) * 100).toFixed(1)}%`);
            console.log(`📄 Transaction: ${result.txHash}`);
            console.log(`\n💡 Next steps: You can now swap NECT for other tokens or use in yield farming!`);
            
            return result;
            
        } catch (error) {
            console.error('❌ Borrowing strategy failed:', error.message);
            throw error;
        }
    }
}

// 🚀 Main execution function
async function main() {
    const borrower = new BerabarrowBorrower();
    
    try {
        // Configuration for 200% ratio with 0.06 WETH
        const WETH_COLLATERAL = 0.06; // Your requested amount
        const TARGET_RATIO = 2.0; // 200% collateral ratio
        
        console.log(`🎯 Strategy: Deposit ${WETH_COLLATERAL} WETH at ${TARGET_RATIO * 100}% ratio`);
        
        // Connect wallet
        await borrower.connectWallet();
        
        // Execute borrowing strategy with auto-calculated NECT amount
        await borrower.executeBorrowingStrategy(WETH_COLLATERAL, TARGET_RATIO);
        
    } catch (error) {
        console.error('❌ Execution failed:', error.message);
        process.exit(1);
    }
}

// Export for use in other scripts
module.exports = { BerabarrowBorrower };

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
} 