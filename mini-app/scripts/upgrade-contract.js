import pkg from "hardhat";
const { ethers, upgrades } = pkg;

async function main() {
  console.log("🔄 Upgrading HotelBooking contract on World Chain Mainnet...\n");

  // You need to set this to your deployed proxy address
  const PROXY_ADDRESS = process.env.PROXY_ADDRESS;

  if (!PROXY_ADDRESS) {
    console.error("❌ PROXY_ADDRESS not found in environment variables");
    console.log("Please set your PROXY_ADDRESS in .env.local file");
    console.log("Example: PROXY_ADDRESS=0x1234567890abcdef...");
    console.log(
      "\nOr run with: PROXY_ADDRESS=0x... npx hardhat run scripts/upgrade-contract.js --network worldchain"
    );
    process.exit(1);
  }

  // Verify environment setup
  if (!process.env.PRIVATE_KEY) {
    console.error("❌ PRIVATE_KEY not found in environment variables");
    process.exit(1);
  }

  // Get network info
  const network = await ethers.provider.getNetwork();
  console.log(
    `📡 Connected to network: ${network.name} (Chain ID: ${network.chainId})`
  );

  if (network.chainId !== 480n) {
    console.error("❌ Not connected to World Chain Mainnet (Chain ID: 480)");
    process.exit(1);
  }

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("🔑 Upgrading with account:", deployer.address);

  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH\n");

  try {
    console.log("📍 Proxy Address:", PROXY_ADDRESS);

    // Get current implementation
    const currentImplementation =
      await upgrades.erc1967.getImplementationAddress(PROXY_ADDRESS);
    console.log("📍 Current Implementation:", currentImplementation);

    // Get current version
    const contract = await ethers.getContractAt(
      "HotelBookingUpgradeable",
      PROXY_ADDRESS
    );
    const currentVersion = await contract.getVersion();
    console.log("📋 Current Version:", currentVersion);

    // Deploy new implementation
    console.log("\n🚀 Deploying new implementation...");
    const HotelBookingUpgradeableV2 = await ethers.getContractFactory(
      "HotelBookingUpgradeable"
    );

    console.log("⏳ Upgrading contract...");
    const upgraded = await upgrades.upgradeProxy(
      PROXY_ADDRESS,
      HotelBookingUpgradeableV2
    );

    await upgraded.waitForDeployment();

    const newImplementation = await upgrades.erc1967.getImplementationAddress(
      PROXY_ADDRESS
    );
    console.log("✅ Contract upgraded successfully!");
    console.log("📍 New Implementation:", newImplementation);

    // Test the upgrade
    console.log("\n🧪 Testing upgraded contract...");
    const newVersion = await upgraded.getVersion();
    console.log("📋 New Version:", newVersion);

    const nextPropertyId = await upgraded.nextPropertyId();
    console.log("📋 Next Property ID (preserved):", nextPropertyId.toString());

    const platformFee = await upgraded.platformFeePercentage();
    console.log("📋 Platform Fee (preserved):", platformFee.toString() + "%");

    console.log("\n📋 NEXT STEPS:");
    console.log("===============");

    console.log("\n1. 🔍 Verify new implementation on World Chain explorer:");
    console.log(
      `   npx hardhat verify --network worldchain ${newImplementation}`
    );

    console.log("\n2. 🌐 View on World Chain Explorer:");
    console.log(`   https://worldscan.org/address/${PROXY_ADDRESS}`);

    console.log(
      "\n3. ✅ Your frontend can continue using the same proxy address!"
    );
    console.log(`   Proxy Address: ${PROXY_ADDRESS}`);

    console.log("\n🎉 Upgrade completed successfully!");

    return {
      proxyAddress: PROXY_ADDRESS,
      oldImplementation: currentImplementation,
      newImplementation: newImplementation,
      oldVersion: currentVersion,
      newVersion: newVersion,
      deployer: deployer.address,
    };
  } catch (error) {
    console.error("❌ Upgrade failed:", error.message);

    if (error.message.includes("not the owner")) {
      console.log("\n💡 Tip: Only the contract owner can perform upgrades");
    } else if (error.code === "INSUFFICIENT_FUNDS") {
      console.log("\n💡 Tip: You need more ETH in your wallet for gas fees");
    }

    throw error;
  }
}

main()
  .then((result) => {
    console.log(`\n🎯 Upgrade Summary:`);
    console.log(`   Proxy: ${result.proxyAddress} (unchanged)`);
    console.log(`   Old Implementation: ${result.oldImplementation}`);
    console.log(`   New Implementation: ${result.newImplementation}`);
    console.log(`   Version: ${result.oldVersion} → ${result.newVersion}`);
    console.log(`   Upgraded by: ${result.deployer}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Fatal error during upgrade:", error);
    process.exit(1);
  });
