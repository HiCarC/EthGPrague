import pkg from "hardhat";
const { ethers } = pkg;

async function main() {
  console.log("Deploying HotelBooking contract to World Chain...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  // Deploy the contract
  const HotelBooking = await ethers.getContractFactory("HotelBooking");
  console.log("Deploying HotelBooking contract...");

  const hotelBooking = await HotelBooking.deploy();
  await hotelBooking.waitForDeployment();

  const contractAddress = await hotelBooking.getAddress();
  console.log("HotelBooking contract deployed to:", contractAddress);

  // Wait for a few confirmations
  console.log("Waiting for confirmations...");
  const deployTx = hotelBooking.deploymentTransaction();
  if (deployTx) {
    await deployTx.wait(3);
    console.log("Contract deployed and confirmed!");
    console.log("Transaction hash:", deployTx.hash);
  }

  // Verify contract on World Chain explorer (if supported)
  console.log("\nTo verify the contract on World Chain explorer, run:");
  console.log(
    `npx hardhat verify --network worldchain_testnet ${contractAddress}`
  );

  console.log("\n📋 IMPORTANT: Update your contract address!");
  console.log(
    "Update the following files with your deployed contract address:"
  );
  console.log("1. src/services/booking.ts");
  console.log("2. .env.local");
  console.log(`\nContract Address: ${contractAddress}`);

  return contractAddress;
}

main()
  .then((address) => {
    console.log(`\n✅ Contract deployed successfully at: ${address}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error deploying contract:", error);
    process.exit(1);
  });
