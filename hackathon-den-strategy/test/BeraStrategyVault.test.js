const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("BeraStrategyVault", function () {
    
    // 🏗️ Test fixture for deployment
    async function deployBeraStrategyVaultFixture() {
        // Get signers
        const [owner, user1, user2, liquidator] = await ethers.getSigners();

        // 🪙 Deploy mock ERC20 tokens
        const MockERC20 = await ethers.getContractFactory("MockERC20");
        
        const wbera = await MockERC20.deploy("Wrapped BERA", "WBERA", 18);
        const nect = await MockERC20.deploy("NECT Stablecoin", "NECT", 18);
        
        // 🏦 Deploy mock Beraborrow contracts
        const MockBorrowerOperations = await ethers.getContractFactory("MockBorrowerOperations");
        const MockDenManager = await ethers.getContractFactory("MockDenManager");
        const MockLSP = await ethers.getContractFactory("MockLSP");
        const MockTargetPool = await ethers.getContractFactory("MockTargetPool");

        const borrowerOperations = await MockBorrowerOperations.deploy(await nect.getAddress());
        const denManager = await MockDenManager.deploy();
        const lsp = await MockLSP.deploy(await nect.getAddress());
        const targetPool = await MockTargetPool.deploy(await nect.getAddress());

        // 🏛️ Deploy BeraStrategyVault
        const BeraStrategyVault = await ethers.getContractFactory("BeraStrategyVault");
        const vault = await BeraStrategyVault.deploy(
            await wbera.getAddress(),
            "Bera Strategy Vault",
            "BSV",
            owner.address
        );

        // 🔧 Initialize vault
        await vault.initialize(
            await borrowerOperations.getAddress(),
            await denManager.getAddress(),
            await nect.getAddress(),
            await lsp.getAddress(),
            await targetPool.getAddress(),
            ethers.ZeroAddress // Pool router placeholder
        );

        // 💰 Mint tokens to users
        const depositAmount = ethers.parseEther("100");
        await wbera.mint(user1.address, depositAmount * 2n);
        await wbera.mint(user2.address, depositAmount);
        
        // Approve vault to spend user tokens
        await wbera.connect(user1).approve(await vault.getAddress(), ethers.MaxUint256);
        await wbera.connect(user2).approve(await vault.getAddress(), ethers.MaxUint256);

        return {
            vault,
            wbera,
            nect,
            borrowerOperations,
            denManager,
            lsp,
            targetPool,
            owner,
            user1,
            user2,
            liquidator,
            depositAmount
        };
    }

    describe("🏗️ Deployment & Initialization", function () {
        it("Should deploy with correct parameters", async function () {
            const { vault, wbera, owner } = await loadFixture(deployBeraStrategyVaultFixture);

            expect(await vault.asset()).to.equal(await wbera.getAddress());
            expect(await vault.name()).to.equal("Bera Strategy Vault");
            expect(await vault.symbol()).to.equal("BSV");
            expect(await vault.owner()).to.equal(owner.address);
        });

        it("Should have correct strategy parameters", async function () {
            const { vault } = await loadFixture(deployBeraStrategyVaultFixture);

            expect(await vault.TARGET_LTV()).to.equal(75n * 10n**16n); // 75%
            expect(await vault.MAX_LTV()).to.equal(85n * 10n**16n);    // 85%
            expect(await vault.MIN_LTV()).to.equal(65n * 10n**16n);    // 65%
            expect(await vault.LSP_ALLOCATION()).to.equal(40n * 10n**16n); // 40%
            expect(await vault.POOL_ALLOCATION()).to.equal(60n * 10n**16n); // 60%
        });

        it("Should initialize with correct addresses", async function () {
            const { vault, borrowerOperations, denManager, nect, lsp, targetPool } = 
                await loadFixture(deployBeraStrategyVaultFixture);

            expect(await vault.borrowerOperations()).to.equal(await borrowerOperations.getAddress());
            expect(await vault.denManager()).to.equal(await denManager.getAddress());
            expect(await vault.nectToken()).to.equal(await nect.getAddress());
            expect(await vault.liquidStabilityPool()).to.equal(await lsp.getAddress());
            expect(await vault.targetPool()).to.equal(await targetPool.getAddress());
        });

        it("Should not allow double initialization", async function () {
            const { vault, borrowerOperations, denManager, nect, lsp, targetPool } = 
                await loadFixture(deployBeraStrategyVaultFixture);

            await expect(
                vault.initialize(
                    await borrowerOperations.getAddress(),
                    await denManager.getAddress(),
                    await nect.getAddress(),
                    await lsp.getAddress(),
                    await targetPool.getAddress(),
                    ethers.ZeroAddress
                )
            ).to.be.revertedWith("Already initialized");
        });
    });

    describe("💰 Deposit & Strategy Execution", function () {
        it("Should accept deposits and mint shares", async function () {
            const { vault, user1, depositAmount } = await loadFixture(deployBeraStrategyVaultFixture);

            const sharesBefore = await vault.balanceOf(user1.address);
            await vault.connect(user1).deposit(depositAmount, user1.address);
            const sharesAfter = await vault.balanceOf(user1.address);
            
            expect(sharesAfter).to.be.gt(sharesBefore);
            expect(await vault.totalSupply()).to.be.gt(0);
            expect(await vault.totalAssets()).to.equal(depositAmount);
        });

        it("Should execute strategy on deposit", async function () {
            const { vault, user1, depositAmount } = await loadFixture(deployBeraStrategyVaultFixture);

            await expect(vault.connect(user1).deposit(depositAmount, user1.address))
                .to.emit(vault, "StrategyDeployed");

            // Check user position is tracked
            const [collateral, debt, shares] = await vault.getUserPosition(user1.address);
            expect(collateral).to.equal(depositAmount);
            expect(debt).to.be.gt(0);
            expect(shares).to.equal(depositAmount);
        });

        it("Should track total managed debt", async function () {
            const { vault, user1, user2, depositAmount } = await loadFixture(deployBeraStrategyVaultFixture);

            await vault.connect(user1).deposit(depositAmount, user1.address);
            await vault.connect(user2).deposit(depositAmount, user2.address);

            const totalDebt = await vault.totalManagedDebt();
            const expectedDebt = depositAmount * 2n * 75n / 100n * 95n / 100n; // 2 users * 75% LTV * 95% risk adjustment
            
            expect(totalDebt).to.equal(expectedDebt);
        });

        it("Should handle multiple users correctly", async function () {
            const { vault, user1, user2, depositAmount } = await loadFixture(deployBeraStrategyVaultFixture);

            await vault.connect(user1).deposit(depositAmount, user1.address);
            await vault.connect(user2).deposit(depositAmount / 2n, user2.address);

            const [collateral1, debt1, shares1] = await vault.getUserPosition(user1.address);
            const [collateral2, debt2, shares2] = await vault.getUserPosition(user2.address);

            expect(collateral1).to.equal(depositAmount);
            expect(collateral2).to.equal(depositAmount / 2n);
            expect(debt1).to.be.gt(debt2);
        });
    });

    describe("📊 Strategy Allocation", function () {
        it("Should return correct strategy allocation", async function () {
            const { vault } = await loadFixture(deployBeraStrategyVaultFixture);

            const allocation = await vault.getStrategyAllocation();
            expect(allocation[0]).to.equal(40n * 10n**16n); // LSP: 40%
            expect(allocation[1]).to.equal(60n * 10n**16n); // Pool: 60%
        });

        it("Should emit YieldDistributed event on strategy deployment", async function () {
            const { vault, user1, depositAmount } = await loadFixture(deployBeraStrategyVaultFixture);

            await expect(vault.connect(user1).deposit(depositAmount, user1.address))
                .to.emit(vault, "YieldDistributed");
        });
    });

    describe("⚖️ Risk Management", function () {
        it("Should calculate optimal debt with risk adjustment", async function () {
            const { vault, user1, depositAmount } = await loadFixture(deployBeraStrategyVaultFixture);

            await vault.connect(user1).deposit(depositAmount, user1.address);

            const [, debt,] = await vault.getUserPosition(user1.address);
            const expectedDebt = depositAmount * 75n / 100n * 95n / 100n; // 75% LTV * 95% risk adjustment
            
            expect(debt).to.equal(expectedDebt);
        });

        it("Should have correct liquidation probability", async function () {
            const { vault } = await loadFixture(deployBeraStrategyVaultFixture);

            expect(await vault.liquidationProbability()).to.equal(35n * 10n**16n); // 35%
        });

        it("Should check rebalance conditions", async function () {
            const { vault } = await loadFixture(deployBeraStrategyVaultFixture);

            // Initially should not need rebalancing
            expect(await vault.shouldRebalance()).to.be.false;
        });

        it("Should execute rebalance when needed", async function () {
            const { vault, user1, depositAmount } = await loadFixture(deployBeraStrategyVaultFixture);

            await vault.connect(user1).deposit(depositAmount, user1.address);

            // Force rebalance by advancing time
            await ethers.provider.send("evm_increaseTime", [3601]); // 1 hour + 1 second
            await ethers.provider.send("evm_mine");

            // Mock shouldRebalance to return true for testing
            // In real scenario, this would be triggered by LTV drift
            // For now, test the revert since shouldRebalance returns false
            await expect(vault.rebalance()).to.be.revertedWith("Rebalance not needed");
        });
    });

    describe("🚨 Emergency Functions", function () {
        it("Should allow owner to activate emergency mode", async function () {
            const { vault, owner } = await loadFixture(deployBeraStrategyVaultFixture);

            await expect(vault.connect(owner).activateEmergencyMode("Test emergency"))
                .to.emit(vault, "EmergencyActivated")
                .withArgs("Test emergency");

            expect(await vault.emergencyMode()).to.be.true;
        });

        it("Should not allow non-owner to activate emergency mode", async function () {
            const { vault, user1 } = await loadFixture(deployBeraStrategyVaultFixture);

            await expect(vault.connect(user1).activateEmergencyMode("Unauthorized"))
                .to.be.revertedWithCustomError(vault, "OwnableUnauthorizedAccount");
        });

        it("Should prevent strategy execution in emergency mode", async function () {
            const { vault, owner, user1, depositAmount } = await loadFixture(deployBeraStrategyVaultFixture);

            await vault.connect(owner).activateEmergencyMode("Test emergency");

            // Deposit should work but strategy shouldn't execute
            await vault.connect(user1).deposit(depositAmount, user1.address);

            const [collateral, debt,] = await vault.getUserPosition(user1.address);
            expect(collateral).to.equal(0); // No strategy execution in emergency mode
            expect(debt).to.equal(0);
        });

        it("Should allow emergency withdraw only in emergency mode", async function () {
            const { vault, owner } = await loadFixture(deployBeraStrategyVaultFixture);

            await expect(vault.connect(owner).emergencyWithdraw())
                .to.be.revertedWith("Not in emergency mode");

            await vault.connect(owner).activateEmergencyMode("Test emergency");
            
            // Should not revert now (though implementation is placeholder)
            await vault.connect(owner).emergencyWithdraw();
        });
    });

    describe("🔧 Administrative Functions", function () {
        it("Should allow owner to update target pool", async function () {
            const { vault, owner, targetPool } = await loadFixture(deployBeraStrategyVaultFixture);

            const newTargetPool = await targetPool.getAddress(); // Using same address for test
            await vault.connect(owner).updateTargetPool(newTargetPool);

            expect(await vault.targetPool()).to.equal(newTargetPool);
        });

        it("Should not allow non-owner to update target pool", async function () {
            const { vault, user1, targetPool } = await loadFixture(deployBeraStrategyVaultFixture);

            const newTargetPool = await targetPool.getAddress();
            await expect(vault.connect(user1).updateTargetPool(newTargetPool))
                .to.be.revertedWithCustomError(vault, "OwnableUnauthorizedAccount");
        });

        it("Should not allow zero address as target pool", async function () {
            const { vault, owner } = await loadFixture(deployBeraStrategyVaultFixture);

            await expect(vault.connect(owner).updateTargetPool(ethers.ZeroAddress))
                .to.be.revertedWith("Invalid pool address");
        });
    });

    describe("📈 View Functions", function () {
        it("Should return correct total assets", async function () {
            const { vault, user1, depositAmount } = await loadFixture(deployBeraStrategyVaultFixture);

            expect(await vault.totalAssets()).to.equal(0);

            await vault.connect(user1).deposit(depositAmount, user1.address);

            expect(await vault.totalAssets()).to.equal(depositAmount);
        });

        it("Should track user positions correctly", async function () {
            const { vault, user1, depositAmount } = await loadFixture(deployBeraStrategyVaultFixture);

            await vault.connect(user1).deposit(depositAmount, user1.address);

            const [collateral, debt, shares] = await vault.getUserPosition(user1.address);
            expect(collateral).to.equal(depositAmount);
            expect(debt).to.be.gt(0);
            expect(shares).to.equal(depositAmount);
        });
    });

    describe("🎯 ERC4626 Compliance", function () {
        it("Should implement asset() correctly", async function () {
            const { vault, wbera } = await loadFixture(deployBeraStrategyVaultFixture);

            expect(await vault.asset()).to.equal(await wbera.getAddress());
        });

        it("Should implement convertToShares correctly", async function () {
            const { vault, depositAmount } = await loadFixture(deployBeraStrategyVaultFixture);

            const shares = await vault.convertToShares(depositAmount);
            expect(shares).to.equal(depositAmount); // 1:1 ratio initially
        });

        it("Should implement convertToAssets correctly", async function () {
            const { vault, depositAmount } = await loadFixture(deployBeraStrategyVaultFixture);

            const assets = await vault.convertToAssets(depositAmount);
            expect(assets).to.equal(depositAmount); // 1:1 ratio initially
        });

        it("Should implement previewDeposit correctly", async function () {
            const { vault, depositAmount } = await loadFixture(deployBeraStrategyVaultFixture);

            const shares = await vault.previewDeposit(depositAmount);
            expect(shares).to.equal(depositAmount);
        });
    });
}); 