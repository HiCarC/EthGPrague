import pkg from "hardhat";
const { ethers } = pkg;

async function main() {
  console.log("🔍 Verifying HotelBookingPermit2 contract...\n");

  const contractAddress = "0xc7663Be8fD3860cCd91D6e2D8ae94251258d8412";

  // Get network info
  const network = await ethers.provider.getNetwork();
  console.log(`📡 Network: ${network.name} (Chain ID: ${network.chainId})`);

  try {
    // Get contract instance
    const HotelBookingPermit2 = await ethers.getContractFactory(
      "HotelBookingPermit2"
    );
    const contract = HotelBookingPermit2.attach(contractAddress);

    console.log(`📋 Contract Address: ${contractAddress}`);

    // Test basic contract functions
    console.log("🧪 Testing contract functions...");

    // Check nextPropertyId
    const nextPropertyId = await contract.nextPropertyId();
    console.log(`✅ nextPropertyId: ${nextPropertyId}`);

    // Check nextBookingId
    const nextBookingId = await contract.nextBookingId();
    console.log(`✅ nextBookingId: ${nextBookingId}`);

    // Check platform fee
    const platformFee = await contract.platformFeePercentage();
    console.log(`✅ platformFeePercentage: ${platformFee}%`);

    // Check WLD token address
    const wldToken = await contract.WLD_TOKEN();
    console.log(`✅ WLD_TOKEN: ${wldToken}`);

    // Check Permit2 address
    const permit2 = await contract.PERMIT2();
    console.log(`✅ PERMIT2: ${permit2}`);

    // Get all active properties
    const properties = await contract.getAllActiveProperties();
    console.log(`✅ Active properties count: ${properties.length}`);

    console.log("\n🎉 Contract verification successful!");
    console.log("📝 The contract is deployed and working correctly.");

    return {
      contractAddress,
      nextPropertyId: nextPropertyId.toString(),
      nextBookingId: nextBookingId.toString(),
      platformFee: platformFee.toString(),
      wldToken,
      permit2,
      activeProperties: properties.length,
    };
  } catch (error) {
    console.error("❌ Contract verification failed:", error.message);
    throw error;
  }
}

main()
  .then((result) => {
    console.log("\n📊 Contract Status Summary:");
    console.log(`   Address: ${result.contractAddress}`);
    console.log(`   Next Property ID: ${result.nextPropertyId}`);
    console.log(`   Next Booking ID: ${result.nextBookingId}`);
    console.log(`   Platform Fee: ${result.platformFee}%`);
    console.log(`   Active Properties: ${result.activeProperties}`);
    console.log(`   WLD Token: ${result.wldToken}`);
    console.log(`   Permit2: ${result.permit2}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Verification failed:", error);
    process.exit(1);
  });
