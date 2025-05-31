import pkg from "hardhat";
const { ethers, upgrades } = pkg;

async function main() {
  console.log(
    "🌍 Deploying Upgradeable HotelBooking contract to World Chain Mainnet...\n"
  );

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
      "Please run: npx hardhat run scripts/deploy-upgradeable.js --network worldchain"
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

  // Deploy the upgradeable contract
  console.log("🚀 Deploying Upgradeable HotelBooking contract...");

  try {
    const HotelBookingUpgradeable = await ethers.getContractFactory(
      "HotelBookingUpgradeable"
    );

    console.log("⏳ Deploying proxy and implementation...");
    const hotelBooking = await upgrades.deployProxy(
      HotelBookingUpgradeable,
      [], // No constructor args needed since we use initialize()
      {
        initializer: "initialize",
        kind: "uups",
      }
    );

    await hotelBooking.waitForDeployment();

    const proxyAddress = await hotelBooking.getAddress();
    const implementationAddress =
      await upgrades.erc1967.getImplementationAddress(proxyAddress);

    console.log("✅ Upgradeable HotelBooking contract deployed!");
    console.log("📍 Proxy Address:", proxyAddress);
    console.log("📍 Implementation Address:", implementationAddress);

    // Wait for confirmations
    console.log("⏳ Waiting for 5 confirmations...");
    const deploymentTx = hotelBooking.deploymentTransaction();
    if (deploymentTx) {
      await deploymentTx.wait(5);
      console.log("✅ Contract deployed and confirmed!");
      console.log("🔗 Transaction hash:", deploymentTx.hash);
    }

    // Test basic functionality
    console.log("\n🧪 Testing basic functionality...");
    const version = await hotelBooking.getVersion();
    console.log("📋 Contract version:", version);

    const nextPropertyId = await hotelBooking.nextPropertyId();
    console.log("📋 Next Property ID:", nextPropertyId.toString());

    const platformFee = await hotelBooking.platformFeePercentage();
    console.log("📋 Platform Fee:", platformFee.toString() + "%");

    // Contract verification and next steps
    console.log("\n📋 NEXT STEPS:");
    console.log("===============");

    console.log("\n1. 🔍 Verify proxy contract on World Chain explorer:");
    console.log(`   npx hardhat verify --network worldchain ${proxyAddress}`);

    console.log("\n2. 🔍 Verify implementation contract:");
    console.log(
      `   npx hardhat verify --network worldchain ${implementationAddress}`
    );

    console.log("\n3. 📝 Update your application with the new proxy address:");
    console.log("   • src/services/booking.ts");
    console.log("   • .env.local (add CONTRACT_ADDRESS variable)");

    console.log("\n4. 🌐 View on World Chain Explorer:");
    console.log(`   https://worldscan.org/address/${proxyAddress}`);

    console.log("\n5. 🔄 To upgrade in the future:");
    console.log("   • Modify HotelBookingUpgradeable.sol");
    console.log(
      "   • Run: npx hardhat run scripts/upgrade-contract.js --network worldchain"
    );

    console.log(`\n✨ Proxy Address (use this): ${proxyAddress}`);
    console.log(`\n✨ Implementation Address: ${implementationAddress}`);
    console.log("\n🎉 Upgradeable deployment completed successfully!");

    return {
      proxyAddress,
      implementationAddress,
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
    console.log(`   Proxy: ${result.proxyAddress}`);
    console.log(`   Implementation: ${result.implementationAddress}`);
    console.log(`   Deployer: ${result.deployer}`);
    console.log(`   Network: ${result.network} (${result.chainId})`);
    console.log(`   Tx Hash: ${result.transactionHash}`);

    console.log(
      `\n🔑 IMPORTANT: Use the Proxy Address (${result.proxyAddress}) in your app!`
    );
    console.log(`   This address will remain the same even after upgrades.`);

    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Fatal error during deployment:", error);
    process.exit(1);
  });
