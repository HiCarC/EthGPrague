import pkg from "hardhat";
const { ethers } = pkg;

async function main() {
  console.log("Deploying HotelBooking contract...");

  // Get the contract factory
  const HotelBooking = await ethers.getContractFactory("HotelBooking");

  // Deploy the contract
  const hotelBooking = await HotelBooking.deploy();

  // Wait for deployment to complete
  await hotelBooking.waitForDeployment();

  const contractAddress = await hotelBooking.getAddress();
  console.log("HotelBooking deployed to:", contractAddress);

  // Verify deployment
  console.log("Verifying deployment...");
  const wldTokenAddress = await hotelBooking.WLD_TOKEN();
  console.log("WLD Token Address:", wldTokenAddress);

  const platformOwner = await hotelBooking.platformOwner();
  console.log("Platform Owner:", platformOwner);

  const platformFee = await hotelBooking.platformFeePercentage();
  console.log("Platform Fee:", platformFee.toString() + "%");

  console.log("\nDeployment Summary:");
  console.log("==================");
  console.log("Contract Name: HotelBooking");
  console.log("Contract Address:", contractAddress);
  console.log("Network: World Chain Mainnet");
  console.log("WLD Token:", wldTokenAddress);
  console.log("Platform Owner:", platformOwner);
  console.log("Platform Fee:", platformFee.toString() + "%");

  console.log("\nNext steps:");
  console.log("1. Update HOTEL_BOOKING_CONTRACT_ADDRESS in your frontend");
  console.log("2. Update the contract address in your environment variables");
  console.log("3. Test the contract functions");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
