import pkg from "hardhat";
const { ethers } = pkg;

async function main() {
  console.log("🔍 Checking WLD Token Allowances...\n");

  // Contract addresses on Worldchain mainnet
  const WLD_TOKEN = "0x2cFc85d8E48F8EAB294be644d9E25C3030863003";
  const PERMIT2 = "0xF0882554ee924278806d708396F1a7975b732522";

  // Connect to Worldchain mainnet
  const provider = new ethers.JsonRpcProvider(
    "https://worldchain-mainnet.g.alchemy.com/public"
  );
  console.log(`🌐 Connected to Worldchain mainnet`);
  const network = await provider.getNetwork();
  console.log(`📡 Network: ${network.name} (Chain ID: ${network.chainId})\n`);

  let userAddress;

  // Try to get user address from private key in env, otherwise use placeholder
  if (process.env.PRIVATE_KEY) {
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    userAddress = wallet.address;
    console.log(`👤 Using wallet from PRIVATE_KEY: ${userAddress}`);
  } else {
    userAddress = "YOUR_WALLET_ADDRESS_HERE";
    console.log(`👤 Using placeholder address: ${userAddress}`);
    console.log(`💡 Add PRIVATE_KEY to .env for actual wallet checking\n`);
  }

  try {
    // Create WLD token contract instance
    const wldAbi = [
      "function balanceOf(address owner) view returns (uint256)",
      "function allowance(address owner, address spender) view returns (uint256)",
      "function decimals() view returns (uint8)",
      "function symbol() view returns (string)",
    ];

    const wldContract = new ethers.Contract(WLD_TOKEN, wldAbi, provider);

    // Check token info
    console.log("🪙 WLD Token Info:");
    const symbol = await wldContract.symbol();
    const decimals = await wldContract.decimals();
    console.log(`   Symbol: ${symbol}`);
    console.log(`   Decimals: ${decimals}`);

    if (userAddress === "YOUR_WALLET_ADDRESS_HERE") {
      console.log(
        "\n⚠️  Cannot check balance/allowance with placeholder address"
      );
      console.log(
        "💡 Add your PRIVATE_KEY to .env file to check your actual allowances"
      );
      return;
    }

    // Check user's WLD balance
    console.log("\n💰 User Balance:");
    try {
      const balance = await wldContract.balanceOf(userAddress);
      const balanceFormatted = ethers.formatEther(balance);
      console.log(`   WLD Balance: ${balanceFormatted} WLD`);
      console.log(`   WLD Balance (wei): ${balance.toString()}`);

      // Check if user has sufficient balance for booking
      const requiredAmount = ethers.parseEther("0.05");
      console.log(`   Required for booking: 0.05 WLD`);
      console.log(
        `   Sufficient balance: ${
          balance >= requiredAmount ? "✅ Yes" : "❌ No"
        }`
      );
    } catch (error) {
      console.log(`   ❌ Could not fetch balance: ${error.message}`);
    }

    // Check allowances
    console.log("\n🔑 Allowance Check:");
    try {
      const allowance = await wldContract.allowance(userAddress, PERMIT2);
      const allowanceFormatted = ethers.formatEther(allowance);
      console.log(`   WLD → Permit2 allowance: ${allowanceFormatted} WLD`);
      console.log(`   WLD → Permit2 allowance (wei): ${allowance.toString()}`);

      // Check if allowance is sufficient
      const requiredAmount = ethers.parseEther("0.05");
      if (allowance >= requiredAmount) {
        console.log(`   ✅ Sufficient allowance for booking`);
        console.log(`   🎉 You should be able to make bookings!`);
      } else {
        console.log(`   ❌ Insufficient allowance for booking`);
        console.log(
          `   💡 You need to approve WLD tokens for Permit2 before booking`
        );
        console.log(`   🚀 Run: node scripts/approve-wld-permit2.js`);
      }

      // Check if unlimited allowance is set
      const maxUint256 = ethers.MaxUint256;
      if (allowance === maxUint256) {
        console.log(`   🎯 Unlimited allowance set`);
      }
    } catch (error) {
      console.log(`   ❌ Could not fetch allowance: ${error.message}`);
    }

    console.log("\n📋 Summary:");
    console.log("To fix simulation_failed error:");
    console.log("1. ✅ Ensure you have sufficient WLD tokens in your wallet");
    console.log("2. 🎯 Approve WLD tokens for Permit2 contract spending");
    console.log(
      "3. ✅ Make sure you're connected to Worldchain mainnet in your wallet"
    );
    console.log("\n🛠️  Commands:");
    console.log("   Check allowances: node scripts/check-allowances.js");
    console.log("   Approve WLD: node scripts/approve-wld-permit2.js");
  } catch (error) {
    console.error("❌ Allowance check failed:", error.message);
  }
}

main().catch((error) => {
  console.error("💥 Script failed:", error);
  process.exit(1);
});
