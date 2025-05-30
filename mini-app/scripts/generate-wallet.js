import pkg from "hardhat";
const { ethers } = pkg;

async function main() {
  console.log("🔐 Generating a new test wallet...\n");

  // Generate a random wallet
  const wallet = ethers.Wallet.createRandom();

  console.log("📝 New Wallet Information:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`Address: ${wallet.address}`);
  console.log(`Private Key: ${wallet.privateKey}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  console.log("⚠️  IMPORTANT SECURITY NOTES:");
  console.log("1. This is for TESTING ONLY");
  console.log("2. Never use this wallet for real funds");
  console.log("3. Store the private key securely");
  console.log("4. Add the private key to your .env.local file\n");

  console.log("📋 Next Steps:");
  console.log("1. Add this to your .env.local file:");
  console.log(`   PRIVATE_KEY=${wallet.privateKey}`);
  console.log("2. Send some test ETH to this address:");
  console.log(`   ${wallet.address}`);
  console.log("3. Use a World Chain testnet faucet or bridge ETH");

  console.log("\n🌐 World Chain Testnet Info:");
  console.log("Chain ID: 4801");
  console.log("RPC URL: https://worldchain-sepolia.g.alchemy.com/public");
  console.log("Explorer: https://worldscan.org (testnet)");
}

main()
  .then(() => {
    console.log("\n✅ Wallet generation completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
