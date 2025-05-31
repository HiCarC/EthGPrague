import pkg from "hardhat";
const { ethers } = pkg;

async function main() {
  console.log("🌍 Deploying HotelBooking contract to World Chain Mainnet...\n");

  // Verify environment setup
  if (!process.env.PRIVATE_KEY) {
    console.error("❌ PRIVATE_KEY not found in environment variables");
    console.log("Please set your PRIVATE_KEY in .env.local file");
    console.log("Example: PRIVATE_KEY=0x1234567890abcdef...");
    process.exit(1);
  }

  // Get network info
  const network = await ethers.provider.getNetwork();
  console.log(
    `📡 Connected to network: ${network.name} (Chain ID: ${network.chainId})`
  );

  if (network.chainId !== 480n) {
    console.error("❌ Not connected to World Chain Mainnet (Chain ID: 480)");
    console.log(
      "Please run: npx hardhat run scripts/deploy-worldchain.js --network worldchain"
    );
    process.exit(1);
  }

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("🔑 Deploying with account:", deployer.address);

  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH\n");

  // Check if balance is sufficient (minimum 0.01 ETH recommended)
  const minBalance = ethers.parseEther("0.01");
  if (balance < minBalance) {
    console.warn(
      "⚠️  WARNING: Low balance. Consider adding more ETH for deployment and gas fees."
    );
  }

  // Deploy the contract
  console.log("🚀 Deploying HotelBooking contract...");
  const HotelBooking = await ethers.getContractFactory("HotelBooking");

  try {
    // Estimate gas for deployment
    console.log("⏳ Estimating gas for deployment...");
    const deployTx = await HotelBooking.getDeployTransaction();
    const estimatedGas = await deployer.estimateGas(deployTx);
    const gasLimit = (estimatedGas * 120n) / 100n; // Add 20% buffer
    console.log(`📊 Estimated gas: ${estimatedGas.toString()}`);
    console.log(`📊 Gas limit (with buffer): ${gasLimit.toString()}`);

    const hotelBooking = await HotelBooking.deploy({
      gasLimit: gasLimit, // Use estimated gas with buffer
    });

    console.log("⏳ Waiting for deployment transaction to be mined...");
    await hotelBooking.waitForDeployment();

    const contractAddress = await hotelBooking.getAddress();
    console.log("✅ HotelBooking contract deployed to:", contractAddress);

    // Wait for confirmations
    console.log("⏳ Waiting for 5 confirmations...");
    const deploymentTx = hotelBooking.deploymentTransaction();
    if (deploymentTx) {
      await deploymentTx.wait(5);
      console.log("✅ Contract deployed and confirmed!");
      console.log("🔗 Transaction hash:", deploymentTx.hash);
      console.log("⛽ Gas used:", deploymentTx.gasUsed?.toString() || "N/A");
    }

    // Contract verification instructions
    console.log("\n📋 NEXT STEPS:");
    console.log("===============");

    console.log("\n1. 🔍 Verify contract on World Chain explorer:");
    console.log(
      `   npx hardhat verify --network worldchain ${contractAddress}`
    );

    console.log(
      "\n2. 📝 Update your application with the new contract address:"
    );
    console.log("   • src/services/booking.ts");
    console.log("   • .env.local (add CONTRACT_ADDRESS variable)");

    console.log("\n3. 🌐 View on World Chain Explorer:");
    console.log(`   https://worldscan.org/address/${contractAddress}`);

    console.log(`\n✨ Contract Address: ${contractAddress}`);
    console.log("\n🎉 Deployment completed successfully!");

    return {
      contractAddress,
      transactionHash: deploymentTx?.hash,
      deployer: deployer.address,
      network: network.name,
      chainId: network.chainId.toString(),
    };
  } catch (error) {
    console.error("❌ Deployment failed:", error.message);

    if (error.code === "INSUFFICIENT_FUNDS") {
      console.log("\n💡 Tip: You need more ETH in your wallet for gas fees");
    } else if (error.code === "NONCE_EXPIRED") {
      console.log(
        "\n💡 Tip: Try resetting your wallet nonce or wait a moment and retry"
      );
    }

    throw error;
  }
}

main()
  .then((result) => {
    console.log(`\n🎯 Deployment Summary:`);
    console.log(`   Contract: ${result.contractAddress}`);
    console.log(`   Deployer: ${result.deployer}`);
    console.log(`   Network: ${result.network} (${result.chainId})`);
    console.log(`   Tx Hash: ${result.transactionHash}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Fatal error during deployment:", error);
    process.exit(1);
  });
