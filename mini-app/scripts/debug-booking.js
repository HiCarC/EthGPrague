import pkg from "hardhat";
const { ethers } = pkg;

async function main() {
  console.log("🔍 Debugging Booking Parameters...\n");

  const contractAddress = "0x90b1D44c0f1b124CbF5020f30E9F107E4EfD60b1";

  // Connect to Worldchain mainnet
  const provider = new ethers.JsonRpcProvider(
    "https://worldchain-mainnet.g.alchemy.com/public"
  );
  console.log(`🌐 Connected to Worldchain mainnet`);
  const network = await provider.getNetwork();
  console.log(`📡 Network: ${network.name} (Chain ID: ${network.chainId})\n`);

  try {
    // Get contract instance
    const HotelBookingPermit2 = await ethers.getContractFactory(
      "HotelBookingPermit2"
    );
    const contract =
      HotelBookingPermit2.attach(contractAddress).connect(provider);

    // Test parameters (matching your frontend)
    const propertyId = 1;
    const totalAmountInWld = "0.05";
    const totalAmountInWei = BigInt(
      Math.floor(parseFloat(totalAmountInWld) * Math.pow(10, 18))
    );
    const guestCount = 1;

    // Create test dates
    const checkInDate = Math.floor((Date.now() + 24 * 60 * 60 * 1000) / 1000); // Tomorrow
    const checkOutDate = Math.floor(
      (Date.now() + 2 * 24 * 60 * 60 * 1000) / 1000
    ); // Day after tomorrow

    console.log("📋 Booking Parameters:");
    console.log(`   Property ID: ${propertyId}`);
    console.log(`   Check In: ${new Date(checkInDate * 1000).toISOString()}`);
    console.log(`   Check Out: ${new Date(checkOutDate * 1000).toISOString()}`);
    console.log(`   Guest Count: ${guestCount}`);
    console.log(`   Amount (WLD): ${totalAmountInWld}`);
    console.log(`   Amount (Wei): ${totalAmountInWei.toString()}`);

    // Test 1: Check if property exists and is active
    console.log("\n🧪 Test 1: Property Validation");
    try {
      const property = await contract.getProperty(propertyId);
      console.log(`✅ Property exists: ${property.name}`);
      console.log(`✅ Property active: ${property.isActive}`);
      console.log(
        `✅ Price per night: ${ethers.formatEther(property.pricePerNight)} WLD`
      );
      console.log(`✅ Max guests: ${property.maxGuests}`);

      // Calculate expected amount
      const nights = (checkOutDate - checkInDate) / (24 * 60 * 60);
      const expectedAmount = property.pricePerNight * BigInt(nights);
      console.log(`✅ Nights: ${nights}`);
      console.log(
        `✅ Expected amount: ${ethers.formatEther(expectedAmount)} WLD`
      );
      console.log(
        `✅ Your amount: ${ethers.formatEther(totalAmountInWei)} WLD`
      );
      console.log(
        `✅ Amount sufficient: ${totalAmountInWei >= expectedAmount}`
      );
    } catch (error) {
      console.log(`❌ Property validation failed: ${error.message}`);
    }

    // Test 2: Check booking availability
    console.log("\n🧪 Test 2: Booking Availability");
    try {
      const isBooked = await contract.isPropertyBooked(
        propertyId,
        checkInDate,
        checkOutDate
      );
      console.log(`✅ Property available: ${!isBooked}`);
    } catch (error) {
      console.log(`❌ Availability check failed: ${error.message}`);
    }

    // Test 3: Check contract constants
    console.log("\n🧪 Test 3: Contract Configuration");
    const wldToken = await contract.WLD_TOKEN();
    const permit2 = await contract.PERMIT2();
    console.log(`✅ WLD Token: ${wldToken}`);
    console.log(`✅ Permit2: ${permit2}`);

    // Test 4: Validate booking parameters directly
    console.log("\n🧪 Test 4: Parameter Validation");
    console.log(`✅ Property ID > 0: ${propertyId > 0}`);
    console.log(
      `✅ Check-in future: ${checkInDate > Math.floor(Date.now() / 1000)}`
    );
    console.log(`✅ Check-out after check-in: ${checkOutDate > checkInDate}`);
    console.log(`✅ Guest count > 0: ${guestCount > 0}`);
    console.log(`✅ Amount > 0: ${totalAmountInWei > 0}`);

    console.log("\n🎯 Recommendations:");
    console.log("1. Check that you have sufficient WLD tokens in your wallet");
    console.log("2. Verify the property is available for your dates");
    console.log("3. Ensure the booking amount meets the minimum requirement");
    console.log("4. Try with a smaller time range (1 night) for testing");
  } catch (error) {
    console.error("❌ Debug failed:", error.message);
  }
}

main().catch((error) => {
  console.error("💥 Debug script failed:", error);
  process.exit(1);
});
