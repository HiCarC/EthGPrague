import pkg from "hardhat";
const { ethers, network } = pkg;

async function main() {
  console.log("Testing network connection...");
  console.log("Network:", network.name);

  try {
    // Get signers
    const signers = await ethers.getSigners();
    console.log("Number of signers:", signers.length);

    if (signers.length > 0) {
      const deployer = signers[0];
      console.log("Deployer address:", deployer.address);

      // Get balance
      const balance = await deployer.provider.getBalance(deployer.address);
      console.log("Deployer balance:", ethers.formatEther(balance), "ETH");

      // Test network connection
      const blockNumber = await deployer.provider.getBlockNumber();
      console.log("Current block number:", blockNumber);
    } else {
      console.log("❌ No signers found. Check your PRIVATE_KEY in .env.local");
    }
  } catch (error) {
    console.error("❌ Network test failed:", error.message);
  }
}

main()
  .then(() => {
    console.log("✅ Network test completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
