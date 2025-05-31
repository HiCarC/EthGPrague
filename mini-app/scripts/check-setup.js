import { config } from "dotenv";
import { ethers } from "ethers";

// Load environment variables
config({ path: ".env.local" });

async function checkSetup() {
  console.log("🔍 Checking World Chain deployment setup...\n");

  let allGood = true;

  // Check private key
  console.log("1. Private Key Configuration:");
  if (process.env.PRIVATE_KEY) {
    console.log("   ✅ PRIVATE_KEY found in environment");

    // Validate private key format
    try {
      const wallet = new ethers.Wallet(process.env.PRIVATE_KEY);
      console.log(`   ✅ Private key is valid`);
      console.log(`   📍 Wallet address: ${wallet.address}`);
    } catch (error) {
      console.log("   ❌ Invalid private key format");
      allGood = false;
    }
  } else {
    console.log("   ❌ PRIVATE_KEY not found in .env.local");
    console.log("   💡 Add your private key to .env.local file:");
    console.log("      PRIVATE_KEY=0x1234567890abcdef...");
    allGood = false;
  }

  // Check World Chain connection
  console.log("\n2. World Chain Mainnet Connection:");
  try {
    const provider = new ethers.JsonRpcProvider(
      "https://worldchain-mainnet.g.alchemy.com/public"
    );
    const network = await provider.getNetwork();
    console.log(`   ✅ Connected to World Chain Mainnet`);
    console.log(`   📍 Chain ID: ${network.chainId}`);
    console.log(`   📍 Network name: ${network.name}`);

    // Check wallet balance on World Chain
    if (process.env.PRIVATE_KEY) {
      try {
        const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
        const balance = await provider.getBalance(wallet.address);
        const balanceEth = ethers.formatEther(balance);
        console.log(`   💰 Wallet balance: ${balanceEth} ETH`);

        if (parseFloat(balanceEth) < 0.01) {
          console.log(
            "   ⚠️  WARNING: Low balance. You may need more ETH for deployment"
          );
        } else {
          console.log("   ✅ Sufficient balance for deployment");
        }
      } catch (error) {
        console.log("   ❌ Error checking wallet balance:", error.message);
        allGood = false;
      }
    }
  } catch (error) {
    console.log("   ❌ Cannot connect to World Chain Mainnet");
    console.log("   📝 Error:", error.message);
    allGood = false;
  }

  // Check contract file
  console.log("\n3. Smart Contract:");
  try {
    const fs = await import("fs");
    if (fs.existsSync("contracts/HotelBooking.sol")) {
      console.log("   ✅ HotelBooking.sol contract found");
    } else {
      console.log("   ❌ HotelBooking.sol contract not found");
      allGood = false;
    }
  } catch (error) {
    console.log("   ❌ Error checking contract file:", error.message);
    allGood = false;
  }

  // Check Hardhat configuration
  console.log("\n4. Hardhat Configuration:");
  try {
    const fs = await import("fs");
    if (fs.existsSync("hardhat.config.cjs")) {
      console.log("   ✅ hardhat.config.cjs found");
      console.log("   ✅ World Chain networks configured");
    } else {
      console.log("   ❌ hardhat.config.cjs not found");
      allGood = false;
    }
  } catch (error) {
    console.log("   ❌ Error checking Hardhat config:", error.message);
    allGood = false;
  }

  // Summary
  console.log("\n" + "=".repeat(50));
  if (allGood) {
    console.log("🎉 All setup checks passed! You're ready to deploy.");
    console.log("\n🚀 To deploy to World Chain Mainnet, run:");
    console.log("   npm run deploy:worldchain");
    console.log("\n🧪 To deploy to testnet first, run:");
    console.log("   npm run deploy:testnet");
  } else {
    console.log(
      "❌ Some setup issues found. Please fix them before deployment."
    );
    console.log(
      "\n📚 Need help? Check the README or World Chain documentation:"
    );
    console.log("   https://docs.worldchain.org/");
  }
  console.log("=".repeat(50));
}

checkSetup().catch(console.error);
